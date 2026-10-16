import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { AddressInfo } from 'net';
import express from 'express';
import { Server } from 'socket.io';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import { MatchManager } from '../src/matchManager.js';
import { setupSocketHandlers } from '../src/socketHandler.js';
import type { MatchStateSnapshot, MatchStartedEvent, TypingProgressEvent, CombatAttackEvent, PlayerHealthEvent, MatchFinishedEvent } from '../src/types.js';

describe('Multiplayer Core Integration Tests', () => {
  let server: http.Server;
  let port: number;
  let client1: ClientSocket;
  let client2: ClientSocket;
  let matchManager: MatchManager;

  beforeAll(async () => {
    const app = express();
    server = http.createServer(app);
    const ioServer = new Server(server, {
      cors: { origin: '*' }
    });

    matchManager = new MatchManager();
    setupSocketHandlers(ioServer, matchManager);

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        port = (server.address() as AddressInfo).port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (client1?.connected) client1.disconnect();
    if (client2?.connected) client2.disconnect();
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('runs complete two-player multiplayer battle lifecycle', async () => {
    const serverUrl = `http://localhost:${port}`;

    client1 = ioClient(serverUrl, { reconnection: false });
    client2 = ioClient(serverUrl, { reconnection: false });

    // Wait for both sockets to connect
    await Promise.all([
      new Promise<void>((res) => client1.on('connect', res)),
      new Promise<void>((res) => client2.on('connect', res))
    ]);

    const sessionId = `integ-battle-${Date.now()}`;

    // 1. Client 1 joins as player 1
    const p1JoinPromise = new Promise<MatchStateSnapshot>((res) => {
      client1.once('match:state', res);
    });
    client1.emit('match:join', { sessionId, characterId: 'byte' });
    const p1State = await p1JoinPromise;

    expect(p1State.yourSlot).toBe('player1');
    expect(p1State.reconnectToken).toBeDefined();
    const token1 = p1State.reconnectToken;

    // 2. Client 2 joins as player 2
    const p2JoinPromise = new Promise<MatchStateSnapshot>((res) => {
      client2.once('match:state', res);
    });
    client2.emit('match:join', { sessionId, characterId: 'glitch' });
    const p2State = await p2JoinPromise;

    expect(p2State.yourSlot).toBe('player2');
    expect(p2State.reconnectToken).toBeDefined();
    const token2 = p2State.reconnectToken;
    expect(token1).not.toBe(token2);

    // 3. Client 2 changes character to Zenko and verifies Client 1 receives update
    const p1CharUpdatePromise = new Promise<any>((res) => {
      client1.once('player:character', res);
    });
    client2.emit('player:character', { characterId: 'zenko' });
    const charUpdate = await p1CharUpdatePromise;
    expect(charUpdate.slot).toBe('player2');
    expect(charUpdate.characterId).toBe('zenko');

    // 4. Ready up and verify countdown + match start
    const startPromise1 = new Promise<MatchStartedEvent>((res) => client1.once('match:started', res));
    const startPromise2 = new Promise<MatchStartedEvent>((res) => client2.once('match:started', res));

    client1.emit('match:ready', { ready: true });
    client2.emit('match:ready', { ready: true });

    const [start1, start2] = await Promise.all([startPromise1, startPromise2]);

    // Both players receive identical challenge text & challenge ID
    expect(start1.challengeId).toBe(start2.challengeId);
    expect(start1.challengeText).toBe(start2.challengeText);
    expect(start1.challengeText.length).toBeGreaterThan(5);

    // 5. Client 1 types first character correctly
    const progressPromise = new Promise<TypingProgressEvent>((res) => {
      client2.once('typing:progress', res);
    });

    const firstChar = start1.challengeText[0];
    client1.emit('typing:input', {
      seq: 1,
      challengeId: start1.challengeId,
      index: 0,
      char: firstChar,
      timestamp: Date.now()
    });

    const progress = await progressPromise;
    expect(progress.slot).toBe('player1');
    expect(progress.index).toBe(1);
    expect(progress.correctKeystrokes).toBe(1);

    // 6. Verify duplicate sequence number is rejected by server
    const errorPromise = new Promise<any>((res) => client1.once('match:error', res));
    client1.emit('typing:input', {
      seq: 1, // Duplicate sequence!
      challengeId: start1.challengeId,
      index: 1,
      char: start1.challengeText[1],
      timestamp: Date.now()
    });
    const err = await errorPromise;
    expect(err.code).toBe('STALE_SEQUENCE');

    // 7. Verify temporary disconnect of Client 2 triggers status notification to Client 1
    const dcPromise = new Promise<any>((res) => client1.once('connection:status', res));
    client2.disconnect();
    const dcStatus = await dcPromise;
    expect(dcStatus.slot).toBe('player2');
    expect(dcStatus.status).toBe('disconnected');

    // 8. Client 2 reconnects using reconnectToken
    const client2Resumed = ioClient(serverUrl, { reconnection: false });
    await new Promise<void>((res) => client2Resumed.on('connect', res));

    const resumeStatePromise = new Promise<MatchStateSnapshot>((res) => client2Resumed.once('match:state', res));
    const resumeStatusPromise = new Promise<any>((res) => client1.once('connection:status', res));

    client2Resumed.emit('match:resume', { sessionId, reconnectToken: token2 });

    const [resumedSnapshot, reconnectedStatus] = await Promise.all([
      resumeStatePromise,
      resumeStatusPromise
    ]);

    expect(resumedSnapshot.yourSlot).toBe('player2');
    expect(resumedSnapshot.challengeId).toBe(start1.challengeId);
    expect(reconnectedStatus.slot).toBe('player2');
    expect(reconnectedStatus.status).toBe('reconnected');

    client2Resumed.disconnect();
  });
});
