import { useState } from 'react';
import { Card, Button, Badge } from 'flowbite-react';
import { Plus, TrendingUp, Wallet, Calendar } from 'lucide-react';
import { useTransactions } from '../hooks/useTransactions';
import TransactionModal from '../components/TransactionModal';

export default function Dashboard() {
    const [showModal, setShowModal] = useState(false);
    const { transactions, loading, addTransaction, balance, totalIncome, totalExpense } = useTransactions();

    const handleSaveTransaction = async (data) => {
        await addTransaction(data);
    };

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

    // Последние 5 транзакций
    const recentTransactions = transactions.slice(0, 5);

    return (
        <div className="space-y-6 pb-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                {/* Desktop button - hidden on mobile */}
                <Button
                    onClick={() => setShowModal(true)}
                    className="hidden md:flex bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    <span className="text-white font-semibold">Добавить операцию</span>
                </Button>
            </div>

            {/* Mobile FAB - shown only on mobile */}
            <button
                onClick={() => setShowModal(true)}
                className="md:hidden fixed bottom-20 right-4 z-40 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
                aria-label="Добавить операцию"
            >
                <Plus className="w-6 h-6" />
            </button>

            {/* Баланс */}
            <Card className="shadow-lg">
                <div className="text-center">
                    <p className="text-sm text-gray-500 mb-2">Текущий баланс</p>
                    <h2 className="text-4xl font-bold text-gray-900 mb-1">
                        {formatCurrency(balance)} ₸
                    </h2>
                    <div className="flex items-center justify-center gap-6 mt-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                            <div className="text-left">
                                <p className="text-xs text-gray-600">Доход</p>
                                <p className="font-bold text-green-600">{formatCurrency(totalIncome)} ₸</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-red-600 rotate-180" />
                            <div className="text-left">
                                <p className="text-xs text-gray-600">Расход</p>
                                <p className="font-bold text-red-600">{formatCurrency(totalExpense)} ₸</p>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Последние операции */}
            <Card className="shadow-lg">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-blue-600" />
                        Последние операции
                    </h3>
                </div>

                {loading ? (
                    <div className="text-center py-8 text-gray-500">
                        <p>Загрузка...</p>
                    </div>
                ) : recentTransactions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <p>Операций пока нет</p>
                        <p className="text-sm mt-2">Добавьте первую транзакцию</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {recentTransactions.map((txn) => (
                            <div
                                key={txn.id}
                                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge color={txn.type === 'income' ? 'success' : 'failure'}>
                                            <span className="font-semibold">
                                                {txn.type === 'income' ? 'Доход' : 'Расход'}
                                            </span>
                                        </Badge>
                                        <span className="font-medium text-gray-900">
                                            {txn.category}
                                        </span>
                                    </div>
                                    {txn.comment && (
                                        <p className="text-sm text-gray-600 mb-1">
                                            {txn.comment}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
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

            {/* Transaction Modal */}
            <TransactionModal
                show={showModal}
                onClose={() => setShowModal(false)}
                onSave={handleSaveTransaction}
            />
        </div>
    );
}
