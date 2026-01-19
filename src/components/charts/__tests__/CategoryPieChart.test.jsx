import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CategoryPieChart from '../CategoryPieChart';

describe('CategoryPieChart', () => {
    it('renders empty state when no data provided', async () => {
        render(<CategoryPieChart expenseData={[]} />);
        // Wait for effect
        await screen.findByText('Нет данных о расходах за этот период');
    });

    it('renders chart container when data provided', async () => {
        const mockData = [{ name: 'Food', value: 1000 }];
        render(<CategoryPieChart expenseData={mockData} />);
        await screen.findByTestId('pie-chart-container');
    });
});
