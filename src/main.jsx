import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { UserProfileProvider } from './contexts/UserProfileContext';
import { NotificationProvider } from './contexts/NotificationContext';
import App from './App.jsx';
import ReloadPrompt from './components/ReloadPrompt';
import './index.css';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter>
            <NotificationProvider>
                <AuthProvider>
                    <UserProfileProvider>
                        <App />
                        <ReloadPrompt />
                    </UserProfileProvider>
                </AuthProvider>
            </NotificationProvider>
        </BrowserRouter>
    </StrictMode>,
);
