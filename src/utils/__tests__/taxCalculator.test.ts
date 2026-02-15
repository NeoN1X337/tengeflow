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

        // СО = 1 МЗП × 5% = 85 000 × 5% = 4 250 (фиксированная)
        expect(result.monthly.so.amount).toBe(4_250);

        // ВОСМС = 1.4 × 85 000 × 5% = 119 000 × 5% = 5 950
        expect(result.monthly.vosms.amount).toBe(5_950);

        // ОПВР = 1 МЗП × 3.5% = 85 000 × 3.5% = 2 975 (фиксированная)
        expect(result.monthly.opvr.amount).toBe(2_975);

        // totalMonthly = 50 000 + 4 250 + 5 950 + 2 975 = 63 175
        expect(result.monthly.totalMonthly).toBe(63_175);

        // Налог (упрощёнка): 500 000 × 3% = 15 000
        expect(result.tax.totalTax).toBe(15_000);
        expect(result.tax.isSimplified).toBe(true);

        // ИПН = 50% от 15 000 = 7 500
        expect(result.tax.ipn.amount).toBe(7_500);

        // СоцНалог = 50% от 15 000 − СО(4 250) = 7 500 − 4 250 = 3 250
        expect(result.tax.socialTax.amount).toBe(3_250);

        // Net income = 500 000 − (63 175 + 15 000) = 421 825
        expect(result.summary.netIncome).toBe(421_825);
    });

    // ───── Низкий доход (ниже МЗП) — пример из ТЗ: 50 000 ₸ ─────────────────

    it('при доходе 50 000 ₸ (ниже МЗП) корректно рассчитывает 18 175 ₸', () => {
        const result = calculateMonthlyObligations({
            monthlyIncome: 50_000,
            customTaxRate: 4,
        });

        // ОПВ = 50 000 × 10% = 5 000 (от фактического дохода, не от МЗП)
        expect(result.monthly.opv.amount).toBe(5_000);

        // ОПВР = 85 000 × 3.5% = 2 975 (фиксированная от МЗП)
        expect(result.monthly.opvr.amount).toBe(2_975);

        // ВОСМС = 5 950 (фиксированная)
        expect(result.monthly.vosms.amount).toBe(5_950);

        // СО = 85 000 × 5% = 4 250 (фиксированная от МЗП)
        expect(result.monthly.so.amount).toBe(4_250);

        // Итого ежемесячных = 5 000 + 4 250 + 5 950 + 2 975 = 18 175
        expect(result.monthly.totalMonthly).toBe(18_175);

        // ИПН = 50 000 × 4% = 2 000
        expect(result.tax.ipn.amount).toBe(2_000);
    });

    // ───── Нулевой доход ──────────────────────────────────────────────────────

    it('при доходе 0 показывает фиксированные платежи', () => {
        const result = calculateMonthlyObligations({
            monthlyIncome: 0,
            customTaxRate: 3,
        });

        // ОПВ = 0 (при нулевом доходе = 0)
        expect(result.monthly.opv.amount).toBe(0);

        // СО = 4 250 (фиксированная от МЗП)
        expect(result.monthly.so.amount).toBe(4_250);

        // ВОСМС — фиксированно 5 950
        expect(result.monthly.vosms.amount).toBe(5_950);

        // ОПВР = 2 975 (фиксированная от МЗП)
        expect(result.monthly.opvr.amount).toBe(2_975);

        // Налог = 0
        expect(result.tax.totalTax).toBe(0);

        // totalMonthly = 0 + 4 250 + 5 950 + 2 975 = 13 175
        expect(result.monthly.totalMonthly).toBe(13_175);

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

        // СО = 4 250 (фиксированная, не зависит от ОПВ)
        expect(result.monthly.so.amount).toBe(4_250);

        // ВОСМС — фиксированно
        expect(result.monthly.vosms.amount).toBe(5_950);

        // ОПВР = 2 975 (фиксированная)
        expect(result.monthly.opvr.amount).toBe(2_975);
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

        // ОПВР = 2 975 (фиксированная)
        expect(result.monthly.opvr.amount).toBe(2_975);
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

        // СО = 4 250 (фиксированная от МЗП, не зависит от дохода)
        expect(result.monthly.so.amount).toBe(4_250);
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

        // СО (фиксированная) = 4 250
        // СоцНалог = max(15 000 − 4 250, 0) = 10 750
        expect(result.tax.socialTax.amount).toBe(10_750);
    });

    // ───── Упрощёнка: СоцНалог при инвалидности ──────────────────────────────

    it('упрощёнка: СоцНалог > 0 когда 50% налога > СО (isDisabled, СО=0)', () => {
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
        expect(result).toHaveProperty('allPayments');

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
        expect(result.monthly.opv).toHaveProperty('base');

        // Проверяем allPayments — массив из 5 элементов
        expect(result.allPayments).toHaveLength(5);

        // Проверяем tooltips
        expect(result.tooltips).toHaveLength(5);
        expect(result.tooltips[0]).toContain('ОПВ');
        expect(result.tooltips[2]).toContain('ВОСМС');

        // Проверяем taxReserve
        expect(result.summary).toHaveProperty('taxReserve');
    });

    // ───── Константы 2026 ─────────────────────────────────────────────────────

    it('использует правильные константы 2026 года', () => {
        expect(C.MZP).toBe(85_000);
        expect(C.MRP).toBe(4_325);
        expect(C.OPV_RATE).toBe(0.10);
        expect(C.SO_RATE).toBe(0.05);
        expect(C.VOSMS_RATE).toBe(0.05);
        expect(C.OPVR_RATE).toBe(0.035);
    });

    // ───── ВОСМС фиксирован ──────────────────────────────────────────────────

    it('ВОСМС одинаков при любом доходе', () => {
        const result1 = calculateMonthlyObligations({ monthlyIncome: 0, customTaxRate: 3 });
        const result2 = calculateMonthlyObligations({ monthlyIncome: 5_000_000, customTaxRate: 3 });

        expect(result1.monthly.vosms.amount).toBe(result2.monthly.vosms.amount);
        expect(result1.monthly.vosms.amount).toBe(5_950);
    });

    // ───── СО и ОПВР фиксированы ─────────────────────────────────────────────

    it('СО и ОПВР одинаковы при любом доходе', () => {
        const result1 = calculateMonthlyObligations({ monthlyIncome: 50_000, customTaxRate: 3 });
        const result2 = calculateMonthlyObligations({ monthlyIncome: 5_000_000, customTaxRate: 3 });

        // СО фиксированная
        expect(result1.monthly.so.amount).toBe(result2.monthly.so.amount);
        expect(result1.monthly.so.amount).toBe(4_250);

        // ОПВР фиксированная
        expect(result1.monthly.opvr.amount).toBe(result2.monthly.opvr.amount);
        expect(result1.monthly.opvr.amount).toBe(2_975);
    });

    // ───── taxReserve = сумма всех 5 платежей ────────────────────────────────

    it('taxReserve равен сумме всех 5 платежей (ОПВ+ОПВР+ВОСМС+СО+ИПН)', () => {
        const result = calculateMonthlyObligations({
            monthlyIncome: 300_000,
            customTaxRate: 4,
        });

        const expected = result.monthly.opv.amount +
            result.monthly.opvr.amount +
            result.monthly.vosms.amount +
            result.monthly.so.amount +
            result.tax.ipn.amount;

        expect(result.summary.taxReserve).toBe(expected);
    });
});
