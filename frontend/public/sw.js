/* Alive Health UG — Web Push service worker for medicine reminders */

self.addEventListener('push', (event) => {
  let payload = {
    title: 'Alive Health UG',
    body: 'You have a medicine reminder',
    url: '/patient/medicines',
    tag: 'alive-health-medicine'
  };

  try {
    if (event.data) {
      payload = { ...payload, ...event.data.json() };
    }
  } catch {
    try {
      payload.body = event.data.text();
    } catch {
      /* ignore */
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || 'Alive Health UG', {
      body: payload.body || payload.message || '',
      icon: '/logo.png',
      badge: '/logo.png',
      tag: payload.tag || 'alive-health-medicine',
      renotify: true,
      data: {
        url: payload.url || payload.actionUrl || '/patient/medicines',
        ...(payload.data || {})
      }
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/patient/medicines';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
      return undefined;
    })
  );
});
