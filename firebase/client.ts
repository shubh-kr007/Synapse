// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAiLoLPwyFGMTqCPyWTO4wSwrqQrE-xcL4",
  authDomain: "synapse-ee601.firebaseapp.com",
  projectId: "synapse-ee601",
  storageBucket: "synapse-ee601.firebasestorage.app",
  messagingSenderId: "391774424232",
  appId: "1:391774424232:web:634471a0409272e20e069d",
  measurementId: "G-005CHS3L7C"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);