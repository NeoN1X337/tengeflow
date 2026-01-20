import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import Toast from '../components/Toast';

const NotificationContext = createContext({});

export const useNotification = () => useContext(NotificationContext);

export function NotificationProvider({ children }) {
    const [notification, setNotification] = useState(null);

    const showToast = useCallback((message, type = 'success', duration = 3500) => {
        setNotification({ message, type, duration });
    }, []);

    const hideToast = useCallback(() => {
        setNotification(null);
    }, []);

    // Auto-close logic
    useEffect(() => {
        if (notification && notification.duration > 0) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, notification.duration);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    return (
        <NotificationContext.Provider value={{ showToast }}>
            {children}
            {notification && (
                <Toast
                    message={notification.message}
                    type={notification.type}
                    duration={notification.duration}
                    onClose={hideToast}
                />
            )}
        </NotificationContext.Provider>
    );
}
