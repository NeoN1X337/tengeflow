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

        // ОПВ = max(500 000, 85 000) × 10% = 500 000 × 10% = 50 000
        expect(result.monthly.opv.amount).toBe(50_000);

        // СО = min(max(500 000, 85 000), 7*85 000) × 5% = min(500 000, 595 000) × 5% = 500 000 × 5% = 25 000
        expect(result.monthly.so.amount).toBe(25_000);

        // ВОСМС = 1.4 × 85 000 × 5% = 119 000 × 5% = 5 950
        expect(result.monthly.vosms.amount).toBe(5_950);

        // ОПВР = 1 МЗП × 3.5% = 85 000 × 3.5% = 2 975 (bornAfter1975 default = true)
        expect(result.monthly.opvr.amount).toBe(2_975);

        // totalMonthly = 50 000 + 25 000 + 5 950 + 2 975 = 83 925
        expect(result.monthly.totalMonthly).toBe(83_925);

        // Налог (упрощёнка): 500 000 × 3% = 15 000
        expect(result.tax.totalTax).toBe(15_000);
        expect(result.tax.isSimplified).toBe(true);

        // ИПН = 50% от 15 000 = 7 500
        expect(result.tax.ipn.amount).toBe(7_500);

        // СоцНалог = 50% от 15 000 − СО(25 000) = max(7 500 − 25 000, 0) = 0
        expect(result.tax.socialTax.amount).toBe(0);

        // Net income = 500 000 − (83 925 + 15 000) = 401 075
        expect(result.summary.netIncome).toBe(401_075);
    });

    // ───── Низкий доход (ниже МЗП) — пример из ТЗ: 50 000 ₸ ─────────────────

    it('при доходе 50 000 ₸ (ниже МЗП) корректно рассчитывает обязательства', () => {
        const result = calculateMonthlyObligations({
            monthlyIncome: 50_000,
            customTaxRate: 4,
        });

        // ОПВ = max(50 000, 85 000) × 10% = 85 000 × 10% = 8 500 (мин. 1 МЗП)
        expect(result.monthly.opv.amount).toBe(8_500);

        // ОПВР = 85 000 × 3.5% = 2 975 (фиксированная от МЗП)
        expect(result.monthly.opvr.amount).toBe(2_975);

        // ВОСМС = 5 950 (фиксированная)
        expect(result.monthly.vosms.amount).toBe(5_950);

        // СО = min(max(50 000, 85 000), 595 000) × 5% = 85 000 × 5% = 4 250
        expect(result.monthly.so.amount).toBe(4_250);

        // Итого ежемесячных = 8 500 + 4 250 + 5 950 + 2 975 = 21 675
        expect(result.monthly.totalMonthly).toBe(21_675);

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

        // СО = min(max(0→85000, 85000), 595000) × 5% = 85 000 × 5% = 4 250
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

        // СО = min(max(300 000, 85 000), 595 000) × 5% = 300 000 × 5% = 15 000
        expect(result.monthly.so.amount).toBe(15_000);

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

        // СО = min(5 000 000, 7*85 000) × 5% = 595 000 × 5% = 29 750
        expect(result.monthly.so.amount).toBe(29_750);
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

        // СО = min(1 000 000, 595 000) × 5% = 595 000 × 5% = 29 750
        // СоцНалог = max(15 000 − 29 750, 0) = 0
        expect(result.tax.socialTax.amount).toBe(0);
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

        // Проверяем input новые поля
        expect(result.input).toHaveProperty('bornAfter1975');
        expect(result.input).toHaveProperty('hasEmployees');
        expect(result.input).toHaveProperty('totalEmployeeSalary');

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

        // Проверяем summary новые поля
        expect(result.summary).toHaveProperty('taxReserve');
        expect(result.summary).toHaveProperty('totalToPay');

        // Без сотрудников — employeeObligations undefined
        expect(result.employeeObligations).toBeUndefined();
    });

    // ───── Константы 2026 ─────────────────────────────────────────────────────

    it('использует правильные константы 2026 года', () => {
        expect(C.MZP).toBe(85_000);
        expect(C.MRP).toBe(4_325);
        expect(C.OPV_RATE).toBe(0.10);
        expect(C.SO_RATE).toBe(0.05);
        expect(C.VOSMS_RATE).toBe(0.05);
        expect(C.OPVR_RATE).toBe(0.035);
        expect(C.SO_MAX_MZP).toBe(7);
        expect(C.EMPLOYEE_IPN_RATE).toBe(0.10);
        expect(C.EMPLOYEE_OSMS_RATE).toBe(0.03);
        expect(C.EMPLOYEE_VOSMS_RATE).toBe(0.02);
    });

    // ───── ВОСМС фиксирован ──────────────────────────────────────────────────

    it('ВОСМС одинаков при любом доходе', () => {
        const result1 = calculateMonthlyObligations({ monthlyIncome: 0, customTaxRate: 3 });
        const result2 = calculateMonthlyObligations({ monthlyIncome: 5_000_000, customTaxRate: 3 });

        expect(result1.monthly.vosms.amount).toBe(result2.monthly.vosms.amount);
        expect(result1.monthly.vosms.amount).toBe(5_950);
    });

    // ───── ОПВР фиксирован ────────────────────────────────────────────────────

    it('ОПВР фиксирован при любом доходе (bornAfter1975 = true)', () => {
        const result1 = calculateMonthlyObligations({ monthlyIncome: 50_000, customTaxRate: 3 });
        const result2 = calculateMonthlyObligations({ monthlyIncome: 5_000_000, customTaxRate: 3 });

        expect(result1.monthly.opvr.amount).toBe(result2.monthly.opvr.amount);
        expect(result1.monthly.opvr.amount).toBe(2_975);
    });

    // ───── ОПВР = 0 если bornAfter1975 = false ──────────────────────────────

    it('ОПВР = 0 если bornAfter1975 = false', () => {
        const result = calculateMonthlyObligations({
            monthlyIncome: 500_000,
            customTaxRate: 4,
            bornAfter1975: false,
        });

        expect(result.monthly.opvr.amount).toBe(0);
        expect(result.input.bornAfter1975).toBe(false);
    });

    // ───── ОПВР = 2975 если bornAfter1975 = true (по умолчанию) ─────────────

    it('ОПВР = 2975 если bornAfter1975 = true (по умолчанию)', () => {
        const result = calculateMonthlyObligations({
            monthlyIncome: 500_000,
            customTaxRate: 4,
        });

        expect(result.monthly.opvr.amount).toBe(2_975);
        expect(result.input.bornAfter1975).toBe(true);
    });

    // ───── СО с учётом min/max ────────────────────────────────────────────────

    it('СО: база = max(доход, 1 МЗП), cap 7 МЗП', () => {
        // Доход ниже МЗП → база = 1 МЗП = 85 000
        const resultLow = calculateMonthlyObligations({ monthlyIncome: 30_000, customTaxRate: 3 });
        expect(resultLow.monthly.so.amount).toBe(4_250); // 85 000 × 5%

        // Доход = 300 000 → база = 300 000
        const resultMid = calculateMonthlyObligations({ monthlyIncome: 300_000, customTaxRate: 3 });
        expect(resultMid.monthly.so.amount).toBe(15_000); // 300 000 × 5%

        // Доход > 7 МЗП (595 000) → база = 595 000
        const resultHigh = calculateMonthlyObligations({ monthlyIncome: 1_000_000, customTaxRate: 3 });
        expect(resultHigh.monthly.so.amount).toBe(29_750); // 595 000 × 5%
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

    // ═══════════════════════════════════════════════════════════════════════════
    // ─── Тесты для обязательств за работников ─────────────────────────────────
    // ═══════════════════════════════════════════════════════════════════════════

    it('рассчитывает обязательства за работников при ФОТ = 500 000 ₸', () => {
        const result = calculateMonthlyObligations({
            monthlyIncome: 200_000,
            customTaxRate: 4,
            hasEmployees: true,
            totalEmployeeSalary: 500_000,
        });

        expect(result.employeeObligations).toBeDefined();
        const emp = result.employeeObligations!;

        // ИПН = 500 000 × 10% = 50 000
        expect(emp.ipn.amount).toBe(50_000);
        // ОПВ = 500 000 × 10% = 50 000
        expect(emp.opv.amount).toBe(50_000);
        // ОПВР = 500 000 × 3.5% = 17 500
        expect(emp.opvr.amount).toBe(17_500);
        // СО = 500 000 × 5% = 25 000
        expect(emp.so.amount).toBe(25_000);
        // ОСМС = 500 000 × 3% = 15 000
        expect(emp.osms.amount).toBe(15_000);
        // ВОСМС = 500 000 × 2% = 10 000
        expect(emp.vosms.amount).toBe(10_000);

        // Итого = 50 000 + 50 000 + 17 500 + 25 000 + 15 000 + 10 000 = 167 500
        expect(emp.totalEmployeeObligations).toBe(167_500);
        expect(emp.allPayments).toHaveLength(6);
    });

    it('без работников — employeeObligations = undefined', () => {
        const result = calculateMonthlyObligations({
            monthlyIncome: 200_000,
            customTaxRate: 4,
            hasEmployees: false,
            totalEmployeeSalary: 500_000,
        });

        expect(result.employeeObligations).toBeUndefined();
    });

    it('hasEmployees = true, но totalEmployeeSalary = 0 — employeeObligations = undefined', () => {
        const result = calculateMonthlyObligations({
            monthlyIncome: 200_000,
            customTaxRate: 4,
            hasEmployees: true,
            totalEmployeeSalary: 0,
        });

        expect(result.employeeObligations).toBeUndefined();
    });

    it('totalToPay = taxReserve + employeeTotal', () => {
        const result = calculateMonthlyObligations({
            monthlyIncome: 300_000,
            customTaxRate: 4,
            hasEmployees: true,
            totalEmployeeSalary: 500_000,
        });

        expect(result.summary.totalToPay).toBe(
            result.summary.taxReserve + result.employeeObligations!.totalEmployeeObligations
        );
    });

    it('totalToPay = taxReserve когда нет работников', () => {
        const result = calculateMonthlyObligations({
            monthlyIncome: 300_000,
            customTaxRate: 4,
        });

        expect(result.summary.totalToPay).toBe(result.summary.taxReserve);
    });
});
