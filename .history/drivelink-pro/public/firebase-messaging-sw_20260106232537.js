importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

// ඔයාගේ Project Config එක (ඔයා එවපු විස්තර අනුව)
const firebaseConfig = {
  apiKey: "AIzaSyAa9bahojYMk_1meGG8YCgUDFNj6MEHPeI",
  authDomain: "espclientsnew.firebaseapp.com",
  databaseURL: "https://espclientsnew-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "espclientsnew",
  storageBucket: "espclientsnew.firebasestorage.app",
  messagingSenderId: "196283041268",
  appId: "1:196283041268:web:6f24e1202238bf01fea5a1"
};

// Firebase Initialize කිරීම
firebase.initializeApp(firebaseConfig);

// Messaging සේවාව ලබාගැනීම
const messaging = firebase.messaging();

// Background Message Handler
// ඇප් එක වහලා තියෙද්දි Notification එකක් ආවම මේ කොටස වැඩ කරයි
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png', // ඔයාගේ Logo එකේ නම මෙතනට දෙන්න
    badge: '/logo.png' // Status bar එකේ පෙන්වන පොඩි අයිකන් එක
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});