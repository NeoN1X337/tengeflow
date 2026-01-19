import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDHuH4crihJVWZAIp-jknNNzVF34tGhvck",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "tengeflow.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "tengeflow",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "tengeflow.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "474142394112",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:474142394112:web:aafae4e548e5261edb55e5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);