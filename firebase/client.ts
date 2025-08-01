// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAiLoLPwyFGMTqCPyWTO4wSwrqQrE-xcL4",
  authDomain: "synapse-ee601.firebaseapp.com",
  projectId: "synapse-ee601",
  storageBucket: "synapse-ee601.firebasestorage.app",
  messagingSenderId: "391774424232",
  appId: "1:391774424232:web:634471a0409272e20e069d",
  measurementId: "G-005CHS3L7C"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
// const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
