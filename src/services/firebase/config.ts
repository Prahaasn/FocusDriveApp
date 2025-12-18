/**
 * Firebase Configuration
 * Initializes Firebase app with configuration from environment variables
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getDatabase, Database } from 'firebase/database';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
};

// Initialize Firebase app (singleton pattern)
let firebaseApp: FirebaseApp;

export const initializeFirebase = (): FirebaseApp => {
  if (getApps().length === 0) {
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    firebaseApp = getApp();
  }
  return firebaseApp;
};

// Get Firebase Auth instance
export const getFirebaseAuth = (): Auth => {
  if (!firebaseApp) {
    initializeFirebase();
  }
  return getAuth(firebaseApp);
};

// Get Firebase Realtime Database instance
export const getFirebaseDatabase = (): Database => {
  if (!firebaseApp) {
    initializeFirebase();
  }
  return getDatabase(firebaseApp);
};

// Initialize on module load
initializeFirebase();

export { firebaseApp };
