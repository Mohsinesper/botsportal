
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
  const errorMessage = "CRITICAL_FIREBASE_ERROR: Firebase API Key (NEXT_PUBLIC_FIREBASE_API_KEY) is missing or not a string in your environment variables. Please ensure it is correctly set in your .env.local file and that you have restarted your development server.";
  console.error(errorMessage);
  throw new Error(errorMessage); // Throw error to halt execution if key is critically missing
}

const placeholderPatterns = ["YOUR_", "your_actual_", "AIzaSyYOUR_ACTUAL_API_KEY_HERE"];
let isPlaceholderKey = false;

// Ensure apiKey is a string before using string methods
if (firebaseConfig.apiKey && typeof firebaseConfig.apiKey === 'string') {
  isPlaceholderKey = placeholderPatterns.some(pattern => firebaseConfig.apiKey.includes(pattern)) || firebaseConfig.apiKey.length < 10;
}


if (firebaseConfig.apiKey && isPlaceholderKey) {
  const warningMessage = "WARNING_FIREBASE_CONFIG: The Firebase API Key (NEXT_PUBLIC_FIREBASE_API_KEY) appears to be a placeholder value or is unusually short. Please verify it's the correct key from your Firebase project settings in the Firebase Console.";
  console.warn(warningMessage);
  // Optionally, you could throw an error here too if you want to be very strict:
  // throw new Error(warningMessage); 
}

// Initialize Firebase
let app;
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
    console.log("Firebase app initialized successfully.");
  } catch (error) {
    console.error("CRITICAL_FIREBASE_ERROR: Firebase SDK initialization failed. This is often due to an invalid config (e.g., incorrect Project ID, Auth Domain). Error:", error);
    // If the critical error for missing key was handled above, this catch block might be hit due to other invalid config issues.
    throw error; 
  }
} else {
  app = getApp();
  console.log("Existing Firebase app retrieved.");
}

const db = getFirestore(app);
const auth = getAuth(app); // If this line throws auth/invalid-api-key, it means initializeApp succeeded but auth services specifically reject the key.

export { app, db, auth };
