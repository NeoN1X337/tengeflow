import { useState, useMemo, useEffect } from 'react';
import { Card, Button, Badge } from 'flowbite-react';
import { Plus, TrendingUp, Wallet, Calendar } from 'lucide-react';
import { useTransactions } from '../hooks/useTransactions';
import TransactionModal from '../components/TransactionModal';
import TransactionItem from '../components/TransactionItem';
import FilterBar from '../components/FilterBar';
import PeriodSelector from '../components/PeriodSelector';
import { useNotification } from '../contexts/NotificationContext';
import { useUserProfile } from '../hooks/useUserProfile';
import { formatCurrency, formatDate } from '../utils/formatUtils';

export default function Dashboard() {
    const { showToast } = useNotification();
    const [showModal, setShowModal] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);

    // Period State
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString()); // Default to current month string '0'..'11'

    // Get Tax Rate
    const { profile } = useUserProfile();
    const [taxRate, setTaxRate] = useState(4);

    useEffect(() => {
        if (profile?.taxRate) {
            setTaxRate(profile.taxRate);
        }
    }, [profile]);

    // Состояние фильтров
    const [filters, setFilters] = useState({
        type: 'all',
        category: '',
        isTaxable: false
    });

    const dateRange = useMemo(() => {
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

    const { transactions, loading, addTransaction, updateTransaction, deleteTransaction, balance, totalIncome, totalExpense } = useTransactions({
        filterFuture: true,
        orderByCreatedAt: true,
        type: filters.type,
        category: filters.category,
        isTaxable: filters.isTaxable,
        dateRange: dateRange,
        taxRate // Pass dynamic tax rate
    });

    const handleSaveTransaction = async (data) => {
        if (editingTransaction) {
            await updateTransaction(editingTransaction.id, data);
        } else {
            await addTransaction(data);
        }
    };

    const handleEdit = (txn) => {
        setEditingTransaction(txn);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Вы уверены, что хотите удалить эту операцию?')) {
            await deleteTransaction(id);
            showToast('Операция успешно удалена');
        }
    };

    // Последние 5 транзакций
    const recentTransactions = transactions.slice(0, 5);

    const handleAddClick = () => {
        setEditingTransaction(null);
        setShowModal(true);
    };

    return (
        <div className="space-y-6 pb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

                <div className="flex gap-4 items-center">
                    <PeriodSelector
                        selectedYear={selectedYear}
                        selectedMonth={selectedMonth}
                        onYearChange={setSelectedYear}
                        onMonthChange={setSelectedMonth}
                        years={[2024, 2025, 2026, 2027, 2028]}
                    />

                    {/* Desktop button - hidden on mobile */}
                    <Button
                        onClick={handleAddClick}
                        className="hidden md:flex bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        data-testid="add-transaction-button"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        <span className="text-white font-semibold">Добавить</span>
                    </Button>
                </div>
            </div>

            {/* Mobile FAB - shown only on mobile */}
            <button
                onClick={handleAddClick}
                className="md:hidden fixed bottom-20 right-4 z-40 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
                aria-label="Добавить операцию"
            >
                <Plus className="w-6 h-6" />
            </button>

            <FilterBar filters={filters} onFilterChange={setFilters} />

            {/* Баланс */}
            <Card className="shadow-lg" data-testid="balance-card">
                <div className="text-center">
                    <p className="text-sm text-gray-500 mb-2">Текущий баланс</p>
                    <h2 className="text-4xl font-bold text-gray-900 mb-1" data-testid="total-balance">
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
                        <p>Операций не найдено</p>
                        <p className="text-sm mt-2">Попробуйте изменить фильтры</p>
                    </div>
                ) : (
                    <div className="space-y-3" data-testid="transaction-list">
                        {recentTransactions.map((txn) => (
                            <TransactionItem
                                key={txn.id}
                                transaction={txn}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}
            </Card>

            {/* Transaction Modal */}
            <TransactionModal
                show={showModal}
                onClose={() => {
                    setShowModal(false);
                    setEditingTransaction(null);
                }}
                onSave={handleSaveTransaction}
                initialData={editingTransaction}
                topTransactions={recentTransactions}
            />
        </div>
    );
}
