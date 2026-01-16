import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, BarChart3, User } from 'lucide-react';

export default function BottomNavBar() {
    const navLinks = [
        { to: '/', icon: LayoutDashboard, label: 'Главная' },
        { to: '/transactions', icon: ArrowLeftRight, label: 'История' },
        { to: '/analytics', icon: BarChart3, label: 'Аналитика' },
        { to: '/profile', icon: User, label: 'Профиль' },
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50">
            <ul className="flex justify-around items-center h-16">
                {navLinks.map(({ to, icon: Icon, label }) => (
                    <li key={to} className="flex-1">
                        <NavLink
                            to={to}
                            end={to === '/'}
                            className={({ isActive }) =>
                                `flex flex-col items-center justify-center h-full gap-1 transition-colors ${isActive
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-gray-600 dark:text-gray-400'
                                }`
                            }
                        >
                            <Icon className="w-6 h-6" />
                            <span className="text-xs font-medium">{label}</span>
                        </NavLink>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
