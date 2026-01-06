// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

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

// Export services to use in other files
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const database = getDatabase(app);
export default app;