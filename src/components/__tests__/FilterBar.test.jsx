import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FilterBar from '../FilterBar';

describe('FilterBar', () => {
    const defaultFilters = {
        type: 'all',
        category: '',
        isTaxable: false
    };

    const onFilterChange = vi.fn();

    it('renders active category chip when category selected', () => {
        render(<FilterBar filters={{ ...defaultFilters, category: 'Food' }} onFilterChange={onFilterChange} />);
        expect(screen.getByText('Food')).toBeInTheDocument();
        expect(screen.getByText('Активные фильтры:')).toBeInTheDocument();
    });

    it('renders active taxable chip when taxable selected', () => {
        render(<FilterBar filters={{ ...defaultFilters, isTaxable: true }} onFilterChange={onFilterChange} />);
        expect(screen.getByText('Налогооблагаемые')).toBeInTheDocument();
    });

    it('clears active filter when X clicked', () => {
        render(<FilterBar filters={{ ...defaultFilters, category: 'Food' }} onFilterChange={onFilterChange} />);

        // Find the close button inside the badge. It's an SVG or button.
        // Assuming implementation has accessible button or we find by role if possible, but structure is div>span>button
        // Let's find the button near the text
        const chip = screen.getByText('Food').parentElement; // Badge span
        const closeBtn = chip.querySelector('button');

        fireEvent.click(closeBtn);
        expect(onFilterChange).toHaveBeenCalledWith(expect.objectContaining({ category: '' }));
    });

    it('clears all filters when Clear All clicked', () => {
        render(<FilterBar filters={{ ...defaultFilters, category: 'Food', isTaxable: true }} onFilterChange={onFilterChange} />);

        const clearAllBtn = screen.getByText('Сбросить все');
        fireEvent.click(clearAllBtn);

        expect(onFilterChange).toHaveBeenCalledWith(expect.objectContaining({ category: '', isTaxable: false }));
    });
});
