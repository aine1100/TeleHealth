import api from '../services/apiClient';

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
};

export const isDeviceNotificationSupported = () =>
  typeof window !== 'undefined' &&
  'Notification' in window &&
  'serviceWorker' in navigator &&
  'PushManager' in window;

export const getNotificationPermission = () => {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
};

export const showLocalNotification = ({ title, body, tag, url } = {}) => {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;

  try {
    const notification = new Notification(title || 'Alive Health UG', {
      body: body || '',
      icon: '/logo.png',
      tag: tag || 'alive-health-medicine',
      renotify: true
    });
    notification.onclick = () => {
      window.focus();
      if (url) window.location.href = url;
      notification.close();
    };
    return true;
  } catch {
    return false;
  }
};

export const registerPushServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) return null;
  const registration = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;
  return registration;
};

export const enableDeviceNotifications = async () => {
  if (!isDeviceNotificationSupported()) {
    const error = new Error('Notifications are not supported in this browser');
    error.code = 'UNSUPPORTED';
    throw error;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    const error = new Error('Notification permission was not granted');
    error.code = 'DENIED';
    throw error;
  }

  const keyRes = await api.get('/api/notifications/push/vapid-public-key');
  const publicKey = keyRes?.data?.data?.publicKey;
  if (!publicKey) {
    const error = new Error('Push notifications are not configured on the server');
    error.code = 'NO_VAPID';
    throw error;
  }

  const registration = await registerPushServiceWorker();
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });
  }

  await api.post('/api/notifications/push/subscribe', {
    subscription: subscription.toJSON()
  });

  return { permission, subscription };
};

export const disableDeviceNotifications = async () => {
  if (!('serviceWorker' in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager?.getSubscription();
  if (subscription) {
    const endpoint = subscription.endpoint;
    await subscription.unsubscribe().catch(() => null);
    await api.post('/api/notifications/push/unsubscribe', { endpoint }).catch(() => null);
  }
};
