import { Card } from 'flowbite-react';
import { BarChart3, Calculator } from 'lucide-react';
import { useTransactions } from '../hooks/useTransactions';

export default function Analytics() {
    const { taxableIncome, tax } = useTransactions();

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('ru-KZ', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(amount);
    };

    const netIncome = taxableIncome - tax;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Аналитика</h1>

            {/* Графики */}
            <Card>
                <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Графики</h3>
                </div>
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <p>Скоро здесь появятся графики</p>
                </div>
            </Card>

            {/* Налоговый калькулятор для ИП (3%) */}
            <Card>
                <div className="flex items-center gap-2 mb-4">
                    <Calculator className="w-5 h-5 text-green-600" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Налоговый калькулятор (ИП)
                    </h3>
                </div>
                <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-gray-600 dark:text-gray-400">Налогооблагаемый доход</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(taxableIncome)} ₸
                        </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-gray-600 dark:text-gray-400">Налог (3%)</span>
                        <span className="font-semibold text-red-600">
                            {formatCurrency(tax)} ₸
                        </span>
                    </div>
                    <div className="flex justify-between items-center py-3 bg-green-50 dark:bg-green-900/20 rounded-lg px-4">
                        <span className="text-gray-600 dark:text-gray-400 font-medium">Чистый доход</span>
                        <span className="font-bold text-xl text-green-600">
                            {formatCurrency(netIncome)} ₸
                        </span>
                    </div>
                </div>
            </Card>
        </div>
    );
}
