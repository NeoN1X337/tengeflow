import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { onAuthStateChanged, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const isRegistering = useRef(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            // Игнорируем промежуточный auth state во время регистрации
            if (isRegistering.current) {
                console.log('Registration in progress, ignoring auth state change');
                return;
            }

            setUser(firebaseUser);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const signup = async (email, password) => {
        try {
            // Устанавливаем флаг ПЕРЕД регистрацией
            isRegistering.current = true;
            console.log('Starting silent registration for:', email);

            // Firebase автоматически авторизует, но мы игнорируем это в onAuthStateChanged
            await createUserWithEmailAndPassword(auth, email, password);
            console.log('User created, signing out immediately');

            // Сразу выходим
            await signOut(auth);
            console.log('Silent registration completed');

            return { success: true };
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        } finally {
            // Снимаем флаг ПОСЛЕ завершения операции
            isRegistering.current = false;
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

    return (
        <AuthContext.Provider value={{ user, loading, logout, signup }}>
            {children}
        </AuthContext.Provider>
    );
}
