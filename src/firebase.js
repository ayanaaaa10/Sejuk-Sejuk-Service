// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAch410Gs96gbMTPcw8a8xlVJyjstu_o_I",
  authDomain: "sejuk-webapp-d629a.firebaseapp.com",
  projectId: "sejuk-webapp-d629a",
  storageBucket: "sejuk-webapp-d629a.firebasestorage.app",
  messagingSenderId: "28455670618",
  appId: "1:28455670618:web:17b8e21c0c62c99a0a1963",
  measurementId: "G-Z6X13HK3FJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and Storage
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app); // ✅ this line is important

export { db, storage, auth }; // ✅ export auth too
