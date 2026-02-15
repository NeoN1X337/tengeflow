import { Card, Button, Label, TextInput, RangeSlider } from 'flowbite-react';
import { LogOut, User, Settings, Save, Briefcase, Users, Calendar, UserPlus, DollarSign } from 'lucide-react';
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

    // Employee & birth year fields
    const [bornAfter1975, setBornAfter1975] = useState(true);
    const [hasEmployees, setHasEmployees] = useState(false);
    const [employeeCount, setEmployeeCount] = useState(0);
    const [totalEmployeeSalary, setTotalEmployeeSalary] = useState(0);
    const [savingEmployees, setSavingEmployees] = useState(false);

    useEffect(() => {
        if (profile) {
            if (profile.taxRate) setTaxRate(profile.taxRate);
            if (profile.bornAfter1975 !== undefined) setBornAfter1975(profile.bornAfter1975);
            if (profile.hasEmployees !== undefined) setHasEmployees(profile.hasEmployees);
            if (profile.employeeCount !== undefined) setEmployeeCount(profile.employeeCount);
            if (profile.totalEmployeeSalary !== undefined) setTotalEmployeeSalary(profile.totalEmployeeSalary);
        }
    }, [profile]);

    const handleSaveTaxRate = async () => {
        setSaving(true);
        try {
            const rate = Math.min(Math.max(parseFloat(taxRate) || 2, 2), 6);
            await updateProfile({ taxRate: rate, bornAfter1975 });
            setTaxRate(rate);
            showToast('Налоговые настройки обновлены', 'success');
        } catch (error) {
            showToast('Ошибка при обновлении', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveEmployees = async () => {
        setSavingEmployees(true);
        try {
            await updateProfile({
                hasEmployees,
                employeeCount: hasEmployees ? parseInt(employeeCount) || 0 : 0,
                totalEmployeeSalary: hasEmployees ? parseFloat(totalEmployeeSalary) || 0 : 0,
            });
            showToast(
                hasEmployees ? 'Данные по сотрудникам сохранены' : 'Режим без сотрудников сохранён',
                'success'
            );
        } catch (error) {
            showToast('Ошибка при сохранении', 'error');
        } finally {
            setSavingEmployees(false);
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
                        <>
                            {/* Налоговые настройки */}
                            <div>
                                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Settings className="w-5 h-5" />
                                    Настройки ИП
                                </h4>

                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-5">
                                    {/* Tax Rate */}
                                    <div>
                                        <div className="mb-2 block">
                                            <Label htmlFor="tax-rate" value={`Ставка налога: ${taxRate}%`} />
                                        </div>
                                        <div className="flex flex-col gap-2 max-w-md">
                                            <input
                                                id="tax-rate"
                                                type="range"
                                                min="2"
                                                max="6"
                                                step="0.5"
                                                value={taxRate}
                                                onChange={(e) => setTaxRate(parseFloat(e.target.value))}
                                                disabled={loading || saving}
                                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                            />
                                            <div className="flex justify-between text-xs text-gray-400">
                                                <span>2%</span>
                                                <span>3%</span>
                                                <span>4%</span>
                                                <span>5%</span>
                                                <span>6%</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Born After 1975 */}
                                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <Calendar className="w-4 h-4 text-gray-500" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">Рождён после 01.01.1975</p>
                                                <p className="text-xs text-gray-500">Влияет на расчёт ОПВР «за себя»</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={bornAfter1975}
                                            disabled={loading || saving}
                                            onClick={() => setBornAfter1975(!bornAfter1975)}
                                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${bornAfter1975 ? 'bg-blue-600' : 'bg-gray-300'}`}
                                        >
                                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${bornAfter1975 ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </button>
                                    </div>

                                    <Button
                                        onClick={handleSaveTaxRate}
                                        isProcessing={saving}
                                        disabled={loading || saving}
                                        className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-0 shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
                                    >
                                        <Save className="w-4 h-4 mr-2" />
                                        Сохранить налоговые настройки
                                    </Button>

                                    <p className="text-xs text-gray-500">
                                        Используется для автоматического расчета налогов в аналитике и мониторе.
                                    </p>
                                </div>
                            </div>

                            {/* Сотрудники */}
                            <div>
                                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <UserPlus className="w-5 h-5 text-violet-600" />
                                    Сотрудники
                                </h4>

                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
                                    {/* Has Employees Toggle */}
                                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">ИП с работниками</p>
                                            <p className="text-xs text-gray-500">Включите, если у вас есть наёмные сотрудники</p>
                                        </div>
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={hasEmployees}
                                            disabled={loading || savingEmployees}
                                            onClick={() => setHasEmployees(!hasEmployees)}
                                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:opacity-50 ${hasEmployees ? 'bg-violet-600' : 'bg-gray-300'}`}
                                        >
                                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${hasEmployees ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </button>
                                    </div>

                                    {/* Employee Details (visible when hasEmployees) */}
                                    {hasEmployees && (
                                        <div className="space-y-4 p-4 bg-violet-50 rounded-lg border border-violet-100 animate-in">
                                            <div>
                                                <div className="mb-2 block">
                                                    <Label htmlFor="employee-count" value="Количество сотрудников" />
                                                </div>
                                                <TextInput
                                                    id="employee-count"
                                                    type="number"
                                                    min="1"
                                                    value={employeeCount}
                                                    onChange={(e) => setEmployeeCount(e.target.value)}
                                                    disabled={loading || savingEmployees}
                                                    placeholder="Например: 5"
                                                    className="max-w-xs"
                                                    icon={Users}
                                                />
                                            </div>

                                            <div>
                                                <div className="mb-2 block">
                                                    <Label htmlFor="total-salary" value="Общий фонд оплаты труда (₸/мес)" />
                                                </div>
                                                <TextInput
                                                    id="total-salary"
                                                    type="number"
                                                    min="0"
                                                    step="1000"
                                                    value={totalEmployeeSalary}
                                                    onChange={(e) => setTotalEmployeeSalary(e.target.value)}
                                                    disabled={loading || savingEmployees}
                                                    placeholder="Например: 500 000"
                                                    icon={DollarSign}
                                                />
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Суммарная зарплата всех сотрудников до вычета налогов
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <Button
                                        onClick={handleSaveEmployees}
                                        isProcessing={savingEmployees}
                                        disabled={loading || savingEmployees}
                                        className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 border-0 shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
                                    >
                                        <Save className="w-4 h-4 mr-2" />
                                        Сохранить настройки сотрудников
                                    </Button>
                                </div>
                            </div>
                        </>
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
