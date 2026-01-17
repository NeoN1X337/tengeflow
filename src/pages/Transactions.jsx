import { Card } from 'flowbite-react';
import { useState, useMemo } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import TransactionModal from '../components/TransactionModal';
import TransactionItem from '../components/TransactionItem';
import FilterBar from '../components/FilterBar';

export default function Transactions() {
    const [showModal, setShowModal] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);

    // Состояние фильтров
    const [filters, setFilters] = useState({
        type: 'all',
        month: new Date(), // По умолчанию текущий месяц
        category: '',
        isTaxable: false
    });

    // Вычисляем dateRange на основе выбранного месяца
    const dateRange = useMemo(() => {
        if (!filters.month || !(filters.month instanceof Date) || isNaN(filters.month)) return null;
        const start = new Date(filters.month.getFullYear(), filters.month.getMonth(), 1);
        const end = new Date(filters.month.getFullYear(), filters.month.getMonth() + 1, 0, 23, 59, 59);
        return { start, end };
    }, [filters.month]);

    const { transactions, loading, updateTransaction, deleteTransaction } = useTransactions({
        filterFuture: true, // Можно оставить или убрать, если dateRange покрывает это
        orderByCreatedAt: true, // Или false, если хотим сортировку по дате транзакции
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
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">История транзакций</h1>
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
