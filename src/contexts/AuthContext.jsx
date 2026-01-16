import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            // Проверяем флаг успешной регистрации
            const registrationSuccess = localStorage.getItem('registrationSuccess');

            if (registrationSuccess === 'true' && firebaseUser) {
                // Если есть флаг регистрации и пользователь вошел - принудительно выходим
                console.log('Registration success flag detected, forcing sign out');
                signOut(auth).then(() => {
                    setUser(null);
                    setLoading(false);
                });
            } else {
                setUser(firebaseUser);
                setLoading(false);
            }
        });

        return unsubscribe;
    }, []);

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Ошибка выхода:', error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
