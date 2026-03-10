import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Initialize Firebase using environment variables (Fallback to dummy to prevent crash)
const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "dummy-api-key",
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "dummy-domain.firebaseapp.com",
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "dummy-project",
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "dummy-bucket.appspot.com",
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "000000000",
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:000000000:web:000000000",
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
