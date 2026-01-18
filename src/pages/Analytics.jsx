import { useState, useMemo } from 'react';
import { Card, Button, Tooltip as FlowbiteTooltip } from 'flowbite-react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area
} from 'recharts';
import { Calculator, PieChart as PieChartIcon, BarChart3, Calendar } from 'lucide-react';
import { useTransactions } from '../hooks/useTransactions';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'];

export default function Analytics() {
    const [period, setPeriod] = useState('month'); // 'month', 'quarter', 'half-year', 'year'

    // Вычисление диапазона дат
    const dateRange = useMemo(() => {
        const now = new Date();
        let start = new Date();
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59); // Конец текущего месяца

        switch (period) {
            case 'month':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'quarter':
                start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
                break;
            case 'half-year':
                start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
                break;
            case 'year':
                start = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                start = new Date(now.getFullYear(), now.getMonth(), 1);
        }
        return { start, end };
    }, [period]);

    const { transactions, taxableIncome, tax, loading } = useTransactions({
        dateRange
    });

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('ru-KZ', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
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

    return (
        <div className="space-y-6 pb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Аналитика</h1>

                {/* Фильтр периода */}
                <div className="flex bg-white dark:bg-gray-800 rounded-lg shadow-sm p-1 border border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setPeriod('month')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${period === 'month'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                            }`}
                    >
                        Месяц
                    </button>
                    <button
                        onClick={() => setPeriod('quarter')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${period === 'quarter'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                            }`}
                    >
                        Квартал
                    </button>
                    <button
                        onClick={() => setPeriod('half-year')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${period === 'half-year'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                            }`}
                    >
                        Полгода
                    </button>
                    <button
                        onClick={() => setPeriod('year')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${period === 'year'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                            }`}
                    >
                        Год
                    </button>
                </div>
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
                            <ResponsiveContainer width="100%" height="100%">
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
                            <ResponsiveContainer width="100%" height="100%">
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
        </div>
    );
}
