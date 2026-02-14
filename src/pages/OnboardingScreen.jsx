import { useState } from 'react';
import { Users, Briefcase, CheckCircle } from 'lucide-react';
import { Card, Button } from 'flowbite-react';
import { useUserProfile } from '../hooks/useUserProfile';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';

export default function OnboardingScreen() {
    const [selectedMode, setSelectedMode] = useState(null);
    const [saving, setSaving] = useState(false);
    const { updateProfile } = useUserProfile();
    const navigate = useNavigate();
    const { showToast } = useNotification();

    const handleSelectMode = async (mode) => {
        const isBusiness = mode === 'business';
        setSaving(true);
        try {
            await updateProfile({
                isBusinessMode: isBusiness,
                onboardingComplete: true,
            });
            showToast(
                isBusiness
                    ? 'Бизнес-режим активирован'
                    : 'Личный режим активирован',
                'success'
            );
            navigate('/dashboard');
        } catch (error) {
            console.error('Ошибка сохранения режима:', error);
            showToast('Ошибка при сохранении настроек', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4 py-12">
            <div className="max-w-5xl w-full">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Добро пожаловать в TengeFlow!
                    </h1>
                    <p className="text-xl text-gray-600">
                        Выберите режим, который подходит именно вам
                    </p>
                </div>

                {/* Mode Selection Cards */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {/* Personal Mode */}
                    <Card
                        className={`cursor-pointer transition-all duration-200 ${selectedMode === 'personal'
                            ? 'ring-4 ring-blue-500 shadow-xl'
                            : 'hover:shadow-lg'
                            }`}
                        onClick={() => setSelectedMode('personal')}
                    >
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                        <Users className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900">
                                        Личный бюджет
                                    </h3>
                                </div>
                                {selectedMode === 'personal' && (
                                    <CheckCircle className="w-8 h-8 text-blue-600" />
                                )}
                            </div>

                            <p className="text-gray-600 mb-6">
                                Отслеживайте доходы, расходы и планируйте бюджет. Простой и понятный интерфейс для контроля над вашими деньгами.
                            </p>

                            <div className="space-y-2 mb-6">
                                <div className="flex items-start gap-2">
                                    <span className="text-green-600 font-bold">✅</span>
                                    <span className="text-sm text-gray-700">Учёт транзакций</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="text-green-600 font-bold">✅</span>
                                    <span className="text-sm text-gray-700">Графики и аналитика</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="text-green-600 font-bold">✅</span>
                                    <span className="text-sm text-gray-700">Категории расходов</span>
                                </div>
                            </div>

                            <Button
                                onClick={() => handleSelectMode('personal')}
                                disabled={saving}
                                isProcessing={saving && selectedMode === 'personal'}
                                className="w-full bg-blue-600 hover:bg-blue-700 border-0"
                            >
                                Выбрать
                            </Button>
                        </div>
                    </Card>

                    {/* Business Mode */}
                    <Card
                        className={`cursor-pointer transition-all duration-200 ${selectedMode === 'business'
                            ? 'ring-4 ring-indigo-500 shadow-xl'
                            : 'hover:shadow-lg'
                            }`}
                        onClick={() => setSelectedMode('business')}
                    >
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                                        <Briefcase className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900">
                                        Бизнес + Личное (ИП)
                                    </h3>
                                </div>
                                {selectedMode === 'business' && (
                                    <CheckCircle className="w-8 h-8 text-indigo-600" />
                                )}
                            </div>

                            <p className="text-gray-600 mb-6">
                                Всё для личных финансов + автоматизация налогов и обязательных платежей для индивидуальных предпринимателей в РК.
                            </p>

                            <div className="bg-indigo-50 p-3 rounded-lg mb-4">
                                <p className="text-sm font-semibold text-indigo-900">
                                    Всё из личного режима +
                                </p>
                            </div>

                            <div className="space-y-2 mb-6">
                                <div className="flex items-start gap-2">
                                    <span className="text-green-600 font-bold">✅</span>
                                    <span className="text-sm text-gray-700">Расчёт ОПВ, СО, ВОСМС, ОПВР</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="text-green-600 font-bold">✅</span>
                                    <span className="text-sm text-gray-700">Налоги по упрощёнке/рознице</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="text-green-600 font-bold">✅</span>
                                    <span className="text-sm text-gray-700">Контроль дедлайнов H1/H2</span>
                                </div>
                            </div>

                            <Button
                                onClick={() => handleSelectMode('business')}
                                disabled={saving}
                                isProcessing={saving && selectedMode === 'business'}
                                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 border-0 hover:from-indigo-700 hover:to-purple-700"
                            >
                                Выбрать
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* Helper Text */}
                <p className="text-center text-sm text-gray-500 italic">
                    💡 Вы сможете изменить режим в настройках профиля в любое время
                </p>
            </div>
        </div>
    );
}
