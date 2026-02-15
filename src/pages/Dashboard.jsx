import { useState, useMemo, useEffect } from 'react';
import { Card, Button } from 'flowbite-react';
import { Plus, TrendingUp, TrendingDown, Wallet, ShieldCheck, Banknote, Users } from 'lucide-react';
import { useTransactions } from '../hooks/useTransactions';
import TransactionModal from '../components/TransactionModal';
import TransactionItem from '../components/TransactionItem';
import FilterBar from '../components/FilterBar';
import PeriodSelector from '../components/PeriodSelector';
import TaxMonitor from '../components/TaxMonitor';
import { useNotification } from '../contexts/NotificationContext';
import { useUserProfile } from '../hooks/useUserProfile';
import { formatCurrency } from '../utils/formatUtils';
import { calculateMonthlyObligations } from '../utils/taxCalculator';

export default function Dashboard() {
    const { showToast } = useNotification();
    const [showModal, setShowModal] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);

    // Period State
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString());

    // Get Profile (with isBusinessMode)
    const { profile } = useUserProfile();
    const [taxRate, setTaxRate] = useState(4);
    const isBusiness = profile?.isBusinessMode === true;

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

    const { transactions, loading, addTransaction, updateTransaction, deleteTransaction, balance, totalIncome, totalExpense, businessIncome, otherTaxableIncome } = useTransactions({
        filterFuture: true,
        orderByCreatedAt: true,
        type: filters.type,
        category: filters.category,
        isTaxable: filters.isTaxable,
        dateRange: dateRange,
        taxRate
    });

    // ─── Safe-to-Spend расчёт ─────────────────────────────────────────────
    const safeToSpend = useMemo(() => {
        if (!isBusiness) return null;

        const bornAfter1975 = profile?.bornAfter1975 ?? true;
        const hasEmployees = profile?.hasEmployees ?? false;
        const totalEmployeeSalary = profile?.totalEmployeeSalary ?? 0;

        const hasIncome = businessIncome > 0 || otherTaxableIncome > 0;
        const hasEmployee = hasEmployees && totalEmployeeSalary > 0;

        if (!hasIncome && !hasEmployee) {
            return { taxReserve: 0, available: balance, percent: 0, personalReserve: 0, employeeReserve: 0 };
        }

        const result = calculateMonthlyObligations({
            monthlyIncome: businessIncome,
            customTaxRate: taxRate,
            bornAfter1975,
            hasEmployees,
            totalEmployeeSalary,
        });

        // Прочий доход — только ИПН 10%
        const otherIpn = otherTaxableIncome > 0
            ? Math.round(otherTaxableIncome * 0.10 * 100) / 100
            : 0;

        const personalReserve = Math.round(
            (result.summary.taxReserve + otherIpn) * 100
        ) / 100;
        const employeeReserve = result.employeeObligations?.totalEmployeeObligations ?? 0;
        const taxReserve = Math.round((personalReserve + employeeReserve) * 100) / 100;
        const available = Math.round((balance - taxReserve) * 100) / 100;
        const percent = balance > 0 ? Math.min((taxReserve / balance) * 100, 100) : 0;

        return { taxReserve, available, percent, personalReserve, employeeReserve };
    }, [isBusiness, balance, businessIncome, otherTaxableIncome, taxRate, profile]);

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

    const recentTransactions = transactions.slice(0, 5);

    const handleAddClick = () => {
        setEditingTransaction(null);
        setShowModal(true);
    };

    // Цвет прогресс-бара в зависимости от процента
    const getProgressColor = (pct) => {
        if (pct < 20) return 'bg-emerald-500';
        if (pct < 40) return 'bg-yellow-500';
        if (pct < 60) return 'bg-orange-500';
        return 'bg-red-500';
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

                    {/* Desktop button */}
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

            {/* Mobile FAB */}
            <button
                onClick={handleAddClick}
                className="md:hidden fixed bottom-20 right-4 z-40 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
                aria-label="Добавить операцию"
            >
                <Plus className="w-6 h-6" />
            </button>

            <FilterBar filters={filters} onFilterChange={setFilters} />

            {/* ═══ Safe-to-Spend Card (Business mode) ═══ */}
            {isBusiness && safeToSpend ? (
                <Card className="shadow-lg overflow-hidden" data-testid="balance-card">
                    {/* ── Текущий баланс ── */}
                    <div className="text-center pb-4">
                        <p className="text-xs uppercase tracking-wider text-gray-400 font-medium mb-1">
                            Текущий баланс
                        </p>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900" data-testid="total-balance">
                            {formatCurrency(balance)} ₸
                        </h2>

                        {/* Доход / Расход — compact badges */}
                        <div className="flex items-center justify-center gap-3 mt-3">
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                                <TrendingUp className="w-3 h-3" />
                                {formatCurrency(totalIncome)} ₸
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500 bg-red-50 px-2.5 py-1 rounded-full">
                                <TrendingDown className="w-3 h-3" />
                                {formatCurrency(totalExpense)} ₸
                            </span>
                        </div>
                    </div>

                    {/* ── Резерв на налоги (progress bar) ── */}
                    <div className="mx-0 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                                <ShieldCheck className="w-4 h-4 text-orange-500" />
                                Резерв на налоги
                            </div>
                            <span className="text-sm font-bold text-orange-600">
                                {formatCurrency(safeToSpend.taxReserve)} ₸
                            </span>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${getProgressColor(safeToSpend.percent)}`}
                                style={{ width: `${Math.min(safeToSpend.percent, 100)}%` }}
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-1.5">
                            {safeToSpend.percent.toFixed(0)}% от баланса зарезервировано
                        </p>

                        {/* За себя / За штат — мини-разбивка */}
                        {safeToSpend.employeeReserve > 0 && (
                            <div className="flex gap-3 mt-2 text-xs">
                                <span className="inline-flex items-center gap-1 text-blue-600">
                                    <Banknote className="w-3 h-3" />
                                    за себя: {formatCurrency(safeToSpend.personalReserve)} ₸
                                </span>
                                <span className="inline-flex items-center gap-1 text-violet-600">
                                    <Users className="w-3 h-3" />
                                    за штат: {formatCurrency(safeToSpend.employeeReserve)} ₸
                                </span>
                            </div>
                        )}
                    </div>

                    {/* ── Доступно к трате ── */}
                    <div className="text-center pt-3">
                        <p className="text-xs uppercase tracking-wider text-green-500 font-semibold mb-1">
                            Доступно к трате
                        </p>
                        <p className={`text-3xl md:text-4xl font-extrabold ${safeToSpend.available >= 0 ? 'text-emerald-600' : 'text-red-600'
                            }`}>
                            {formatCurrency(safeToSpend.available)} ₸
                        </p>
                    </div>
                </Card>
            ) : (
                /* ═══ Personal Mode Balance (simple) ═══ */
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
            )}

            {/* Tax Widget — only for Business mode */}
            {isBusiness && (
                <TaxMonitor
                    viewMode="compact"
                    businessIncome={businessIncome}
                    otherTaxableIncome={otherTaxableIncome}
                    taxRate={taxRate}
                    bornAfter1975={profile?.bornAfter1975 ?? true}
                    hasEmployees={profile?.hasEmployees ?? false}
                    totalEmployeeSalary={profile?.totalEmployeeSalary ?? 0}
                />
            )}

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
