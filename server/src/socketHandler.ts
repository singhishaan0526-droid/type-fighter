import { Server, Socket } from 'socket.io';
import { MatchManager } from './matchManager.js';
import type {
  JoinPayload,
  SelectCharacterPayload,
  SetReadyPayload,
  TypingInputPayload,
  ResumePayload,
  PlayerSlot
} from './types.js';

export function setupSocketHandlers(io: Server, matchManager: MatchManager) {
  io.on('connection', (socket: Socket) => {
    // 1. Join or Create Match Session
    socket.on('match:join', (payload: unknown) => {
      try {
        if (!payload || typeof payload !== 'object') {
          socket.emit('match:error', { code: 'BAD_PAYLOAD', message: 'Payload must be an object.' });
          return;
        }

        const data = payload as Partial<JoinPayload>;
        const sessionId = typeof data.sessionId === 'string' ? data.sessionId.trim() : '';
        const characterId = data.characterId;

        if (!sessionId || sessionId.length > 50) {
          socket.emit('match:error', { code: 'INVALID_SESSION_ID', message: 'Session ID must be between 1 and 50 characters.' });
          return;
        }

        const validCharacters = ['byte', 'glitch', 'zenko', 'nova', 'zephyr', 'raven'];
        if (!characterId || !validCharacters.includes(characterId)) {
          socket.emit('match:error', { code: 'INVALID_CHARACTER', message: 'Unknown character ID.' });
          return;
        }

        const { session, slot, reconnectToken } = matchManager.joinSession(
          sessionId,
          socket.id,
          characterId,
          data.reconnectToken
        );

        // Join socket room
        socket.join(sessionId);

        // Send full state snapshot to joining player
        socket.emit('match:state', matchManager.createSnapshot(session, slot));

        // Notify room of player joined
        socket.to(sessionId).emit('player:joined', {
          slot,
          characterId,
          isReady: false
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to join session.';
        socket.emit('match:error', { code: 'JOIN_ERROR', message });
      }
    });

    // 2. Select Character in Lobby
    socket.on('player:character', (payload: unknown) => {
      try {
        if (!payload || typeof payload !== 'object') return;
        const data = payload as Partial<SelectCharacterPayload>;
        const validCharacters = ['byte', 'glitch', 'zenko', 'nova', 'zephyr', 'raven'];
        if (!data.characterId || !validCharacters.includes(data.characterId)) return;

        const { session, slot } = matchManager.selectCharacter(socket.id, data.characterId);
        io.to(session.sessionId).emit('player:character', {
          slot,
          characterId: data.characterId,
          isReady: false
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Character select error.';
        socket.emit('match:error', { code: 'CHARACTER_ERROR', message });
      }
    });

    // 3. Player Ready
    socket.on('match:ready', (payload: unknown) => {
      try {
        if (!payload || typeof payload !== 'object') return;
        const data = payload as Partial<SetReadyPayload>;
        const isReady = !!data.ready;

        const { session, slot, bothReady } = matchManager.setReady(socket.id, isReady);

        io.to(session.sessionId).emit('player:ready', {
          slot,
          isReady
        });

        // If both players are ready, trigger countdown!
        if (bothReady && session.phase === 'ready') {
          matchManager.startCountdown(
            session.sessionId,
            (remaining) => {
              io.to(session.sessionId).emit('match:countdown', { secondsRemaining: remaining });
            },
            (startedSession) => {
              io.to(startedSession.sessionId).emit('match:started', {
                challengeId: startedSession.challengeId,
                challengeText: startedSession.challengeText,
                durationSeconds: startedSession.durationSeconds,
                startTime: startedSession.startTime || Date.now()
              });

              // Start authoritative match duration timer
              matchManager.startBattleTimer(
                startedSession.sessionId,
                (timeLeft) => {
                  // Time left update can be periodically synced or tracked by client startTime
                },
                (timeoutSession) => {
                  const finished = matchManager.evaluateTimeoutWinner(timeoutSession.sessionId);
                  if (finished && finished.p1 && finished.p2 && finished.winner) {
                    io.to(finished.sessionId).emit('match:finished', {
                      winner: finished.winner,
                      p1Stats: matchManager.getStatsSnapshot(finished.p1),
                      p2Stats: matchManager.getStatsSnapshot(finished.p2),
                      reason: 'timeout',
                      elapsedSeconds: finished.durationSeconds
                    });
                  }
                }
              );
            }
          );
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Ready status error.';
        socket.emit('match:error', { code: 'READY_ERROR', message });
      }
    });

    // 4. Authoritative Typing Input
    socket.on('typing:input', (payload: unknown) => {
      try {
        if (!payload || typeof payload !== 'object') return;
        const data = payload as Partial<TypingInputPayload>;

        if (
          typeof data.seq !== 'number' ||
          typeof data.challengeId !== 'string' ||
          typeof data.index !== 'number' ||
          typeof data.char !== 'string'
        ) {
          socket.emit('match:error', { code: 'MALFORMED_INPUT', message: 'Typing input parameters missing or invalid.' });
          return;
        }

        const result = matchManager.processTypingInput(socket.id, {
          seq: data.seq,
          challengeId: data.challengeId,
          index: data.index,
          char: data.char,
          timestamp: typeof data.timestamp === 'number' ? data.timestamp : Date.now()
        });

        if (!result.valid) {
          socket.emit('match:error', {
            code: result.errorCode || 'INVALID_INPUT',
            message: result.errorMessage || 'Invalid typing event.'
          });
          return;
        }

        const session = result.session!;
        const slot = result.slot!;
        const player = slot === 'player1' ? session.p1! : session.p2!;

        // Broadcast verified typing progress to both clients
        io.to(session.sessionId).emit('typing:progress', {
          slot,
          index: player.currentTypedIndex,
          correctKeystrokes: player.correctKeystrokes,
          totalKeystrokes: player.totalKeystrokes,
          combo: player.combo,
          maxCombo: player.maxCombo,
          wpm: player.wpm,
          accuracy: player.accuracy
        });

        // If attack occurred, broadcast combat attack & health updates
        if (result.attackEvent) {
          io.to(session.sessionId).emit('combat:attack', result.attackEvent);
        }

        if (result.healthEvents && result.healthEvents.length > 0) {
          result.healthEvents.forEach((evt) => {
            io.to(session.sessionId).emit('player:health', evt);
          });
        }

        // If match finished due to knockout, broadcast finish
        if (result.matchFinished && session.p1 && session.p2 && session.winner) {
          const elapsed = session.startTime ? Math.max(1, Math.round((Date.now() - session.startTime) / 1000)) : 1;
          io.to(session.sessionId).emit('match:finished', {
            winner: session.winner,
            p1Stats: matchManager.getStatsSnapshot(session.p1),
            p2Stats: matchManager.getStatsSnapshot(session.p2),
            reason: (session.finishReason as any) || 'knockout',
            elapsedSeconds: elapsed
          });
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Typing processing failed.';
        socket.emit('match:error', { code: 'INPUT_PROCESSING_ERROR', message });
      }
    });

    // 5. Resume Match (Reconnection)
    socket.on('match:resume', (payload: unknown) => {
      try {
        if (!payload || typeof payload !== 'object') return;
        const data = payload as Partial<ResumePayload>;
        if (typeof data.sessionId !== 'string' || typeof data.reconnectToken !== 'string') {
          socket.emit('match:error', { code: 'BAD_RESUME_PAYLOAD', message: 'Session ID and reconnect token required.' });
          return;
        }

        const { session, slot } = matchManager.resumeSession(data.sessionId, data.reconnectToken, socket.id);

        socket.join(session.sessionId);

        // Send full state snapshot to the resumed player
        socket.emit('match:state', matchManager.createSnapshot(session, slot));

        // Notify room that player reconnected
        socket.to(session.sessionId).emit('connection:status', {
          slot,
          status: 'reconnected'
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Reconnection failed.';
        socket.emit('match:error', { code: 'RESUME_FAILED', message });
      }
    });

    // 6. Explicit Leave Match
    socket.on('match:leave', () => {
      try {
        const result = matchManager.leaveSession(socket.id);
        if (result) {
          const { session, slot } = result;
          socket.leave(session.sessionId);
          // If battle was active, opponent wins by forfeit
          if (session.phase === 'battle') {
            const opponentSlot: PlayerSlot = slot === 'player1' ? 'player2' : 'player1';
            const finished = matchManager.finishMatch(session.sessionId, opponentSlot, 'forfeit');
            if (finished && finished.p1 && finished.p2) {
              const elapsed = session.startTime ? Math.max(1, Math.round((Date.now() - session.startTime) / 1000)) : 1;
              io.to(session.sessionId).emit('match:finished', {
                winner: opponentSlot,
                p1Stats: matchManager.getStatsSnapshot(finished.p1),
                p2Stats: matchManager.getStatsSnapshot(finished.p2),
                reason: 'forfeit',
                elapsedSeconds: elapsed
              });
            }
          }
        }
      } catch {
        // safe guard
      }
    });

    // 7. Socket Disconnect
    socket.on('disconnect', () => {
      try {
        const result = matchManager.handleDisconnect(socket.id, (expiredSession, disconnectedSlot) => {
          // Grace period expired without reconnecting! Opponent wins by forfeit
          if (expiredSession.phase === 'battle') {
            const opponentSlot: PlayerSlot = disconnectedSlot === 'player1' ? 'player2' : 'player1';
            const finished = matchManager.finishMatch(expiredSession.sessionId, opponentSlot, 'forfeit');
            if (finished && finished.p1 && finished.p2) {
              const elapsed = expiredSession.startTime ? Math.max(1, Math.round((Date.now() - expiredSession.startTime) / 1000)) : 1;
              io.to(expiredSession.sessionId).emit('match:finished', {
                winner: opponentSlot,
                p1Stats: matchManager.getStatsSnapshot(finished.p1),
                p2Stats: matchManager.getStatsSnapshot(finished.p2),
                reason: 'forfeit',
                elapsedSeconds: elapsed
              });
            }
          }
        });

        if (result) {
          const { session, slot } = result;
          // Notify room of disconnection status and grace period
          if (session.phase === 'battle' || session.phase === 'countdown') {
            io.to(session.sessionId).emit('connection:status', {
              slot,
              status: 'disconnected',
              graceSecondsRemaining: 15
            });
          }
        }
      } catch {
        // safe guard
      }
    });
  });
}
