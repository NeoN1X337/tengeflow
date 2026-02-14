import { Card, Button, Label, TextInput } from 'flowbite-react';
import { LogOut, User, Settings, Save, Briefcase, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUserProfile } from '../hooks/useUserProfile';
import { useState, useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext';

export default function Profile() {
    const { user, logout } = useAuth();
    const { profile, loading, updateProfile } = useUserProfile();
    const { showToast } = useNotification();

    const [taxRate, setTaxRate] = useState(4);
    const [saving, setSaving] = useState(false);
    const [togglingMode, setTogglingMode] = useState(false);

    useEffect(() => {
        if (profile?.taxRate) {
            setTaxRate(profile.taxRate);
        }
    }, [profile]);

    const handleSaveTaxRate = async () => {
        setSaving(true);
        try {
            await updateProfile({ taxRate: parseFloat(taxRate) });
            showToast('Налоговая ставка обновлена', 'success');
        } catch (error) {
            showToast('Ошибка при обновлении', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleMode = async () => {
        const newValue = !isBusiness;
        setTogglingMode(true);
        try {
            await updateProfile({ isBusinessMode: newValue });
            showToast(
                newValue ? 'Бизнес-режим включён' : 'Личный режим включён',
                'success'
            );
        } catch (error) {
            showToast('Ошибка при переключении режима', 'error');
        } finally {
            setTogglingMode(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Ошибка выхода:', error);
        }
    };

    const isBusiness = profile?.isBusinessMode === true;

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

                <div className="space-y-6">
                    {/* Mode Switcher */}
                    <div>
                        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            {isBusiness ? (
                                <Briefcase className="w-5 h-5 text-indigo-600" />
                            ) : (
                                <Users className="w-5 h-5 text-blue-600" />
                            )}
                            Режим приложения
                        </h4>

                        <div className={`p-4 rounded-lg border-2 transition-colors ${isBusiness
                                ? 'bg-indigo-50 border-indigo-200'
                                : 'bg-blue-50 border-blue-200'
                            }`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-gray-900">
                                        {isBusiness ? 'Бизнес + Личное (ИП)' : 'Личный бюджет'}
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {isBusiness
                                            ? 'Налоги, обязательные платежи, дедлайны + личные финансы'
                                            : 'Учёт доходов, расходов и аналитика'
                                        }
                                    </p>
                                </div>

                                {/* Custom Toggle Switch */}
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={isBusiness}
                                    disabled={togglingMode || loading}
                                    onClick={handleToggleMode}
                                    className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${isBusiness ? 'bg-indigo-600' : 'bg-gray-300'
                                        }`}
                                >
                                    <span
                                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isBusiness ? 'translate-x-7' : 'translate-x-0'
                                            }`}
                                    />
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-3">
                                {isBusiness ? '🏢 Бизнес-режим' : '👤 Личный режим'} • Переключите для смены
                            </p>
                        </div>
                    </div>

                    {/* Настройки ИП — visible only in business mode */}
                    {isBusiness && (
                        <div>
                            <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Settings className="w-5 h-5" />
                                Настройки ИП
                            </h4>

                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="mb-2 block">
                                    <Label htmlFor="tax-rate" value="Текущая ставка налога (%)" />
                                </div>
                                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center max-w-md">
                                    <TextInput
                                        id="tax-rate"
                                        type="number"
                                        step="0.1"
                                        value={taxRate}
                                        onChange={(e) => setTaxRate(e.target.value)}
                                        disabled={loading || saving}
                                        required
                                        className="w-full sm:w-32"
                                    />
                                    <Button
                                        onClick={handleSaveTaxRate}
                                        isProcessing={saving}
                                        disabled={loading || saving}
                                        className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-0 shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
                                    >
                                        <Save className="w-4 h-4 mr-2" />
                                        Сохранить ставку
                                    </Button>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    Используется для автоматического расчета налогов в аналитике и мониторе.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="pt-4 border-t border-gray-200">
                        <Button
                            color="failure"
                            onClick={handleLogout}
                            className="w-fit px-6 bg-red-600 hover:bg-red-700"
                        >
                            <LogOut className="w-5 h-5 mr-2" />
                            <span className="text-white font-semibold">Выйти из профиля</span>
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
