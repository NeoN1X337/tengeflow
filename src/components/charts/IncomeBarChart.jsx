import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { formatCurrency } from '../../utils/formatUtils';

export default function IncomeBarChart({ trendData }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="w-full h-[300px] flex items-center justify-center bg-gray-50 rounded-lg animate-pulse">
                <span className="text-gray-400">Загрузка графика...</span>
            </div>
        );
    }

    if (!trendData || trendData.length === 0) {
        return (
            <div className="w-full h-[300px] flex items-center justify-center text-gray-500">
                Нет данных за этот период
            </div>
        );
    }

    return (
        <div className="w-full h-[300px] min-h-[300px]" data-testid="bar-chart-container" style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={trendData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
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
        </div>
    );
}
