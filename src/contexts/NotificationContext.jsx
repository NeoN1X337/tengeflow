import { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/Toast';

const NotificationContext = createContext({});

export const useNotification = () => useContext(NotificationContext);

export function NotificationProvider({ children }) {
    const [notification, setNotification] = useState(null);

    const showToast = useCallback((message, type = 'success', duration = 5000) => {
        setNotification({ message, type, duration });
    }, []);

    const hideToast = useCallback(() => {
        setNotification(null);
    }, []);

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
