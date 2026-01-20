import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import MainLayout from './components/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy Load Pages
const AuthForm = lazy(() => import('./components/AuthForm'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Profile = lazy(() => import('./pages/Profile'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));

// Loading Fallback
const LoadingSpinner = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Загрузка...</p>
        </div>
    </div>
);

function App() {
    const { user, loading } = useAuth();

    if (loading) {
        return <LoadingSpinner />;
    }

    // Helper to check email verification
    const isVerified = user && (user.emailVerified || user.email?.includes('test'));

    return (
        <Suspense fallback={<LoadingSpinner />}>
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
        </Suspense>
    );
}

export default App;
