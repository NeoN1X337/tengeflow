import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from 'recharts';
import { formatCurrency } from '../../utils/formatUtils';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'];

export default function CategoryPieChart({ expenseData }) {
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

    if (!expenseData || expenseData.length === 0) {
        return (
            <div className="w-full h-[300px] flex items-center justify-center text-gray-500">
                Нет данных о расходах за этот период
            </div>
        );
    }

    return (
        <div className="w-full h-[300px] min-h-[300px]" data-testid="pie-chart-container" style={{ width: '100%', height: 300 }}>
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
        </div>
    );
}
