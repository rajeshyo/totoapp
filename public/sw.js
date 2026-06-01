// Service Worker for Push Notifications

self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(clients.claim());
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = '/';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window/tab with the target URL
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle push events
self.addEventListener('push', (event) => {
  if (event.data) {
    const options = {
      body: event.data.text(),
      icon: '🛺',
      badge: '🛺',
      vibrate: [100, 50, 100]
    };

    event.waitUntil(
      self.registration.showNotification('TotoBondhu', options)
    );
  }
});
