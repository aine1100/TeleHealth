import { io } from 'socket.io-client';
import { getApiBaseUrl } from './apiUrl';
import { isMobileDevice } from './webrtcConfig';

let socketInstance = null;
let socketUrl = null;

export const getSocket = () => {
  const nextUrl = getApiBaseUrl();

  if (socketInstance && socketUrl !== nextUrl) {
    socketInstance.disconnect();
    socketInstance = null;
  }

  if (!socketInstance) {
    socketUrl = nextUrl;
    const sameOrigin = nextUrl === '';
    const isDevProxy = sameOrigin && process.env.NODE_ENV === 'development';
    const mobile = typeof navigator !== 'undefined' && isMobileDevice();

    // Mobile networks often block WebSocket initially — start with polling.
    socketInstance = io(nextUrl || undefined, {
      path: '/socket.io',
      transports: mobile || isDevProxy ? ['polling', 'websocket'] : ['websocket', 'polling'],
      upgrade: true,
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 12,
      timeout: 20000
    });
  }

  return socketInstance;
};

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
    socketUrl = null;
  }
};

export default getSocket;
