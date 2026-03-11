import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Initialize Firebase using environment variables (Fallback to dummy to prevent crash)
const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyCy1pwuON7MnGnOFP3gBa3NTz1GbmX9Mzg",
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "tadarus-id.firebaseapp.com",
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "tadarus-id",
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "tadarus-id.firebasestorage.app",
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "764554736649",
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:764554736649:ios:feed1e738fd6ea59ee74d8",
};

let app;

// Prevent SSR/Hot Reloading issues and handle missing keys gracefully
try {
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApp();
    }
} catch (error) {
    console.error("Firebase initialization error", error);
}

const auth = getAuth(app);

export { app, auth };
