import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate } from '../formatUtils';

describe('formatUtils', () => {
    describe('formatCurrency', () => {
        it('formats number with spaces and decimal places', () => {
            // Note: Use a non-breaking space ( ) or normal space depending on locale.
            // checking partial match to avoid issues with specific space characters (nbsp vs normal space)
            const result = formatCurrency(100000);
            expect(result).toMatch(/100\s?000,00/);
        });

        it('handles zero', () => {
            expect(formatCurrency(0)).toMatch(/0,00/);
        });
    });
});
