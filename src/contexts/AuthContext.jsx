import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { onAuthStateChanged, signOut, createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const signup = async (email, password) => {
        try {
            console.log('Starting registration for:', email);

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            // Manually update state to prevent race condition with navigation
            setUser(userCredential.user);

            // Отправляем письмо подтверждения
            await sendEmailVerification(userCredential.user);
            console.log('Verification email sent');

            // Мы НЕ выходим сразу, чтобы пользователь мог увидеть страницу VerifyEmail
            // App.jsx перенаправит его туда, так как emailVerified === false
            console.log('Registration completed, user remains logged in for verification check');

            return { success: true };
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Ошибка выхода:', error);
            throw error;
        }
    };

    const resetPassword = async (email) => {
        try {
            await sendPasswordResetEmail(auth, email);
            return { success: true };
        } catch (error) {
            console.error('Password reset error:', error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, logout, signup, resetPassword }}>
            {children}
        </AuthContext.Provider>
    );
}
