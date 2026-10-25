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

export function normalizeServerUrl(rawUrl: string): string {
  let trimmed = rawUrl.trim();
  if (!trimmed) return LOCAL_DEV_BACKEND;
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    trimmed = `http://${trimmed}`;
  }
  // If no port specified and it looks like an IP or localhost, add default backend port 3001
  try {
    const parsed = new URL(trimmed);
    if (!parsed.port && (parsed.hostname === 'localhost' || isLanIp(parsed.hostname))) {
      parsed.port = '3001';
      return parsed.toString().replace(/\/$/, '');
    }
    return trimmed.replace(/\/$/, '');
  } catch {
    return trimmed;
  }
}

export function resolveServerUrl(): string {
  if (typeof window !== 'undefined' && window.location) {
    const params = new URLSearchParams(window.location.search);
    const serverParam = params.get('server');
    if (serverParam) {
      const normalized = normalizeServerUrl(serverParam);
      if (window.localStorage) {
        localStorage.setItem('type_fighter_server_url', normalized);
      }
      return normalized;
    }
  }

  // Check user manual override in localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    const saved = localStorage.getItem('type_fighter_server_url');
    if (saved) return normalizeServerUrl(saved);
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

    // 3. Fallback to same-origin backend
    if (window.location.port === '5173') {
      return `http://${host}:3001`;
    }
  }

  if (envUrl) return normalizeServerUrl(envUrl);
  return LOCAL_DEV_BACKEND;
}

let activeServerUrl = resolveServerUrl();
let socket: Socket | null = null;
let failedAttempts = 0;

export function getServerUrl(): string {
  return activeServerUrl;
}

export function setServerUrl(newUrl: string): void {
  const normalized = normalizeServerUrl(newUrl);
  if (activeServerUrl !== normalized) {
    activeServerUrl = normalized;
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('type_fighter_server_url', normalized);
    }
    disconnectSocket();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('server-url-changed', { detail: normalized }));
    }
  }
}

export function getSocket(): Socket {
  if (!socket) {
    socket = io(activeServerUrl, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
      transports: ['websocket', 'polling']
    });

    socket.on('connect_error', (err) => {
      failedAttempts++;
      console.warn(`[SocketClient] Failed to connect to ${activeServerUrl} (attempt ${failedAttempts}):`, err?.message || err);
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
