import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// ඔබේ පරණ app.js එකේ තිබුණු "firebaseConfig" කොටස මෙතනට copy කරන්න.
// උදාහරණයක් ලෙස:
const firebaseConfig = {
  apiKey: "AIzaSyD....", 
  authDomain: "drivelink-....firebaseapp.com",
  databaseURL: "https://drivelink-....firebasedatabase.app",
  projectId: "drivelink-...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);