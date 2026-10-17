import { io, Socket } from 'socket.io-client';

export const REMOTE_PRODUCTION_BACKEND = 'https://type-fighter-d7lb.onrender.com';
export const LOCAL_DEV_BACKEND = 'http://localhost:3001';

export function resolveServerUrl(): string {
  const envUrl =
    import.meta.env.VITE_SERVER_URL ||
    import.meta.env.VITE_SOCKET_URL ||
    import.meta.env.VITE_BACKEND_URL;
  if (envUrl) return envUrl;

  // If in browser and not on localhost or 127.0.0.1, use deployed Render backend
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') {
      return REMOTE_PRODUCTION_BACKEND;
    }
  }

  return LOCAL_DEV_BACKEND;
}

let activeServerUrl = resolveServerUrl();
let socket: Socket | null = null;
let failedAttempts = 0;

export function getServerUrl(): string {
  return activeServerUrl;
}

export function setServerUrl(newUrl: string): void {
  if (activeServerUrl !== newUrl) {
    activeServerUrl = newUrl;
    disconnectSocket();
  }
}

export function getSocket(): Socket {
  if (!socket) {
    socket = io(activeServerUrl, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000
    });

    // Handle auto-failover if local server is unreachable
    socket.on('connect_error', () => {
      failedAttempts++;
      if (activeServerUrl === LOCAL_DEV_BACKEND && failedAttempts >= 2) {
        console.warn(
          `[SocketClient] Local backend (${LOCAL_DEV_BACKEND}) unreachable. Failing over to ${REMOTE_PRODUCTION_BACKEND}`
        );
        activeServerUrl = REMOTE_PRODUCTION_BACKEND;
        if (socket) {
          socket.disconnect();
          socket = null;
        }
        connectSocket();
      }
    });

    socket.on('connect', () => {
      failedAttempts = 0;
      console.log(`[SocketClient] Connected successfully to ${activeServerUrl}`);
    });
  }
  return socket;
}

export function connectSocket(): Socket {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  return s;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
