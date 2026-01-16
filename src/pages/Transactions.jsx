import { Card, Badge } from 'flowbite-react';
import { Filter, Calendar } from 'lucide-react';
import { useTransactions } from '../hooks/useTransactions';

export default function Transactions() {
    const { transactions, loading } = useTransactions();

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('ru-KZ', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (date) => {
        return new Intl.DateTimeFormat('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(date);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">История транзакций</h1>
                <Filter className="w-6 h-6 text-gray-400 cursor-pointer hover:text-gray-600" />
            </div>

            <Card>
                {loading ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <p className="text-lg">Загрузка...</p>
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <p className="text-lg">Транзакций пока нет</p>
                        <p className="text-sm mt-2">Начните отслеживать свои финансы</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {transactions.map((txn) => (
                            <div
                                key={txn.id}
                                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge color={txn.type === 'income' ? 'success' : 'failure'}>
                                            {txn.type === 'income' ? 'Доход' : 'Расход'}
                                        </Badge>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {txn.category}
                                        </span>
                                        {txn.isTaxable && (
                                            <Badge color="info" size="sm">
                                                Налог 3%
                                            </Badge>
                                        )}
                                    </div>
                                    {txn.comment && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                            {txn.comment}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                        <Calendar className="w-3 h-3" />
                                        {formatDate(txn.date)}
                                    </div>
                                </div>
                                <div className={`text-xl font-bold ${txn.type === 'income' ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                    {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount)} ₸
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
}
