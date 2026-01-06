import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth"; // GoogleAuthProvider import කළා
import { getDatabase } from "firebase/database";

// ඔබේ පරණ Keys ටික මෙතනට දාන්න
const firebaseConfig = {
  apiKey: "AIzaSyAa9bahojYMk_1meGG8YCgUDFNj6MEHPeI",
  authDomain: "espclientsnew.firebaseapp.com",
  databaseURL: "https://espclientsnew-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "espclientsnew",
  storageBucket: "espclientsnew.firebasestorage.app",
  messagingSenderId: "196283041268",
  appId: "1:196283041268:web:6f24e1202238bf01fea5a1"
};

const app = initializeApp(firebaseConfig);

// මේවා export කරන්න ඕන
export const auth = getAuth(app);
export const db = getDatabase(app);
export const googleProvider = new GoogleAuthProvider(); // මේ පේළිය තමයි අඩුවෙලා තිබුණේ