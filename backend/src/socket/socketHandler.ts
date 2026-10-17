import { Server, Socket } from 'socket.io';
import { MatchManager } from '../game/matchManager.js';
import {
  validateJoinPayload,
  validateCharacterId,
  validateTypingInputPayload,
  validateResumePayload
} from '../validation/inputValidation.js';
import type { PlayerSlot } from '@type-fighter/shared';

export function setupSocketHandlers(io: Server, matchManager: MatchManager) {
  io.on('connection', (socket: Socket) => {
    // 1. Join or Create Match Session
    socket.on('match:join', (payload: unknown) => {
      try {
        const validation = validateJoinPayload(payload);
        if (!validation.isValid || !validation.data) {
          socket.emit('match:error', {
            code: validation.errorCode || 'BAD_PAYLOAD',
            message: validation.errorMessage || 'Invalid join payload.'
          });
          return;
        }

        const { sessionId, characterId, reconnectToken } = validation.data;

        const { session, slot } = matchManager.joinSession(
          sessionId,
          socket.id,
          characterId,
          reconnectToken
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
        const charIdRaw = (payload as Record<string, unknown>).characterId;
        const validation = validateCharacterId(charIdRaw);
        if (!validation.isValid || !validation.data) {
          socket.emit('match:error', { code: validation.errorCode || 'INVALID_CHARACTER', message: validation.errorMessage || 'Invalid character.' });
          return;
        }

        const { session, slot } = matchManager.selectCharacter(socket.id, validation.data);
        io.to(session.sessionId).emit('player:character', {
          slot,
          characterId: validation.data,
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
        const isReady = !!(payload as Record<string, unknown>).ready;

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
                (_timeLeft) => {
                  // Timer tick handled
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
        const validation = validateTypingInputPayload(payload);
        if (!validation.isValid || !validation.data) {
          socket.emit('match:error', {
            code: validation.errorCode || 'MALFORMED_INPUT',
            message: validation.errorMessage || 'Invalid typing input parameters.'
          });
          return;
        }

        const result = matchManager.processTypingInput(socket.id, validation.data);

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

        // If a new challenge was loaded for this player, broadcast challenge:next
        if (result.nextChallenge) {
          io.to(session.sessionId).emit('challenge:next', {
            slot,
            challengeId: result.nextChallenge.id,
            challengeText: result.nextChallenge.text
          });
        }

        // If match finished due to knockout or completion, broadcast finish
        if (result.matchFinished && session.p1 && session.p2 && session.winner) {
          const elapsed = session.startTime ? Math.max(1, Math.round((Date.now() - session.startTime) / 1000)) : 1;
          io.to(session.sessionId).emit('match:finished', {
            winner: session.winner,
            p1Stats: matchManager.getStatsSnapshot(session.p1),
            p2Stats: matchManager.getStatsSnapshot(session.p2),
            reason: session.finishReason || 'knockout',
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
        const validation = validateResumePayload(payload);
        if (!validation.isValid || !validation.data) {
          socket.emit('match:error', {
            code: validation.errorCode || 'BAD_RESUME_PAYLOAD',
            message: validation.errorMessage || 'Invalid resume parameters.'
          });
          return;
        }

        const { session, slot } = matchManager.resumeSession(
          validation.data.sessionId,
          validation.data.reconnectToken,
          socket.id
        );

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
          } else {
            socket.to(session.sessionId).emit('player:left', { slot });
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
          // Grace period expired without reconnecting: opponent wins by forfeit
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
          } else {
            io.to(session.sessionId).emit('player:left', { slot });
          }
        }
      } catch {
        // safe guard
      }
    });
  });
}
