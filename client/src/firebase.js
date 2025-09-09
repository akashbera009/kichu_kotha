// frontend/src/firebase.js

import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
// import { messaging } from './firebase';

const firebaseConfig = {
  apiKey: "AIzaSyBLEFTuGWAYviEJYhirTtjgVLqN_-NS8kA",
  authDomain: "kichukotha-3cef6.firebaseapp.com",
  projectId: "kichukotha-3cef6",
  storageBucket: "kichukotha-3cef6.firebasestorage.app",
  messagingSenderId: "331133364938",
  appId: "1:331133364938:web:c5937ffd014781877ba233",
  measurementId: "G-F52L5DKGBX"
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);
