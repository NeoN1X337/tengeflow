import { describe, it, expect } from 'vitest';
import { getTaxStats, Transaction } from '../taxUtils';

describe('taxUtils', () => {
    it('calculates 4% tax correctly', () => {
        // Arrange
        const transactions: Transaction[] = [
            { id: '1', amount: 100000, type: 'income', isTaxable: true, date: '2026-01-15T10:00:00', category: 'Salary' }
        ];

        // Act
        const stats = getTaxStats(transactions, 2026, 4);

        // Assert
        expect(stats.year.income).toBe(100000);
        expect(stats.year.tax).toBe(4000);
    });

    it('correctly separates H1 and H2 transactions', () => {
        // Arrange
        const transactions: Transaction[] = [
            { id: '1', amount: 50000, type: 'income', isTaxable: true, date: new Date('2026-06-30T10:00:00'), category: 'Salary' }, // H1
            { id: '2', amount: 50000, type: 'income', isTaxable: true, date: new Date('2026-07-01T10:00:00'), category: 'Salary' }  // H2
        ];

        // Act
        const stats = getTaxStats(transactions, 2026, 4);

        // Assert
        expect(stats.h1.income).toBe(50000);
        expect(stats.h1.tax).toBe(2000);

        expect(stats.h2.income).toBe(50000);
        expect(stats.h2.tax).toBe(2000);

        expect(stats.year.income).toBe(100000);
    });

    it('ignores non-taxable or expense transactions', () => {
        // Arrange
        const transactions: Transaction[] = [
            { id: '1', amount: 100000, type: 'income', isTaxable: false, date: '2026-01-15', category: 'Gift' },
            { id: '2', amount: 50000, type: 'expense', isTaxable: undefined, date: '2026-01-15', category: 'Food' }
        ];

        // Act
        const stats = getTaxStats(transactions, 2026, 4);

        // Assert
        expect(stats.year.income).toBe(0);
        expect(stats.year.tax).toBe(0);
    });

    it('aggregates quarterly data correctly', () => {
        // Arrange
        const transactions: Transaction[] = [
            { id: '1', amount: 10000, type: 'income', isTaxable: true, date: '2026-01-15', category: 'Work' }, // Q1
            { id: '2', amount: 10000, type: 'income', isTaxable: true, date: '2026-04-15', category: 'Work' }, // Q2
            { id: '3', amount: 10000, type: 'income', isTaxable: true, date: '2026-07-15', category: 'Work' }, // Q3
            { id: '4', amount: 10000, type: 'income', isTaxable: true, date: '2026-10-15', category: 'Work' }, // Q4
        ];

        // Act
        const stats = getTaxStats(transactions, 2026, 4);

        // Assert
        expect(stats.q1.income).toBe(10000);
        expect(stats.q2.income).toBe(10000);
        expect(stats.q3.income).toBe(10000);
        expect(stats.q4.income).toBe(10000);
        expect(stats.year.income).toBe(40000);
    });
});
