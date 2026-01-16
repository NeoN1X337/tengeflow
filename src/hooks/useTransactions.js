import { useState, useEffect } from 'react';
import { collection, addDoc, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export function useTransactions() {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setTransactions([]);
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, `users/${user.uid}/transactions`),
            orderBy('date', 'desc')
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
        });

        return unsubscribe;
    }, [user]);

    const addTransaction = async (data) => {
        if (!user) throw new Error('Не авторизован');

        await addDoc(collection(db, `users/${user.uid}/transactions`), {
            amount: parseFloat(data.amount),
            type: data.type,
            category: data.category,
            date: data.date instanceof Date ? Timestamp.fromDate(data.date) : Timestamp.fromDate(new Date(data.date)),
            isTaxable: data.isTaxable || false,
            comment: data.comment || '',
            createdAt: Timestamp.now()
        });
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

    // Налог 3%
    const tax = taxableIncome * 0.03;

    return {
        transactions,
        loading,
        addTransaction,
        balance,
        totalIncome,
        totalExpense,
        taxableIncome,
        tax
    };
}
