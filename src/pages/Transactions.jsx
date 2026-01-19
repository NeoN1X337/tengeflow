import { Card } from 'flowbite-react';
import { useState, useMemo } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import TransactionModal from '../components/TransactionModal';
import TransactionItem from '../components/TransactionItem';
import FilterBar from '../components/FilterBar';
import PeriodSelector from '../components/PeriodSelector';
import { useNotification } from '../contexts/NotificationContext';

export default function Transactions() {
    const { showToast } = useNotification();
    const [showModal, setShowModal] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);

    // Period State
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString()); // Default to current month string '0'..'11'

    // Состояние фильтров (Category/Type/Taxable only now)
    const [filters, setFilters] = useState({
        type: 'all',
        category: '',
        isTaxable: false
    });

    // Вычисляем dateRange
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

    const { transactions, loading, updateTransaction, deleteTransaction } = useTransactions({
        filterFuture: true,
        orderByCreatedAt: true,
        type: filters.type,
        category: filters.category,
        isTaxable: filters.isTaxable,
        dateRange: dateRange
    });

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

    const handleSaveTransaction = async (data) => {
        if (editingTransaction) {
            await updateTransaction(editingTransaction.id, data);
            setShowModal(false);
            setEditingTransaction(null);
        }
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

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">История транзакций</h1>
                <PeriodSelector
                    selectedYear={selectedYear}
                    selectedMonth={selectedMonth}
                    onYearChange={setSelectedYear}
                    onMonthChange={setSelectedMonth}
                    years={[2024, 2025, 2026, 2027, 2028]}
                />
            </div>

            <FilterBar filters={filters} onFilterChange={setFilters} />

            <Card>
                {loading ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <p className="text-lg">Загрузка...</p>
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <p className="text-lg">Операций не найдено</p>
                        <p className="text-sm mt-2">Попробуйте изменить фильтры</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {transactions.map((txn) => (
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

            <TransactionModal
                show={showModal}
                onClose={() => {
                    setShowModal(false);
                    setEditingTransaction(null);
                }}
                onSave={handleSaveTransaction}
                initialData={editingTransaction}
            />
        </div>
    );
}
