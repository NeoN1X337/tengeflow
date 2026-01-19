import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import IncomeBarChart from '../IncomeBarChart';

describe('IncomeBarChart', () => {
    it('renders empty state when no data provided', async () => {
        render(<IncomeBarChart trendData={[]} />);
        await screen.findByText('Нет данных за этот период');
    });

    it('renders chart container when data provided', async () => {
        const mockData = [{ name: 'Jan 24', income: 1000, expense: 500 }];
        render(<IncomeBarChart trendData={mockData} />);
        await screen.findByTestId('bar-chart-container');
    });
});
