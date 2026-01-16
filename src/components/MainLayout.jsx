import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNavBar from './BottomNavBar';

export default function MainLayout() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Desktop Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <main className="md:ml-64 p-4 md:p-8 pb-20 md:pb-8">
                <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <BottomNavBar />
        </div>
    );
}
