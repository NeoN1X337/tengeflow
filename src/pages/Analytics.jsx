import { useState, useMemo, useEffect } from 'react';
import { Card, Tooltip as FlowbiteTooltip, Badge } from 'flowbite-react';
import PeriodSelector from '../components/PeriodSelector';
import { Calculator, PieChart as PieChartIcon, BarChart3, Calendar, Info } from 'lucide-react';
import { useTransactions } from '../hooks/useTransactions';
import { getTaxStats } from '../utils/taxUtils';
import { useUserProfile } from '../hooks/useUserProfile';
import { formatCurrency } from '../utils/formatUtils';
import CategoryPieChart from '../components/charts/CategoryPieChart';
import IncomeBarChart from '../components/charts/IncomeBarChart';

// Removed COLORS, moved to components

export default function Analytics() {
    // const [period, setPeriod] = useState('month'); // Removed
    const [selectedYear, setSelectedYear] = useState(2026);
    const [selectedMonth, setSelectedMonth] = useState('all');

    // Получаем ставку налога из профиля
    const { profile } = useUserProfile();
    const [taxRate, setTaxRate] = useState(4); // Default visual 4, updates from profile

    useEffect(() => {
        if (profile?.taxRate) {
            setTaxRate(profile.taxRate);
        }
    }, [profile]);

    // Вычисление диапазона дат
    const dateRange = useMemo(() => {
        const now = new Date();
        // Используем выбранный год, но месяц/день берем текущие для привязки периодов (если это логично),
        // или просто строим периоды относительно начала выбранного года.

        if (selectedMonth === 'all') {
            return {
                start: new Date(selectedYear, 0, 1),
                end: new Date(selectedYear, 11, 31, 23, 59, 59)
            };
        } else {
            const monthIndex = parseInt(selectedMonth);
            return {
                start: new Date(selectedYear, monthIndex, 1),
                end: new Date(selectedYear, monthIndex + 1, 0, 23, 59, 59)
            };
        }
    }, [selectedYear, selectedMonth]);

    const { transactions, taxableIncome, tax, loading } = useTransactions({
        dateRange,
        taxRate // Передаем ставку в хук
    });

    // Отдельный запрос для Налогового Календаря (весь выбранный год)
    const yearDateRange = useMemo(() => ({
        start: new Date(selectedYear, 0, 1),
        end: new Date(selectedYear, 11, 31, 23, 59, 59)
    }), [selectedYear]);

    const { transactions: yearTransactions } = useTransactions({
        dateRange: yearDateRange,
        taxRate // Передаем ставку в хук для консистентности (хотя getTaxStats пересчитает)
    });



    const netIncome = taxableIncome - tax;

    // Подготовка данных для PieChart (Расходы по категориям)
    const expenseData = useMemo(() => {
        const expenses = transactions.filter(t => t.type === 'expense');
        const grouped = expenses.reduce((acc, curr) => {
            acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
            return acc;
        }, {});

        return Object.entries(grouped)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [transactions]);

    // Подготовка данных для BarChart (Доходы vs Расходы по месяцам)
    // Группируем данные внутри выбранного периода по месяцам
    const trendData = useMemo(() => {
        const data = {};

        // Инициализируем месяцы в диапазоне
        let current = new Date(dateRange.start);
        while (current <= dateRange.end) {
            const key = current.toLocaleDateString('ru-RU', { month: 'short', year: '2-digit' });
            if (!data[key]) {
                data[key] = { name: key, income: 0, expense: 0, sortDate: new Date(current) };
            }
            current.setMonth(current.getMonth() + 1);
        }

        transactions.forEach(txn => {
            const date = txn.date; // useTransactions уже возвращает Date объект
            const key = date.toLocaleDateString('ru-RU', { month: 'short', year: '2-digit' });

            if (data[key]) {
                if (txn.type === 'income') {
                    data[key].income += txn.amount;
                } else {
                    data[key].expense += txn.amount;
                }
            }
        });

        return Object.values(data).sort((a, b) => a.sortDate - b.sortDate);
    }, [transactions, dateRange]);

    // Данные для Налогового Календаря
    // Передаем динамическую ставку
    const taxStats = useMemo(() => getTaxStats(yearTransactions, selectedYear, taxRate),
        [yearTransactions, selectedYear, taxRate]);

    // Данные для отображения в мониторе
    // Если выбран "Весь год", берем данные из taxStats для полной синхронизации с календарем
    // В противном случае берем данные из текущего фильтра (месяца)
    const displayTaxableIncome = selectedMonth === 'all' ? taxStats.year.income : taxableIncome;
    const displayTax = selectedMonth === 'all' ? taxStats.year.tax : tax;
    const displayNetIncome = displayTaxableIncome - displayTax;

    return (
        <div className="space-y-6 pb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Аналитика</h1>

                {/* Фильтр периода */}
                <PeriodSelector
                    selectedYear={selectedYear}
                    selectedMonth={selectedMonth}
                    onYearChange={setSelectedYear}
                    onMonthChange={setSelectedMonth}
                    years={[2024, 2025, 2026, 2027, 2028]}
                />
            </div>

            {/* Налоговый калькулятор */}
            <Card className="shadow-lg border-t-4 border-t-blue-600">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Calculator className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex flex-col">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            Налоговый монитор
                        </h3>
                        <div className="mt-1">
                            <Badge color="blue" className="inline-flex">
                                Упрощенная декларация (ИПН: {taxRate}%)
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Налогооблагаемый доход</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {formatCurrency(displayTaxableIncome)} ₸
                        </p>
                    </div>

                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                        <p className="text-sm text-red-600 dark:text-red-400 mb-1">Налог ({taxRate}%)</p>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400" data-testid="tax-monitor-amount">
                            {formatCurrency(displayTax)} ₸
                        </p>
                    </div>

                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                        <p className="text-sm text-green-600 dark:text-green-400 mb-1">Чистый доход</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {formatCurrency(displayNetIncome)} ₸
                        </p>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Расходы по категориям (PieChart) */}
                <Card className="shadow-md">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <PieChartIcon className="w-5 h-5 text-purple-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Расходы по категориям</h3>
                        </div>
                    </div>

                    <div className="w-full">
                        <CategoryPieChart expenseData={expenseData} />
                    </div>
                </Card>

                {/* Динамика (BarChart) */}
                <Card className="shadow-md">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Доходы vs Расходы</h3>
                        </div>
                    </div>

                    <div className="w-full">
                        <IncomeBarChart trendData={trendData} />
                    </div>
                </Card>
            </div>

            {/* Налоговый Календарь 2026 */}
            <Card className="shadow-lg border-t-4 border-t-emerald-600">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                        <Calendar className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                Налоговый календарь {selectedYear}
                            </h3>
                            <div className="group relative">
                                <Info className="w-4 h-4 text-gray-400 cursor-help" />
                                <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10 text-center">
                                    Сумма рассчитана автоматически. Пожалуйста, проверяйте актуальные ставки в кабинете налогоплательщика РК
                                </div>
                            </div>
                        </div>
                        <div className="mt-1">
                            <Badge color="indigo" className="inline-flex">
                                Упрощенная декларация (ИПН: {taxRate}%)
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Кварталы */}
                    {['q1', 'q2', 'q3', 'q4'].map((q, idx) => (
                        <div key={q} className={`p-3 rounded-lg border ${taxStats[q].containerClass}`}>
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Q{idx + 1}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${taxStats[q].containerClass.includes('emerald') ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'} dark:bg-gray-600 dark:text-gray-300`}>
                                    {taxStats[q].status}
                                </span>
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 font-medium">Доход:</span>
                                    <span className="text-emerald-600 font-bold">{formatCurrency(taxStats[q].income)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 font-medium">Налог:</span>
                                    <span className="text-orange-600 font-bold" data-testid={`tax-${q}`}>{formatCurrency(taxStats[q].tax)}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Полугодия */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    {/* 1 полугодие */}
                    <div className={`p-4 rounded-xl border ${taxStats.h1.containerClass}`}>
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                1 полугодие
                            </h4>
                            <Badge color={['Текущий квартал', 'В процессе накопления', 'Активный период'].includes(taxStats.h1.status) ? 'info' : (taxStats.h1.status === 'Завершено' ? 'gray' : 'blue')}>
                                {taxStats.h1.status}
                            </Badge>
                        </div>
                        <div className="space-y-1 mb-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Доход:</span>
                                <span className="font-medium">{formatCurrency(taxStats.h1.income)} ₸</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Налог:</span>
                                <span className="font-medium text-red-600 dark:text-red-400" data-testid="tax-h1">
                                    {formatCurrency(taxStats.h1.tax)} ₸
                                </span>
                            </div>
                        </div>
                        {taxStats.h1.deadlines && (
                            <div className="mt-3 pt-2 border-t border-gray-200/50 text-xs flex flex-col gap-1">
                                <div className={`flex items-center gap-1 ${taxStats.h1.deadlines.ui.submission.color}`}>
                                    <span>{taxStats.h1.deadlines.ui.submission.icon}</span>
                                    <span>Сдача до {taxStats.h1.deadlines.submission}</span>
                                </div>
                                <div className={`flex items-center gap-1 ${taxStats.h1.deadlines.ui.payment.color}`}>
                                    <span>{taxStats.h1.deadlines.ui.payment.icon}</span>
                                    <span>Оплата до {taxStats.h1.deadlines.payment}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 2 полугодие */}
                    <div className={`p-4 rounded-xl border ${taxStats.h2.containerClass}`}>
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                2 полугодие
                            </h4>
                            <Badge color={['Текущий квартал', 'В процессе накопления', 'Активный период'].includes(taxStats.h2.status) ? 'info' : (taxStats.h2.status === 'Завершено' ? 'gray' : 'blue')}>
                                {taxStats.h2.status}
                            </Badge>
                        </div>
                        <div className="space-y-1 mb-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Доход:</span>
                                <span className="font-medium">{formatCurrency(taxStats.h2.income)} ₸</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Налог:</span>
                                <span className="font-medium text-red-600 dark:text-red-400" data-testid="tax-h2">
                                    {formatCurrency(taxStats.h2.tax)} ₸
                                </span>
                            </div>
                        </div>
                        {taxStats.h2.deadlines && (
                            <div className="mt-3 pt-2 border-t border-gray-200/50 text-xs flex flex-col gap-1">
                                <div className={`flex items-center gap-1 ${taxStats.h2.deadlines.ui.submission.color}`}>
                                    <span>{taxStats.h2.deadlines.ui.submission.icon}</span>
                                    <span>Сдача до {taxStats.h2.deadlines.submission}</span>
                                </div>
                                <div className={`flex items-center gap-1 ${taxStats.h2.deadlines.ui.payment.color}`}>
                                    <span>{taxStats.h2.deadlines.ui.payment.icon}</span>
                                    <span>Оплата до {taxStats.h2.deadlines.payment}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Итого за год */}
                <div className="mt-2 p-4 bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl text-white">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div>
                            <p className="text-gray-400 text-sm">Итого за {selectedYear} год</p>
                            <h4 className="text-2xl font-bold">Налоговая отчетность</h4>
                        </div>
                        <div className="flex gap-8 text-right">
                            <div>
                                <p className="text-gray-400 text-xs uppercase">Общий доход</p>
                                <p className="text-xl font-bold text-emerald-400">{formatCurrency(taxStats.year.income)} ₸</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-xs uppercase">К уплате</p>
                                <p className="text-xl font-bold text-orange-400" data-testid="tax-year">{formatCurrency(taxStats.year.tax)} ₸</p>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
