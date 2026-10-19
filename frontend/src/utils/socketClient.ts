import { io, Socket } from 'socket.io-client';

export const REMOTE_PRODUCTION_BACKEND = 'https://type-fighter-d7lb.onrender.com';
export const LOCAL_DEV_BACKEND = 'http://localhost:3001';

export function isLanIp(host: string): boolean {
  if (host === 'localhost' || host === '127.0.0.1') return false;
  return (
    host.startsWith('192.168.') ||
    host.startsWith('10.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
  );
}

export function resolveServerUrl(): string {
  // Check user manual override in localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    const saved = localStorage.getItem('type_fighter_server_url');
    if (saved) return saved;
  }

  const envUrl =
    import.meta.env.VITE_SERVER_URL ||
    import.meta.env.VITE_SOCKET_URL ||
    import.meta.env.VITE_BACKEND_URL;

  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname;

    // 1. If running on desktop localhost
    if (host === 'localhost' || host === '127.0.0.1') {
      return LOCAL_DEV_BACKEND;
    }

    // 2. If mobile device or second machine is connecting over Wi-Fi / LAN IP (e.g. 192.168.1.5:5173)
    if (isLanIp(host)) {
      return `http://${host}:3001`;
    }

    // 3. If running on remote hosting (Vercel, Netlify, Render, etc.)
    return REMOTE_PRODUCTION_BACKEND;
  }

  if (envUrl) return envUrl;
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
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('type_fighter_server_url', newUrl);
    }
    disconnectSocket();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('server-url-changed', { detail: newUrl }));
    }
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

    socket.on('connect_error', () => {
      failedAttempts++;
      // Auto-failover to cloud backend if local or LAN server is unresponsive
      if (
        (activeServerUrl === LOCAL_DEV_BACKEND || activeServerUrl.includes(':3001')) &&
        failedAttempts >= 3
      ) {
        console.warn(
          `[SocketClient] Local backend (${activeServerUrl}) unreachable. Switching to cloud (${REMOTE_PRODUCTION_BACKEND})`
        );
        activeServerUrl = REMOTE_PRODUCTION_BACKEND;
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('server-url-changed', { detail: REMOTE_PRODUCTION_BACKEND })
          );
        }
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
