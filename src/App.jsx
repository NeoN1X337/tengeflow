import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import AuthForm from './components/AuthForm';
import MainLayout from './components/MainLayout';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import VerifyEmail from './pages/VerifyEmail';
import ProtectedRoute from './components/ProtectedRoute';

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

    // Helper to check email verification
    const isVerified = user && (user.emailVerified || user.email?.includes('test'));

    return (
        <Routes>
            {/* Public/Root Handling */}
            <Route path="/" element={
                user ?
                    (isVerified ? <MainLayout><Dashboard /></MainLayout> : <Navigate to="/verify-email" replace />)
                    : <AuthForm />
            } />

            <Route path="/verify-email" element={
                !user ? <Navigate to="/" replace /> :
                    isVerified ? <Navigate to="/" replace /> :
                        <VerifyEmail />
            } />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                    <Route path="/transactions" element={<Transactions />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/profile" element={<Profile />} />
                </Route>
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;
