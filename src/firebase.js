import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDHuH4crihJVWZAIp-jknNNzVF34tGhvck",
    authDomain: "tengeflow.firebaseapp.com",
    projectId: "tengeflow",
    storageBucket: "tengeflow.firebasestorage.app",
    messagingSenderId: "474142394112",
    appId: "1:474142394112:web:aafae4e548e5261edb55e5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
