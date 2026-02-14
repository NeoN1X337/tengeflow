import { Link } from 'react-router-dom';
import { Coffee, FileText, Users, Briefcase } from 'lucide-react';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            {/* Hero Section */}
            <div className="container mx-auto px-4 py-16 md:py-24">
                <div className="text-center max-w-4xl mx-auto">
                    {/* Visual Flow Illustration */}
                    <div className="flex items-center justify-center gap-4 mb-8">
                        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center shadow-md">
                            <Coffee className="w-8 h-8 text-amber-600" />
                        </div>
                        <div className="flex-1 max-w-xs h-1 bg-gradient-to-r from-amber-400 via-blue-400 to-indigo-600 rounded-full animate-pulse" />
                        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center shadow-md">
                            <FileText className="w-8 h-8 text-indigo-600" />
                        </div>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                        Всё под контролем: от кофе до налогов
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-600 mb-8">
                        Умный менеджер личных финансов для Казахстана.<br />
                        Отслеживайте доходы, управляйте расходами и планируйте бюджет.<br />
                        <span className="font-semibold text-blue-700">Для ИП</span> — автоматизация налогов и расчёт обязательных платежей.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/register"
                            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105"
                        >
                            Начать бесплатно
                        </Link>
                        <Link
                            to="/login"
                            className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl shadow-lg border-2 border-blue-600 hover:bg-blue-50 transition-all"
                        >
                            Войти
                        </Link>
                    </div>
                </div>
            </div>

            {/* 3 Key Benefits */}
            <div className="container mx-auto px-4 py-16">
                <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
                    Почему TengeFlow?
                </h2>
                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {/* Benefit 1: For Everyone */}
                    <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-lg transition-all border-2 border-transparent hover:border-blue-200">
                        <h3 className="text-xl font-bold text-gray-900 mb-3">
                            Визуализация вашего Flow
                        </h3>
                        <p className="text-sm text-blue-600 font-semibold mb-3">
                            Для всех: Контроль денежного потока 💰
                        </p>
                        <p className="text-gray-600">
                            Вносите доходы и расходы за секунды. Интерактивная аналитика по категориям показывает, куда уходят деньги. Графики, диаграммы и детальная статистика помогают принимать осознанные финансовые решения.
                        </p>
                    </div>

                    {/* Benefit 2: For IP */}
                    <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-lg transition-all border-2 border-transparent hover:border-indigo-200">
                        <h3 className="text-xl font-bold text-gray-900 mb-3">
                            Полный расчёт для бизнеса
                        </h3>
                        <p className="text-sm text-indigo-600 font-semibold mb-3">
                            Для ИП: Автоматизация налогов и взносов 📊
                        </p>
                        <p className="text-gray-600">
                            Автоматический расчёт ОПВ, СО, ВОСМС, ОПВР и основного налога по актуальным ставкам 2026 года. Упрощённая декларация (3%) с делением на ИПН и СоцНалог. Контроль дедлайнов H1/H2. Знайте точную сумму «на руки».
                        </p>
                    </div>

                    {/* Benefit 3: Technical */}
                    <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-lg transition-all border-2 border-transparent hover:border-purple-200">
                        <h3 className="text-xl font-bold text-gray-900 mb-3">
                            Работает везде, даже без интернета
                        </h3>
                        <p className="text-sm text-purple-600 font-semibold mb-3">
                            PWA: Мобильно и офлайн ⚡
                        </p>
                        <p className="text-gray-600">
                            Устанавливается как нативное приложение на iOS и Android. Все данные синхронизируются в облаке, но доступны офлайн благодаря локальному кэшу. Быстро, безопасно (Firebase), всегда под рукой.
                        </p>
                    </div>
                </div>
            </div>

            {/* For Whom Section */}
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 py-16">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
                        Для кого это?
                    </h2>
                    <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
                        Выберите режим, который подходит именно вам
                    </p>

                    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        {/* Personal Mode */}
                        <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all border-2 border-blue-100 hover:border-blue-300 flex flex-col h-full">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Users className="w-6 h-6 text-blue-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900">
                                    Личное использование
                                </h3>
                            </div>
                            <p className="text-gray-600 mb-6">
                                Отслеживайте все доходы и расходы, планируйте бюджет и достигайте финансовых целей. Простой и понятный интерфейс для контроля над вашими деньгами.
                            </p>

                            <div className="space-y-2 mb-6">
                                <div className="flex items-start gap-2">
                                    <span className="text-green-600 font-bold">✅</span>
                                    <span className="text-gray-700">Учёт всех доходов и расходов</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="text-green-600 font-bold">✅</span>
                                    <span className="text-gray-700">Категоризация и фильтрация транзакций</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="text-green-600 font-bold">✅</span>
                                    <span className="text-gray-700">Графики и аналитика по категориям</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="text-green-600 font-bold">✅</span>
                                    <span className="text-gray-700">Планирование бюджета на месяц/год</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="text-green-600 font-bold">✅</span>
                                    <span className="text-gray-700">Синхронизация между устройствами</span>
                                </div>
                            </div>

                            <p className="text-sm text-gray-500 italic mb-6">
                                <strong>Для кого:</strong> Студенты, наёмные работники, фрилансеры — все, кто хочет контролировать свои финансы и понимать, куда уходят деньги.
                            </p>

                            <Link
                                to="/register"
                                className="block text-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all mt-auto"
                            >
                                Начать с личного режима
                            </Link>
                        </div>

                        {/* Business Mode */}
                        <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all border-2 border-indigo-100 hover:border-indigo-300 flex flex-col h-full">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                                    <Briefcase className="w-6 h-6 text-indigo-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900">
                                    Бизнес + Личное (ИП)
                                </h3>
                            </div>
                            <p className="text-gray-600 mb-6">
                                Всё для личных финансов + полная автоматизация налогов и обязательных платежей для индивидуальных предпринимателей в РК.
                            </p>

                            <div className="bg-indigo-50 p-4 rounded-lg mb-4">
                                <p className="text-sm font-semibold text-indigo-900">
                                    Всё из личного режима +
                                </p>
                            </div>

                            <div className="space-y-2 mb-6">
                                <div className="flex items-start gap-2">
                                    <span className="text-green-600 font-bold">✅</span>
                                    <span className="text-gray-700">Автоматический расчёт налогов (ИПН, СоцНалог)</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="text-green-600 font-bold">✅</span>
                                    <span className="text-gray-700">Обязательные платежи (ОПВ, СО, ВОСМС, ОПВР)</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="text-green-600 font-bold">✅</span>
                                    <span className="text-gray-700">Контроль дедлайнов H1/H2 с уведомлениями</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="text-green-600 font-bold">✅</span>
                                    <span className="text-gray-700">Чистый доход «на руки» после всех вычетов</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="text-green-600 font-bold">✅</span>
                                    <span className="text-gray-700">Отдельная бизнес-аналитика</span>
                                </div>
                            </div>

                            <p className="text-sm text-gray-500 italic mb-6">
                                <strong>Для кого:</strong> Индивидуальные предприниматели в РК, которые не хотят разбираться в налоговых нюансах и хотят видеть реальную картину своего дохода.
                            </p>

                            <Link
                                to="/register"
                                className="block text-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all mt-auto"
                            >
                                Начать с бизнес-режима
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-16">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                        Готовы начать контролировать свои финансы?
                    </h2>
                    <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                        Создайте аккаунт за минуту и получите полный контроль над денежным потоком — от ежедневных расходов до налоговых обязательств.
                    </p>
                    <Link
                        to="/register"
                        className="inline-block px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl shadow-lg hover:bg-gray-100 transition-all transform hover:scale-105"
                    >
                        Создать аккаунт бесплатно
                    </Link>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-400 py-8">
                <div className="container mx-auto px-4 text-center">
                    <p>© 2026 TengeFlow. Умный финансовый менеджер для Казахстана.</p>
                    <p className="mt-2">
                        <a href="https://github.com/NeoN1X337/tengeflow" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                            GitHub
                        </a>
                    </p>
                </div>
            </footer>
        </div>
    );
}
