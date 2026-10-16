# Typing Battle — Shadow Warrior Cyber Duel

A high-octane 2D anime/cyberpunk typing combat battle game built with **Vite 8**, **React 19**, **TypeScript**, **Socket.IO**, and **Web Audio API**.

---

## ⚡ Phase 3: Online Battle Core

Phase 3 introduces the **authoritative multiplayer core**: two players on different browsers or devices connect to the same battle room, receive synchronized challenges and countdowns, submit incremental typing streams, trigger synchronized combat strikes, and receive server-validated results.

### Features
- **Server-Authoritative Combat Engine**: Server acts as single source of truth for match state, valid character sequences, attack charge, damage calculation, knockout detection, and timeout tiebreakers. Client-reported stats or damage are rejected.
- **Incremental Typing Validation**: Per-socket monotonic sequence verification, strict character-at-index matching against active challenge, rate-limiting (max 30 keystrokes/s), and protection against repeated damage exploits.
- **Live Two-Player Room Synchronization**: Synchronized character selection, readiness toggles, authoritative 3-second countdown, and live opponent typing progress bar.
- **Reconnection with 15-Second Grace Period**: Session-scoped UUID reconnect token enables a temporarily disconnected player to resume their slot and receive a complete state snapshot.
- **Single-Player Modes Preserved**: Offline Play vs Computer (Easy to Master bot with simulated human errors), Practice Duel, and Solo Dojo continue to operate independently.

---

## 🚀 Quick Start & Local Setup

### 1. Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install server dependencies
npm --prefix server install
```

### 2. Configure Environment Variables
Copy the example environment files:
```bash
# Frontend environment
cp .env.example .env

# Server environment
cp server/.env.example server/.env
```

Default variables:
- **Frontend** (`.env`):
  ```env
  VITE_SERVER_URL=http://localhost:3001
  ```
- **Backend** (`server/.env`):
  ```env
  PORT=3001
  CLIENT_ORIGIN=http://localhost:5173
  ```

### 3. Start Development Servers
Run the frontend and backend concurrently or in separate terminals:

```bash
# Option A: Start both frontend & backend concurrently
npm run dev:all

# Option B: Run in separate terminals
# Terminal 1 (Backend Socket.IO server):
npm run server

# Terminal 2 (Frontend Vite server):
npm run dev
```

The frontend will be available at `http://localhost:5173/` and the backend at `http://localhost:3001/`.

---

## 🧪 Testing

### Run All Tests
```bash
# Run both frontend & backend test suites
npm run test:all
```

### Run Server Tests Individually
```bash
npm run test:server
```
Runs 36 comprehensive backend tests covering:
- Pure combat math and damage calculations (`combatEngine.test.ts`)
- In-memory match session management, rate-limiting, and sequence verification (`matchManager.test.ts`)
- Full two-client Socket.IO battle lifecycle, character sync, ready state, attacks, disconnect grace period, and reconnection (`multiplayerIntegration.test.ts`)

### Run Frontend Tests Individually
```bash
npm test
```
Runs 21 frontend unit tests covering local combat math, character stats, and session records.

---

## 🎮 Multiplayer Two-Browser Verification Checklist

1. Start both servers (`npm run server` and `npm run dev`).
2. Open two separate browser sessions (e.g. normal tab and incognito tab) at `http://localhost:5173/`.
3. In both tabs, click **ONLINE DUEL** on the top navigation bar.
4. Enter the same Session ID (e.g. `arena-1` or generate a random one and copy it).
5. Click **CONNECT TO ARENA** on both clients.
6. Verify Tab 1 displays `PLAYER 1 (LEFT)` and Tab 2 displays `PLAYER 2 (RIGHT)`.
7. Choose different warriors (e.g. Zephyr on P1, Raven on P2) and observe real-time character sync in the lobby.
8. Click **SIGNAL READY** on both clients to trigger the synchronized 3-second countdown.
9. Type words on Tab 1 — observe combat strikes, damage floaters, HP reduction, and typing progress updating on Tab 2.
10. Test reconnection: Close or reload Tab 2 during battle; Tab 1 will display an opponent disconnect grace period alert. Reconnect from Tab 2 within 15 seconds to resume the battle session.

---

## 📡 Socket.IO Real-Time Protocol

### Client to Server Events
- `match:join`: Join or create a match session (`{ sessionId, characterId }`)
- `player:character`: Select warrior in lobby (`{ characterId }`)
- `match:ready`: Toggle ready status (`{ ready }`)
- `typing:input`: Incremental sequence-numbered keystroke (`{ seq, challengeId, index, char, timestamp }`)
- `match:leave`: Explicitly surrender or exit match
- `match:resume`: Resume session slot with reconnect token (`{ sessionId, reconnectToken }`)

### Server to Client Events
- `match:state`: Authoritative room snapshot on join/resume
- `player:joined`: Broadcast when an opponent joins
- `player:character`: Synchronize opponent character selection
- `player:ready`: Synchronize player ready state
- `match:countdown`: Authoritative countdown tick (`3, 2, 1`)
- `match:started`: Match active with challenge text and duration
- `typing:progress`: Broadcast verified typing speed and combo
- `combat:attack`: Authoritative combat attack strike event
- `player:health`: Authoritative current & max HP values
- `connection:status`: Disconnect & reconnection status with grace period seconds
- `match:finished`: Authoritative winner, stats, and finish reason (`knockout`, `timeout`, `forfeit`)
- `match:error`: Validation rejection error code and message

---

## ⚠️ Phase 3 Architectural Notes & Limitations

- **In-Memory Storage**: Match sessions and player tokens are stored in-memory on the Node.js server. If the server process restarts, active in-memory matches are lost, and clients receive a `SESSION_NOT_FOUND` error requiring a new room.
- **2-Player Rooms Only**: Exactly two players are supported per session ID; extra connections are cleanly rejected with `ROOM_FULL`.
- **Phase 4 Scope Notice**: Public matchmaking queues, room codes/lobbies browser, user accounts, and Elo rankings are reserved for Phase 4.
