import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MatchManager } from '../src/matchManager.js';

describe('MatchManager', () => {
  let manager: MatchManager;

  beforeEach(() => {
    manager = new MatchManager();
    vi.useFakeTimers();
  });

  it('creates a session and allows 2 players to join in player1 and player2 slots', () => {
    const { session: s1, slot: slot1, reconnectToken: t1 } = manager.joinSession('room-alpha', 'socket-1', 'byte');
    expect(slot1).toBe('player1');
    expect(t1).toBeDefined();
    expect(s1.phase).toBe('waiting');
    expect(s1.p1?.characterId).toBe('byte');
    expect(s1.p2).toBeNull();

    const { session: s2, slot: slot2, reconnectToken: t2 } = manager.joinSession('room-alpha', 'socket-2', 'glitch');
    expect(slot2).toBe('player2');
    expect(t2).toBeDefined();
    expect(t1).not.toBe(t2);
    expect(s2.phase).toBe('ready');
    expect(s2.p2?.characterId).toBe('glitch');
  });

  it('rejects a 3rd player trying to join a full session', () => {
    manager.joinSession('room-beta', 'socket-1', 'byte');
    manager.joinSession('room-beta', 'socket-2', 'glitch');

    expect(() => {
      manager.joinSession('room-beta', 'socket-3', 'zenko');
    }).toThrow('SESSION_FULL');
  });

  it('allows players to select/update their character in lobby', () => {
    manager.joinSession('room-char', 'socket-1', 'byte');
    const { session, slot } = manager.selectCharacter('socket-1', 'raven');
    expect(slot).toBe('player1');
    expect(session.p1?.characterId).toBe('raven');
  });

  it('updates ready state and flags bothReady when both players are ready', () => {
    manager.joinSession('room-ready', 'socket-1', 'byte');
    manager.joinSession('room-ready', 'socket-2', 'glitch');

    const res1 = manager.setReady('socket-1', true);
    expect(res1.bothReady).toBe(false);

    const res2 = manager.setReady('socket-2', true);
    expect(res2.bothReady).toBe(true);
  });

  it('rejects typing input if sender is not part of session', () => {
    const result = manager.processTypingInput('unknown-socket', {
      seq: 1,
      challengeId: 'c1',
      index: 0,
      char: 'T',
      timestamp: Date.now()
    });
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('UNAUTHORIZED');
  });

  it('rejects typing input if match is not in battle phase', () => {
    manager.joinSession('room-phase', 'socket-1', 'byte');
    manager.joinSession('room-phase', 'socket-2', 'glitch');

    const result = manager.processTypingInput('socket-1', {
      seq: 1,
      challengeId: 'any',
      index: 0,
      char: 'T',
      timestamp: Date.now()
    });
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('INVALID_STATE');
  });

  it('validates typing input, advances progress, and deals damage on word completion', () => {
    const { session } = manager.joinSession('room-type', 'socket-1', 'byte');
    manager.joinSession('room-type', 'socket-2', 'glitch');

    session.phase = 'battle';
    session.startTime = Date.now();
    session.challengeText = 'The quick';
    session.challengeId = 'ch-test';

    // Type 'T' (correct)
    const res1 = manager.processTypingInput('socket-1', {
      seq: 1,
      challengeId: 'ch-test',
      index: 0,
      char: 'T',
      timestamp: Date.now()
    });
    expect(res1.valid).toBe(true);
    expect(res1.isMatch).toBe(true);
    expect(session.p1?.currentTypedIndex).toBe(1);
    expect(session.p1?.combo).toBe(1);

    // Type 'h' (correct)
    const res2 = manager.processTypingInput('socket-1', {
      seq: 2,
      challengeId: 'ch-test',
      index: 1,
      char: 'h',
      timestamp: Date.now()
    });
    expect(res2.valid).toBe(true);
    expect(res2.isMatch).toBe(true);
    expect(session.p1?.currentTypedIndex).toBe(2);

    // Type 'e' (correct)
    manager.processTypingInput('socket-1', {
      seq: 3,
      challengeId: 'ch-test',
      index: 2,
      char: 'e',
      timestamp: Date.now()
    });

    // Type ' ' (space completes word 'The')
    const resWord = manager.processTypingInput('socket-1', {
      seq: 4,
      challengeId: 'ch-test',
      index: 3,
      char: ' ',
      timestamp: Date.now()
    });

    expect(resWord.valid).toBe(true);
    expect(resWord.attackEvent).toBeDefined();
    expect(resWord.attackEvent?.attackerSlot).toBe('player1');
    expect(resWord.attackEvent?.word).toBe('The');
    expect(resWord.attackEvent?.damage).toBeGreaterThan(0);
    // Opponent HP reduced
    expect(session.p2?.currentHp).toBeLessThan(100);
  });

  it('rejects stale or duplicate sequence numbers', () => {
    const { session } = manager.joinSession('room-seq', 'socket-1', 'byte');
    manager.joinSession('room-seq', 'socket-2', 'glitch');
    session.phase = 'battle';
    session.startTime = Date.now();
    session.challengeText = 'Cat';
    session.challengeId = 'ch-cat';

    manager.processTypingInput('socket-1', {
      seq: 5,
      challengeId: 'ch-cat',
      index: 0,
      char: 'C',
      timestamp: Date.now()
    });

    // Try same seq number again
    const dup = manager.processTypingInput('socket-1', {
      seq: 5,
      challengeId: 'ch-cat',
      index: 1,
      char: 'a',
      timestamp: Date.now()
    });
    expect(dup.valid).toBe(false);
    expect(dup.errorCode).toBe('STALE_SEQUENCE');

    // Try earlier seq number
    const earlier = manager.processTypingInput('socket-1', {
      seq: 4,
      challengeId: 'ch-cat',
      index: 1,
      char: 'a',
      timestamp: Date.now()
    });
    expect(earlier.valid).toBe(false);
    expect(earlier.errorCode).toBe('STALE_SEQUENCE');
  });

  it('penalizes combo and accuracy on typing mistake', () => {
    const { session } = manager.joinSession('room-err', 'socket-1', 'byte');
    manager.joinSession('room-err', 'socket-2', 'glitch');
    session.phase = 'battle';
    session.startTime = Date.now();
    session.challengeText = 'Dog';
    session.challengeId = 'ch-dog';

    // Type incorrect char 'X'
    const res = manager.processTypingInput('socket-1', {
      seq: 1,
      challengeId: 'ch-dog',
      index: 0,
      char: 'X',
      timestamp: Date.now()
    });

    expect(res.valid).toBe(true);
    expect(res.isMatch).toBe(false);
    expect(session.p1?.mistakes).toBe(1);
    expect(session.p1?.currentTypedIndex).toBe(0); // Did not advance
    expect(session.p1?.accuracy).toBeLessThan(100);
  });

  it('handles temporary disconnection and successful reconnection with token', () => {
    const { session, reconnectToken } = manager.joinSession('room-reconnect', 'socket-1', 'byte');
    manager.joinSession('room-reconnect', 'socket-2', 'glitch');

    session.phase = 'battle';
    session.startTime = Date.now();

    // Player 1 disconnects
    const onGraceExpired = vi.fn();
    const dcResult = manager.handleDisconnect('socket-1', onGraceExpired);
    expect(dcResult?.slot).toBe('player1');
    expect(session.p1?.isConnected).toBe(false);

    // Player 1 reconnects with new socket ID using valid token
    const resumeResult = manager.resumeSession('room-reconnect', reconnectToken, 'socket-1-new');
    expect(resumeResult.slot).toBe('player1');
    expect(session.p1?.isConnected).toBe(true);
    expect(session.p1?.socketId).toBe('socket-1-new');

    // Advance time beyond grace period to ensure timer was cancelled
    vi.advanceTimersByTime(20000);
    expect(onGraceExpired).not.toHaveBeenCalled();
  });

  it('triggers grace period forfeit if disconnected player does not return', () => {
    const { session } = manager.joinSession('room-forfeit', 'socket-1', 'byte');
    manager.joinSession('room-forfeit', 'socket-2', 'glitch');

    session.phase = 'battle';
    session.startTime = Date.now();

    const onGraceExpired = vi.fn();
    manager.handleDisconnect('socket-1', onGraceExpired);

    // Advance beyond 15s grace period
    vi.advanceTimersByTime(16000);
    expect(onGraceExpired).toHaveBeenCalled();
  });

  it('rejects reconnection attempts with invalid tokens', () => {
    const { session } = manager.joinSession('room-bad-token', 'socket-1', 'byte');
    manager.joinSession('room-bad-token', 'socket-2', 'glitch');
    session.phase = 'battle';

    manager.handleDisconnect('socket-1', vi.fn());

    expect(() => {
      manager.resumeSession('room-bad-token', 'forged-token-xyz', 'socket-new');
    }).toThrow('INVALID_RECONNECT_TOKEN');
  });

  it('rejects input with invalid challenge ID', () => {
    const { session } = manager.joinSession('room-bad-cid', 'socket-1', 'byte');
    manager.joinSession('room-bad-cid', 'socket-2', 'glitch');
    session.phase = 'battle';
    session.challengeId = 'real-cid';

    const res = manager.processTypingInput('socket-1', {
      seq: 1,
      challengeId: 'wrong-cid',
      index: 0,
      char: 'A',
      timestamp: Date.now()
    });

    expect(res.valid).toBe(false);
    expect(res.errorCode).toBe('INVALID_CHALLENGE');
  });

  it('rejects impossible progress when index skips ahead', () => {
    const { session } = manager.joinSession('room-skip', 'socket-1', 'byte');
    manager.joinSession('room-skip', 'socket-2', 'glitch');
    session.phase = 'battle';
    session.challengeId = 'cid-1';
    session.challengeText = 'Hello';

    // Player typed index is 0, but tries to submit index 3
    const res = manager.processTypingInput('socket-1', {
      seq: 1,
      challengeId: 'cid-1',
      index: 3,
      char: 'l',
      timestamp: Date.now()
    });

    expect(res.valid).toBe(false);
    expect(res.errorCode).toBe('IMPOSSIBLE_PROGRESS');
  });

  it('enforces rate limiting when more than 30 keystrokes arrive within 1 second', () => {
    const { session } = manager.joinSession('room-rate', 'socket-1', 'byte');
    manager.joinSession('room-rate', 'socket-2', 'glitch');
    session.phase = 'battle';
    session.challengeId = 'cid-rate';
    session.challengeText = 'A'.repeat(50);

    let lastResult;
    for (let i = 0; i < 35; i++) {
      lastResult = manager.processTypingInput('socket-1', {
        seq: i + 1,
        challengeId: 'cid-rate',
        index: i,
        char: 'A',
        timestamp: Date.now()
      });
      if (!lastResult.valid) break;
    }

    expect(lastResult?.valid).toBe(false);
    expect(lastResult?.errorCode).toBe('RATE_LIMITED');
  });

  it('cleans up session and timers completely', () => {
    manager.joinSession('room-cleanup', 'socket-1', 'byte');
    manager.joinSession('room-cleanup', 'socket-2', 'glitch');
    expect(manager.getSession('room-cleanup')).toBeDefined();

    manager.cleanupSession('room-cleanup');
    expect(manager.getSession('room-cleanup')).toBeUndefined();
    expect(manager.getSessionBySocket('socket-1')).toBeUndefined();
  });
});
