
// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Log the configuration to help debug API key issues
console.log("Attempting to initialize Firebase with config:", {
  apiKey: firebaseConfig.apiKey ? `******${firebaseConfig.apiKey.slice(-6)}` : "MISSING_API_KEY", // Mask most of the key
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
});

if (!firebaseConfig.apiKey || typeof firebaseConfig.apiKey !== 'string') {
  console.error(
    "CRITICAL_FIREBASE_ERROR: Firebase API Key (NEXT_PUBLIC_FIREBASE_API_KEY) is missing or not a string in your environment variables." +
    " Please ensure it is correctly set in your .env.local file and that you have restarted your development server."
  );
} else if (firebaseConfig.apiKey.includes("YOUR_") || firebaseConfig.apiKey.includes("your_actual_") || firebaseConfig.apiKey.length < 10) {
  console.warn(
    "WARNING_FIREBASE_CONFIG: The Firebase API Key (NEXT_PUBLIC_FIREBASE_API_KEY) appears to be a placeholder value or is unusually short." +
    " Please verify it's the correct key from your Firebase project settings in the Firebase Console."
  );
}

// Initialize Firebase
// We will let Firebase throw its own specific error if initialization fails after these checks.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
