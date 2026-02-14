import { describe, it, expect } from 'vitest';
import {
    calculateMonthlyObligations,
    TAX_CONSTANTS_2026,
    TaxCalculationResult,
} from '../taxCalculator';

const C = TAX_CONSTANTS_2026;

describe('taxCalculator', () => {
    // ───── Стандартный расчёт ──────────────────────────────────────────────────

    it('рассчитывает стандартный доход 500 000 ₸ при ставке 3% (упрощёнка)', () => {
        const result = calculateMonthlyObligations({
            monthlyIncome: 500_000,
            customTaxRate: 3,
        });

        // ОПВ = 500 000 × 10% = 50 000
        expect(result.monthly.opv.amount).toBe(50_000);

        // СО = clamp(500 000 − 50 000, 85 000, 595 000) × 3.5% = 450 000 × 3.5% = 15 750
        expect(result.monthly.so.amount).toBe(15_750);

        // ВОСМС = 1.4 × 85 000 × 5% = 119 000 × 5% = 5 950
        expect(result.monthly.vosms.amount).toBe(5_950);

        // ОПВР = 500 000 × 1.5% = 7 500
        expect(result.monthly.opvr.amount).toBe(7_500);

        // totalMonthly = 50 000 + 15 750 + 5 950 + 7 500 = 79 200
        expect(result.monthly.totalMonthly).toBe(79_200);

        // Налог (упрощёнка): 500 000 × 3% = 15 000
        expect(result.tax.totalTax).toBe(15_000);
        expect(result.tax.isSimplified).toBe(true);

        // ИПН = 50% от 15 000 = 7 500
        expect(result.tax.ipn.amount).toBe(7_500);

        // СоцНалог = 50% от 15 000 − СО(15 750) = 7 500 − 15 750 → max(0) = 0
        expect(result.tax.socialTax.amount).toBe(0);

        // Net income = 500 000 − (79 200 + 15 000) = 405 800
        expect(result.summary.netIncome).toBe(405_800);
    });

    // ───── Нулевой доход ──────────────────────────────────────────────────────

    it('при доходе 0 показывает фиксированные платежи', () => {
        const result = calculateMonthlyObligations({
            monthlyIncome: 0,
            customTaxRate: 3,
        });

        // ОПВ от минимума: 1 × МЗП × 10% = 85 000 × 10% = 8 500
        expect(result.monthly.opv.amount).toBe(8_500);

        // СО: (0 − 8 500) → max(0) → база clamp(0, 85 000, 595 000) → 85 000 × 3.5% = 2 975
        expect(result.monthly.so.amount).toBe(2_975);

        // ВОСМС — фиксированно 5 950
        expect(result.monthly.vosms.amount).toBe(5_950);

        // ОПВР = 0 × 1.5% = 0
        expect(result.monthly.opvr.amount).toBe(0);

        // Налог = 0
        expect(result.tax.totalTax).toBe(0);

        // Net income отрицательный (фикс. платежи при нулевом доходе)
        expect(result.summary.netIncome).toBeLessThan(0);
        expect(result.summary.grossIncome).toBe(0);
    });

    // ───── Пенсионер ──────────────────────────────────────────────────────────

    it('пенсионер: ОПВ = 0, остальное без изменений', () => {
        const result = calculateMonthlyObligations({
            monthlyIncome: 300_000,
            customTaxRate: 3,
            isPensioner: true,
        });

        expect(result.monthly.opv.amount).toBe(0);

        // СО при isPensioner: (income − 0) = 300 000, clamp → 300 000 × 3.5% = 10 500
        expect(result.monthly.so.amount).toBe(10_500);

        // ВОСМС — фиксированно
        expect(result.monthly.vosms.amount).toBe(5_950);

        // ОПВР = 300 000 × 1.5% = 4 500
        expect(result.monthly.opvr.amount).toBe(4_500);
    });

    // ───── Инвалид ────────────────────────────────────────────────────────────

    it('инвалид: ОПВ = 0, СО = 0, остальное без изменений', () => {
        const result = calculateMonthlyObligations({
            monthlyIncome: 300_000,
            customTaxRate: 3,
            isDisabled: true,
        });

        expect(result.monthly.opv.amount).toBe(0);
        expect(result.monthly.so.amount).toBe(0);

        // ВОСМС — фиксированно
        expect(result.monthly.vosms.amount).toBe(5_950);

        // ОПВР = 300 000 × 1.5% = 4 500
        expect(result.monthly.opvr.amount).toBe(4_500);
    });

    // ───── Высокий доход (потолок ОПВ) ────────────────────────────────────────

    it('при доходе > 50 МЗП ОПВ ограничен потолком', () => {
        const highIncome = 5_000_000; // 5 млн > 50 × 85 000 (4 250 000)
        const result = calculateMonthlyObligations({
            monthlyIncome: highIncome,
            customTaxRate: 3,
        });

        // ОПВ = 50 × 85 000 × 10% = 425 000
        const maxOPV = C.OPV_MAX_MZP * C.MZP * C.OPV_RATE;
        expect(result.monthly.opv.amount).toBe(maxOPV);

        // СО: (5 000 000 − 425 000) = 4 575 000, clamp(_, 85 000, 595 000) = 595 000 × 3.5% = 20 825
        expect(result.monthly.so.amount).toBe(20_825);
    });

    // ───── Розничный налог (4%) ───────────────────────────────────────────────

    it('ставка 4% (розничный): налог без деления на ИПН/СоцНалог', () => {
        const result = calculateMonthlyObligations({
            monthlyIncome: 1_000_000,
            customTaxRate: 4,
        });

        expect(result.tax.isSimplified).toBe(false);
        expect(result.tax.totalTax).toBe(40_000);

        // Весь налог = ИПН
        expect(result.tax.ipn.amount).toBe(40_000);

        // СоцНалог не начисляется
        expect(result.tax.socialTax.amount).toBe(0);
    });

    // ───── Упрощёнка при ставке 3% ────────────────────────────────────────────

    it('ставка 3% (упрощёнка): налог делится на ИПН и СоцНалог', () => {
        const result = calculateMonthlyObligations({
            monthlyIncome: 1_000_000,
            customTaxRate: 3,
        });

        // Общий налог = 1 000 000 × 3% = 30 000
        expect(result.tax.totalTax).toBe(30_000);
        expect(result.tax.isSimplified).toBe(true);

        // ИПН = 50% от 30 000 = 15 000
        expect(result.tax.ipn.amount).toBe(15_000);

        // ОПВ = 100 000, СО = clamp(1 000 000 − 100 000, 85 000, 595 000) × 3.5%
        // = 595 000 × 3.5% = 20 825
        // СоцНалог = max(15 000 − 20 825, 0) = 0
        expect(result.tax.socialTax.amount).toBe(0);
    });

    // ───── Упрощёнка при малом доходе (СоцНалог > 0) ──────────────────────────

    it('упрощёнка: СоцНалог > 0 когда 50% налога > СО', () => {
        // Нужен доход, при котором 50% налога > СО
        // Допустим доход = 200 000, ставка 3%
        // ОПВ = 200 000 × 10% = 20 000
        // СО = clamp(200 000 − 20 000, 85 000, 595 000) × 3.5% = 180 000 × 3.5% = 6 300
        // Налог = 200 000 × 3% = 6 000
        // ИПН = 3 000
        // СоцНалог = max(3 000 − 6 300, 0) = 0 ← всё ещё 0

        // Для СоцНалог > 0 нужен очень маленький СО.
        // Доход = 100 000, ставка 3%
        // ОПВ = 100 000 × 10% = 10 000
        // СО = clamp(100 000 − 10 000, 85 000, 595 000) × 3.5% = 90 000 × 3.5% = 3 150
        // Налог = 100 000 × 3% = 3 000
        // ИПН = 1 500
        // СоцНалог = max(1 500 − 3 150, 0) = 0

        // Чтобы СоцНалог > 0 при упрощёнке, нужен isPensioner (ОПВ=0, СО мал)
        // или disabled (СО=0)
        const result = calculateMonthlyObligations({
            monthlyIncome: 500_000,
            customTaxRate: 3,
            isDisabled: true, // СО = 0
        });

        // Налог = 500 000 × 3% = 15 000
        // ИПН = 7 500
        // СоцНалог = max(7 500 − 0, 0) = 7 500
        expect(result.tax.socialTax.amount).toBe(7_500);
        expect(result.tax.ipn.amount).toBe(7_500);
    });

    // ───── Структура ответа ───────────────────────────────────────────────────

    it('возвращает корректную структуру JSON-ответа', () => {
        const result = calculateMonthlyObligations({
            monthlyIncome: 100_000,
            customTaxRate: 3,
        });

        // Проверяем наличие всех ключей
        expect(result).toHaveProperty('input');
        expect(result).toHaveProperty('monthly');
        expect(result).toHaveProperty('tax');
        expect(result).toHaveProperty('summary');
        expect(result).toHaveProperty('tooltips');

        // Проверяем monthly
        expect(result.monthly).toHaveProperty('opv');
        expect(result.monthly).toHaveProperty('so');
        expect(result.monthly).toHaveProperty('vosms');
        expect(result.monthly).toHaveProperty('opvr');
        expect(result.monthly).toHaveProperty('totalMonthly');

        // Проверяем PaymentLine
        expect(result.monthly.opv).toHaveProperty('amount');
        expect(result.monthly.opv).toHaveProperty('label');
        expect(result.monthly.opv).toHaveProperty('tooltip');

        // Проверяем tooltips
        expect(result.tooltips).toHaveLength(4);
        expect(result.tooltips[0]).toContain('ОПВ');
        expect(result.tooltips[2]).toContain('ВОСМС');
    });

    // ───── Константы 2026 ─────────────────────────────────────────────────────

    it('использует правильные константы 2026 года', () => {
        expect(C.MZP).toBe(85_000);
        expect(C.MRP).toBe(4_325);
        expect(C.OPV_RATE).toBe(0.10);
        expect(C.SO_RATE).toBe(0.035);
        expect(C.VOSMS_RATE).toBe(0.05);
        expect(C.OPVR_RATE).toBe(0.015);
    });

    // ───── ВОСМС фиксирован ──────────────────────────────────────────────────

    it('ВОСМС одинаков при любом доходе', () => {
        const result1 = calculateMonthlyObligations({ monthlyIncome: 0, customTaxRate: 3 });
        const result2 = calculateMonthlyObligations({ monthlyIncome: 5_000_000, customTaxRate: 3 });

        expect(result1.monthly.vosms.amount).toBe(result2.monthly.vosms.amount);
        expect(result1.monthly.vosms.amount).toBe(5_950);
    });
});
