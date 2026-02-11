import { Link } from 'react-router-dom';
import { TrendingUp, Smartphone, Calendar, Shield, Zap, BarChart3 } from 'lucide-react';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            {/* Hero Section */}
            <div className="container mx-auto px-4 py-16 md:py-24">
                <div className="text-center max-w-4xl mx-auto">
                    <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                        TengeFlow: Финансы и Налоги для ИП
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-600 mb-8">
                        Умный финансовый трекер для индивидуальных предпринимателей в Казахстане.
                        Автоматический расчет налогов, контроль дедлайнов и управление финансами в одном приложении.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/register"
                            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105"
                        >
                            Начать использование
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

            {/* Features Section */}
            <div className="container mx-auto px-4 py-16">
                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {/* Feature 1 */}
                    <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                            <TrendingUp className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Расчет налогов 4%</h3>
                        <p className="text-gray-600">
                            Автоматический расчет ИПН (4%) и социального налога по упрощенной декларации.
                            Отслеживание налоговой нагрузки в режиме реального времени.
                        </p>
                    </div>

                    {/* Feature 2 */}
                    <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                            <Calendar className="w-6 h-6 text-indigo-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Периоды H1 и H2</h3>
                        <p className="text-gray-600">
                            Разделение данных по полугодиям (H1: январь–июнь, H2: июль–декабрь)
                            для точной подготовки отчетности.
                        </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                            <Smartphone className="w-6 h-6 text-purple-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">PWA приложение</h3>
                        <p className="text-gray-600">
                            Устанавливается как нативное приложение на iOS и Android.
                            Работает офлайн с локальным кэшированием данных.
                        </p>
                    </div>

                    {/* Feature 4 */}
                    <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                            <Shield className="w-6 h-6 text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Безопасность</h3>
                        <p className="text-gray-600">
                            Данные защищены Firebase Authentication и хранятся в облаке Firestore.
                            Синхронизация между устройствами в режиме реального времени.
                        </p>
                    </div>

                    {/* Feature 5 */}
                    <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                            <Zap className="w-6 h-6 text-yellow-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Быстрый учет</h3>
                        <p className="text-gray-600">
                            Добавление транзакций за несколько секунд.
                            Умные категории и автоматическое заполнение полей.
                        </p>
                    </div>

                    {/* Feature 6 */}
                    <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                            <BarChart3 className="w-6 h-6 text-red-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Аналитика</h3>
                        <p className="text-gray-600">
                            Интерактивные графики доходов и расходов по категориям.
                            Визуализация налоговой нагрузки и планирование бюджета.
                        </p>
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
                        Присоединяйтесь к предпринимателям, которые уже упростили налоговый учет с TengeFlow
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
                    <p>&copy; 2026 TengeFlow. Создано для ИП в Казахстане.</p>
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
