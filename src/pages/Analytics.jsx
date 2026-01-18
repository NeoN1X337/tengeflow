import { useState, useMemo } from 'react';
import { Card, Tooltip as FlowbiteTooltip } from 'flowbite-react';
import PeriodSelector from '../components/PeriodSelector';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area
} from 'recharts';
import { Calculator, PieChart as PieChartIcon, BarChart3, Calendar } from 'lucide-react';
import { useTransactions } from '../hooks/useTransactions';
import { getTaxStats } from '../utils/taxUtils';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'];

export default function Analytics() {
    // const [period, setPeriod] = useState('month'); // Removed
    const [selectedYear, setSelectedYear] = useState(2026);
    const [selectedMonth, setSelectedMonth] = useState('all');

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
        dateRange
    });

    // Отдельный запрос для Налогового Календаря (весь выбранный год)
    const yearDateRange = useMemo(() => ({
        start: new Date(selectedYear, 0, 1),
        end: new Date(selectedYear, 11, 31, 23, 59, 59)
    }), [selectedYear]);

    const { transactions: yearTransactions } = useTransactions({
        dateRange: yearDateRange
    });

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('ru-KZ', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

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
    const taxStats = useMemo(() => getTaxStats(yearTransactions, selectedYear), [yearTransactions, selectedYear]);

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
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        Налоговый монитор
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Налогооблагаемый доход</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {formatCurrency(taxableIncome)} ₸
                        </p>
                    </div>

                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                        <p className="text-sm text-red-600 dark:text-red-400 mb-1">Налог (4%)</p>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400" data-testid="tax-monitor-amount">
                            {formatCurrency(tax)} ₸
                        </p>
                    </div>

                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                        <p className="text-sm text-green-600 dark:text-green-400 mb-1">Чистый доход</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {formatCurrency(netIncome)} ₸
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

                    <div className="h-[300px] w-full">
                        {expenseData.length > 0 ? (
                            <ResponsiveContainer width="99%" height="100%" minWidth={0} minHeight={0} debounce={200}>
                                <PieChart>
                                    <Pie
                                        data={expenseData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {expenseData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip
                                        formatter={(value) => `${formatCurrency(value)} ₸`}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-gray-500">
                                Нет данных о расходах за этот период
                            </div>
                        )}
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

                    <div className="h-[300px] w-full">
                        {trendData.length > 0 ? (
                            <ResponsiveContainer width="99%" height="100%" minWidth={0} minHeight={0} debounce={200}>
                                <BarChart
                                    data={trendData}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6B7280', fontSize: 12 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6B7280', fontSize: 12 }}
                                        tickFormatter={(value) => `${value / 1000}k`}
                                    />
                                    <RechartsTooltip
                                        formatter={(value) => `${formatCurrency(value)} ₸`}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    <Bar dataKey="income" name="Доход" fill="#10B981" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="expense" name="Расход" fill="#EF4444" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-gray-500">
                                Нет данных за этот период
                            </div>
                        )}
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
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            Налоговый календарь {selectedYear}
                        </h3>
                        <p className="text-xs text-gray-500">Ставка 4%</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Кварталы */}
                    {['q1', 'q2', 'q3', 'q4'].map((q, idx) => (
                        <div key={q} className="p-3 bg-white border border-gray-100 dark:bg-gray-700/30 rounded-lg shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Q{idx + 1}</span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300">
                                    {taxStats[q].status}
                                </span>
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Доход:</span>
                                    <span className="text-emerald-600 font-medium">{formatCurrency(taxStats[q].income)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Налог:</span>
                                    <span className="text-orange-600 font-bold" data-testid={`tax-${q}`}>{formatCurrency(taxStats[q].tax)}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Полугодия */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    {['h1', 'h2'].map((h, idx) => (
                        <div key={h} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-600">
                            <div className="flex justify-between mb-3">
                                <h4 className="font-bold text-gray-800 dark:text-gray-200">
                                    {idx === 0 ? '1-е полугодие' : '2-е полугодие'}
                                </h4>
                                <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                                    {taxStats[h].status}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase">Доход</p>
                                    <p className="text-lg font-bold text-emerald-600">{formatCurrency(taxStats[h].income)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase">Налог</p>
                                    <p className="text-lg font-bold text-orange-600" data-testid={`tax-${h}`}>{formatCurrency(taxStats[h].tax)}</p>
                                </div>
                            </div>
                        </div>
                    ))}
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
