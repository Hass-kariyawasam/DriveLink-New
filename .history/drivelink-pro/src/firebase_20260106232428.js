import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getMessaging, getToken, onMessage } from "firebase/messaging"; // 1. Messaging Import

const firebaseConfig = {
  apiKey: "AIzaSyAa9bahojYMk_1meGG8YCgUDFNj6MEHPeI",
  authDomain: "espclientsnew.firebaseapp.com",
  databaseURL: "https://espclientsnew-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "espclientsnew",
  storageBucket: "espclientsnew.firebasestorage.app",
  messagingSenderId: "196283041268",
  appId: "1:196283041268:web:6f24e1202238bf01fea5a1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const database = getDatabase(app);
export const storage = getStorage(app);
export const messaging = getMessaging(app); // 2. Messaging Initialize

export default app;

// 3. ඔයා දුන්න VAPID Key එක
const VAPID_KEY = "BLxeZkNQ7SqjSSIBA6y_Wj1m40RVHm70ppRqCS4AUiF7XPOgSboeHHnN_liEEAFyLn0RDeGR7Dciq_SQEVOf6Lk";

// 4. Notification Permission ඉල්ලන Function එක
export const requestForToken = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, { vapidKey: VAPID_KEY });
      if (token) {
        console.log('FCM Token:', token);
        // පස්සේ කාලෙක මේ Token එක User Profile එකට Save කරන්න ඕන Notifications යවන්න.
        return token;
      }
    } else {
      console.log('Notification permission denied.');
    }
  } catch (error) {
    console.error('An error occurred while retrieving token. ', error);
  }
};

// 5. App එක ඇතුලේ ඉද්දි Notification ආවොත් (Foreground Listener)
export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
});