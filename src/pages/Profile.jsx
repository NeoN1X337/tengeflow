import { Card, Button } from 'flowbite-react';
import { LogOut, User, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Profile() {
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Ошибка выхода:', error);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Профиль</h1>

            {/* Информация пользователя */}
            <Card className="shadow-lg">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                        <User className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                            {user?.displayName || 'Пользователь'}
                        </h3>
                        <p className="text-gray-600">{user?.email}</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <Button
                        color="light"
                        className="w-full justify-start border-2 border-gray-300 hover:bg-gray-50"
                    >
                        <Settings className="w-5 h-5 mr-2 text-gray-700" />
                        <span className="text-gray-700 font-medium">Настройки</span>
                    </Button>

                    <Button
                        color="failure"
                        onClick={handleLogout}
                        className="w-fit px-6 bg-red-600 hover:bg-red-700"
                    >
                        <LogOut className="w-5 h-5 mr-2" />
                        <span className="text-white font-semibold">Выйти из профиля</span>
                    </Button>
                </div>
            </Card>
        </div>
    );
}
