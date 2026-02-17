// Firebase Setup

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAO8Gp9Q6UHYGq8KMtPM2VvaFU1q27bK4Y",
  authDomain: "school-bus-system-88cad.firebaseapp.com",
  projectId: "school-bus-system-88cad",
  storageBucket: "school-bus-system-88cad.firebasestorage.app",
  messagingSenderId: "496673941794",
  appId: "1:496673941794:web:e600a0d8d17b1e1def1d7b",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services we will use
export const auth = getAuth(app);
export const db = getFirestore(app);