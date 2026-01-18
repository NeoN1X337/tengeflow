import { useState, useEffect } from 'react';
import { collection, addDoc, query, orderBy, onSnapshot, Timestamp, serverTimestamp, where, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export function useTransactions(options = {}) {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Деструктуризация параметров фильтрации
    const {
        filterFuture,
        orderByCreatedAt,
        type = 'all',
        category = '',
        dateRange = null,
        isTaxable = false
    } = options;

    useEffect(() => {
        if (!user) {
            setTransactions([]);
            setLoading(false);
            return;
        }

        let constraints = [];

        // Фильтрация по типу (доход/расход)
        if (type && type !== 'all') {
            constraints.push(where('type', '==', type));
        }

        // Фильтрация по категории
        if (category) {
            constraints.push(where('category', '==', category));
        }

        // Фильтрация "Только налогооблагаемые"
        if (isTaxable) {
            constraints.push(where('isTaxable', '==', true));
        }

        // Фильтрация по диапазону дач (например, месяц)
        if (dateRange && dateRange.start && dateRange.end) {
            constraints.push(where('date', '>=', Timestamp.fromDate(dateRange.start)));
            constraints.push(where('date', '<=', Timestamp.fromDate(dateRange.end)));
        }

        if (filterFuture) {
            // Если фильтр по дате уже есть, filterFuture может конфликтовать или быть излишним, 
            // но оставим для совместимости, если dateRange не задан.
            if (!dateRange) {
                constraints.push(where('date', '<=', Timestamp.fromDate(new Date())));
            }
        }

        // Сортировка
        // Firestore требует, чтобы первое поле в orderBy совпадало с полем в where (для диапазонов и равенства)
        // Если мы фильтруем по дате, то сортировка должна быть по дате.
        if (dateRange || filterFuture) {
            constraints.push(orderBy('date', 'desc'), orderBy('createdAt', 'desc'));
        } else if (orderByCreatedAt) {
            constraints.push(orderBy('createdAt', 'desc'));
        } else {
            constraints.push(orderBy('date', 'desc'), orderBy('createdAt', 'desc'));
        }

        const q = query(
            collection(db, `users/${user.uid}/transactions`),
            ...constraints
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const txns = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                // Конвертируем Firestore Timestamp в Date
                date: doc.data().date?.toDate ? doc.data().date.toDate() : new Date(doc.data().date)
            }));
            setTransactions(txns);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching transactions: ", error);
            setTransactions([]); // Clear data on error to avoid stale state
            setLoading(false);
        });

        return unsubscribe;
    }, [user, filterFuture, orderByCreatedAt, type, category, dateRange, isTaxable]);

    const addTransaction = async (data) => {
        if (!user) throw new Error('Не авторизован');

        await addDoc(collection(db, `users/${user.uid}/transactions`), {
            amount: parseFloat(data.amount),
            type: data.type,
            category: data.category,
            date: data.date instanceof Date ? Timestamp.fromDate(data.date) : Timestamp.fromDate(new Date(data.date)),
            isTaxable: data.isTaxable || false,
            comment: data.comment || '',
            createdAt: serverTimestamp()
        });
    };

    const updateTransaction = async (id, data) => {
        if (!user) throw new Error('Не авторизован');

        const docRef = doc(db, `users/${user.uid}/transactions`, id);
        await updateDoc(docRef, {
            amount: parseFloat(data.amount),
            type: data.type,
            category: data.category,
            date: data.date instanceof Date ? Timestamp.fromDate(data.date) : Timestamp.fromDate(new Date(data.date)),
            isTaxable: data.isTaxable || false,
            comment: data.comment || ''
        });
    };

    const deleteTransaction = async (id) => {
        if (!user) throw new Error('Не авторизован');

        const docRef = doc(db, `users/${user.uid}/transactions`, id);
        await deleteDoc(docRef);
    };

    // Вычисление баланса
    const balance = transactions.reduce((acc, txn) => {
        return txn.type === 'income' ? acc + txn.amount : acc - txn.amount;
    }, 0);

    // Общий доход
    const totalIncome = transactions
        .filter(txn => txn.type === 'income')
        .reduce((acc, txn) => acc + txn.amount, 0);

    // Общий расход
    const totalExpense = transactions
        .filter(txn => txn.type === 'expense')
        .reduce((acc, txn) => acc + txn.amount, 0);

    // Налогооблагаемый доход
    const taxableIncome = transactions
        .filter(txn => txn.type === 'income' && txn.isTaxable)
        .reduce((acc, txn) => acc + txn.amount, 0);

    // Налог 4%
    // Налог 4%
    const tax = taxableIncome * 0.04;

    return {
        transactions,
        loading,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        balance,
        totalIncome,
        totalExpense,
        taxableIncome,
        tax
    };
}
