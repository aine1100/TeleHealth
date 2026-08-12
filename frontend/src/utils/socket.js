import { io } from 'socket.io-client';
import { getApiBaseUrl } from './apiUrl';

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

    // nextUrl '' → connect to current page origin (Docker/nginx)
    // nextUrl 'https://api.onrender.com' → connect cross-origin to Render API
    socketInstance = io(nextUrl || undefined, {
      path: '/socket.io',
      transports: isDevProxy ? ['polling', 'websocket'] : ['websocket', 'polling'],
      upgrade: !isDevProxy,
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
