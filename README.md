# Type Fighter — Shadow Warrior Cyber Duel

A high-octane 2D anime/cyberpunk typing combat duel game built with **Vite 8**, **React 19**, **TypeScript**, **Node.js**, **Express**, **Socket.IO**, and the **Web Audio API**.

---

## 🏛️ Monorepo Architecture

The project is structured as a clean, modular npm workspace monorepo:

```
type-fighter/
├── frontend/                     # React 19 + Vite 8 UI application
│   ├── public/                   # Static sound and image assets
│   ├── src/
│   │   ├── assets/               # Local styles and icons
│   │   ├── components/           # Battle HUD, Arenas, TypingConsole, Modals
│   │   ├── types/                # Frontend component types
│   │   ├── utils/                # Audio synthesizer, local records, socket client
│   │   ├── App.tsx               # Root game flow manager
│   │   ├── main.tsx              # Application entry point
│   │   └── index.css             # Cyberpunk theme, arena and finisher CSS
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/                      # Authoritative Node.js + Express + Socket.IO server
│   ├── src/
│   │   ├── config/               # Port, allowed CORS origins, environment setup
│   │   ├── game/                 # Authoritative MatchManager, CombatEngine, TypingEngine
│   │   ├── socket/               # Real-time Socket.IO multiplayer event handlers
│   │   ├── validation/           # Strong payload and sequence validation
│   │   ├── routes/               # Express health check endpoints
│   │   └── server.ts             # Server entry point
│   ├── tests/                    # Vitest unit and integration test suites
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
│
├── shared/                       # Shared contracts, types, and pure algorithms
│   ├── src/
│   │   ├── types/                # Character, FighterState, Socket Protocol & Payloads
│   │   ├── constants/            # Roster definitions, Sentences, Combat formulas, Events
│   │   ├── utils/                # Pure deterministic combat math and typing engine
│   │   └── index.ts              # Unified library export
│   ├── package.json
│   └── tsconfig.json
│
├── package.json                  # Root npm workspace configuration & runner scripts
├── .gitignore
├── .env.example
└── README.md
```

---

## ⚡ Key Systems & Features

### 1. Robust Typing Engine
- Intuitive typo recovery: incorrect characters do not permanently block progression or advance expected indices.
- Single-keystroke accuracy: backspacing and retyping never inflate correct-character counts.
- Word and sentence boundaries trigger precise combat strikes.
- Native DOM input synchronization guarantees zero drift between user input, highlighted prompt, and engine state.

### 2. Authoritative Combat & Match Completion
- Server is the single source of truth for online health, damage, shields, and match outcomes.
- Immediate knockout ends matches instantly when HP reaches zero.
- Instant win on sentence completion without recycling challenges mid-round.
- Standardized timeout scoring formula:
  $$S = 0.50P + 0.30A + 0.20H$$
  where $P$ is challenge progress %, $A$ is typing accuracy %, and $H$ is health %.
- Clean rematch resets: health, shields, timers, input, combo, and challenge reset with zero state leakage.

### 3. Close-Range Combat & Impact
- Dynamic clashing: fighters move toward one another into the center clash zone before close-range strikes connect.
- Distinct combat states: idle breathing, attack wind-up, clash strike impact, hit-stop flash, recoil knockback, and recovery.
- Central clash flare and dynamic screen shake on critical hits and finishers.

### 4. Character-Specific Finishers
Each of the 6 canonical shinobi fighters features a signature finishing move triggered upon confirmed victory:
- **Byte**: Overclock Surge — rapid electric staccato strikes, orbiting cyan lightning arcs.
- **Glitch**: Crimson Cross-Slash — digital glitch distortion, chromatic aberration, holographic afterimages.
- **Zenko**: Seismic Spirit Slam — earth-shattering spirit hammer shockwave and ground fissures.
- **Nova**: Phantom Snare — celestial purple chain sickle vortex and spirit bind runes.
- **Zephyr**: Cyclone Spear Thrust — high-speed jade wind spear vortex and supersonic dash streaks.
- **Raven**: Soul Reap Drain — obsidian soul scythe reaping slash with dark spectral raven wings.

### 5. Backend Security & Hardening
- Every incoming payload is validated on the server with `Number.isSafeInteger()` and bounded string checks.
- Per-socket monotonic sequence verification rejects stale, out-of-order, or duplicate inputs.
- Rate-limiting (max 30 keystrokes/s sliding window) prevents macro flooding.
- 15-second disconnection grace period allows temporary disconnects to resume safely via UUID token without duplicating slots.

### 6. Responsive Mobile Design
- Optimized for mobile viewports (320px, 375px, 768px, and desktop).
- Typing console remains accessible above virtual keyboards with clear tap targets.
- Resilient layouts prevent horizontal overflow and clipped action buttons.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm (v9 or higher with workspaces support)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Default configuration:
```env
PORT=3001
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development
VITE_BACKEND_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
```

### 3. Run Development Servers
Start both frontend and backend concurrently or independently:

```bash
# Start frontend client (Vite on http://localhost:5173)
npm run dev

# Start backend server (Express + Socket.IO on http://localhost:3001)
npm run dev:backend
```

---

## 🧪 Testing and Verification

Run the comprehensive test suites across the monorepo:

```bash
# Run all frontend and backend tests
npm test

# Run frontend vitest suite
npm run test:frontend

# Run backend vitest suite
npm run test:backend

# Run frontend and backend builds
npm run build:all

# Run linter
npm run lint
```

---

## 🚢 Deployment

The frontend and backend can be deployed independently as separate services:

- **Frontend Deployment (Vercel, Cloudflare Pages, Netlify)**:
  - Root directory: `frontend`
  - Build command: `npm run build`
  - Output directory: `dist`
  - Environment variable: `VITE_BACKEND_URL=https://your-backend-service.com`

- **Backend Deployment (Render, Fly.io, Railway, DigitalOcean App Platform)**:
  - Root directory: `backend`
  - Build command: `npm run typecheck`
  - Start command: `npm start`
  - Environment variables:
    - `PORT=3001`
    - `CLIENT_ORIGIN=https://your-frontend-domain.com`
    - `NODE_ENV=production`
