// client/public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBLEFTuGWAYviEJYhirTtjgVLqN_-NS8kA",
  authDomain: "kichukotha-3cef6.firebaseapp.com",
  projectId: "kichukotha-3cef6",
  storageBucket: "kichukotha-3cef6.firebasestorage.app",
  messagingSenderId: "331133364938",
  appId: "1:331133364938:web:c5937ffd014781877ba233",
  measurementId: "G-F52L5DKGBX"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  const notificationTitle = payload.notification.title;
  const notificationOptions = { body: payload.notification.body };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
