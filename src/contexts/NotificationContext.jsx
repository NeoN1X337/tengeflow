import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import Toast from '../components/Toast';

const NotificationContext = createContext({});

export const useNotification = () => useContext(NotificationContext);

export function NotificationProvider({ children }) {
    const [notification, setNotification] = useState(null);
    const [isPaused, setIsPaused] = useState(false);

    const showToast = useCallback((message, type = 'success', duration = 3500) => {
        setNotification({ message, type, duration });
        setIsPaused(false);
    }, []);

    const hideToast = useCallback(() => {
        setNotification(null);
        setIsPaused(false);
    }, []);

    const pauseToast = useCallback(() => setIsPaused(true), []);
    const resumeToast = useCallback(() => setIsPaused(false), []);

    // Auto-close logic
    useEffect(() => {
        if (notification && notification.duration > 0 && !isPaused) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, notification.duration);
            return () => clearTimeout(timer);
        }
    }, [notification, isPaused]);

    return (
        <NotificationContext.Provider value={{ showToast, hideToast }}>
            {children}
            {notification && (
                <Toast
                    message={notification.message}
                    type={notification.type}
                    duration={notification.duration}
                    onClose={hideToast}
                    onPause={pauseToast}
                    onResume={resumeToast}
                    isPaused={isPaused}
                />
            )}
        </NotificationContext.Provider>
    );
}
