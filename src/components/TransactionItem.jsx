import { Calendar, Pencil, Trash2, ArrowUpRight, ArrowDownLeft, Percent } from 'lucide-react';

export default function TransactionItem({ transaction, onEdit, onDelete }) {
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

    const isIncome = transaction.type === 'income';

    return (
        <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-100 dark:border-gray-700 shadow-sm relative group">

            {/* 1. Type Icon (Leftmost) */}
            <div className={`p-2 rounded-full flex-shrink-0 ${isIncome ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {isIncome ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
            </div>

            {/* 2. Content (Category & Date) - Fills Center */}
            <div className="flex flex-col flex-1 min-w-0 mr-2">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white truncate block text-[15px]">
                        {transaction.category}
                    </span>
                    {transaction.isTaxable && (
                        <div className="bg-blue-100 text-blue-600 p-0.5 rounded-md flex-shrink-0" title="Налог 3%">
                            <Percent className="w-3 h-3" />
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                    <Calendar className="w-3 h-3" />
                    {formatDate(transaction.date)}
                    {transaction.comment && (
                        <>
                            <span className="mx-1">•</span>
                            <span className="truncate max-w-[80px] sm:max-w-[150px]">{transaction.comment}</span>
                        </>
                    )}
                </div>
            </div>

            {/* 3. Right Block: Amount & Actions */}
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                {/* Amount */}
                <div className={`text-base font-bold whitespace-nowrap ${isIncome ? 'text-green-600' : 'text-red-600'
                    }`}>
                    {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)} ₸
                </div>

                {/* Action Buttons (Row) */}
                <div className="flex items-center gap-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onEdit(transaction)}
                        className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                        title="Редактировать"
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete(transaction.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors p-1"
                        title="Удалить"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
