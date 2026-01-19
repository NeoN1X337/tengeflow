import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import AuthForm from './components/AuthForm';
import MainLayout from './components/MainLayout';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import VerifyEmail from './pages/VerifyEmail';

function App() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Загрузка...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <Routes>
                <Route path="/verify-email" element={<Navigate to="/" replace />} />
                <Route path="*" element={<AuthForm />} />
            </Routes>
        );
    }

    if (!user.emailVerified && !user.email?.includes('test')) {
        return (
            <Routes>
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="*" element={<Navigate to="/verify-email" replace />} />
            </Routes>
        );
    }

    return (
        <Routes>
            <Route path="/" element={<MainLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="profile" element={<Profile />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
        </Routes>
    );
}

export default App;
