/* eslint-disable no-restricted-globals */

// Import and initialize the Firebase SDK
// These are the "compat" libraries that are designed to work with importScripts.
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// IMPORTANT: Replace with your actual Firebase config from the Firebase Console
// Your Firebase project configuration
const firebaseConfig = {
   apiKey: "AIzaSyCR2UerdaLcrpE_HYYdHCb0Blrh42pnUKA",
  authDomain: "totobhandhu.firebaseapp.com",
  projectId: "totobhandhu",
  storageBucket: "totobhandhu.firebasestorage.app",
  messagingSenderId: "410190429747",
  appId: "1:410190429747:web:d877b934d1d56bd26c2d46",
  measurementId: "G-RT1WQ9SMHF"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle background messages
// messaging.onBackgroundMessage((payload) => {
//   console.log('[firebase-messaging-sw.js] Received background message ', payload);

//   const notificationTitle = payload.notification.title;
//   const notificationOptions = {
//     body: payload.notification.body,
//     icon: '/image/toto_icon.png' // Use a proper icon path
//   };

//   self.registration.showNotification(notificationTitle, notificationOptions);
// });
messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(
    payload.notification.title,
    {
      body: payload.notification.body,
      icon: "/image/toto_icon.png",
      badge: "/badge.png"
    }
  );
});
// Handle notification clicks (merged from sw.js)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (const client of clientList) {
        if (client.url.endsWith(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window/tab with the target URL
      if (clients.openWindow) return clients.openWindow(urlToOpen);
    })
  );
});