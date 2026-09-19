// FSP Trainer — push-bildirishnoma service worker
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = { title: 'FSP Trainer', body: event.data ? event.data.text() : '' }; }
  const title = data.title || 'FSP Trainer';
  const options = {
    body: data.body || 'Zeit für Ihre heutige Übung!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: data.url || '/daily' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/home';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((list) => {
      for (const c of list) { if (c.url.includes(url) && 'focus' in c) return c.focus(); }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
