import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDAwLvjEMFSDa0Qnjb4LR05iuaaNVibWcc",
  authDomain: "dashboard-5e76c.firebaseapp.com",
  projectId: "dashboard-5e76c",
  storageBucket: "dashboard-5e76c.firebasestorage.app",
  messagingSenderId: "41183782819",
  appId: "1:41183782819:web:923157652c394a452e5c16",
  measurementId: "G-2J4YRMZ1YP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);