/**
 * Модуль «Умный расчет налогов» для ИП в РК — 2026 год.
 *
 * Рассчитывает все обязательные ежемесячные платежи ИП «за себя»:
 * ОПВ, СО, ВОСМС, ОПВР и основной налог (ИПН / СоцНалог).
 */

// ─── Константы 2026 ───────────────────────────────────────────────────────────

export const TAX_CONSTANTS_2026 = {
    /** Минимальная заработная плата */
    MZP: 85_000,
    /** Месячный расчётный показатель */
    MRP: 4_325,
    /** Ставка ОПВ — 10% */
    OPV_RATE: 0.10,
    /** Ставка СО — 3.5% */
    SO_RATE: 0.035,
    /** Ставка ВОСМС — 5% от базы */
    VOSMS_RATE: 0.05,
    /** Множитель базы ВОСМС: 1.4 × МЗП */
    VOSMS_BASE_MULTIPLIER: 1.4,
    /** Ставка ОПВР — 1.5% */
    OPVR_RATE: 0.015,
    /** Минимальная база для ОПВ: 1 МЗП */
    OPV_MIN_MZP: 1,
    /** Максимальная база для ОПВ: 50 МЗП */
    OPV_MAX_MZP: 50,
    /** Минимальная база для СО: 1 МЗП */
    SO_MIN_MZP: 1,
    /** Максимальная база для СО: 7 МЗП */
    SO_MAX_MZP: 7,
} as const;

// ─── Типы ─────────────────────────────────────────────────────────────────────

export interface TaxCalculationInput {
    /** Доход ИП за месяц (в тенге) */
    monthlyIncome: number;
    /** Динамическая ставка налога в %, настроенная пользователем (напр. 3, 4) */
    customTaxRate: number;
    /** Является ли ИП пенсионером (освобождение от ОПВ) */
    isPensioner?: boolean;
    /** Является ли ИП инвалидом (освобождение от ОПВ и СО) */
    isDisabled?: boolean;
}

export interface PaymentLine {
    /** Сумма платежа в тенге */
    amount: number;
    /** Краткое название для отображения */
    label: string;
    /** Подсказка для пользователя (человеческим языком) */
    tooltip: string;
}

export interface TaxCalculationResult {
    /** Входные параметры (для отладки / отображения) */
    input: {
        monthlyIncome: number;
        customTaxRate: number;
        isPensioner: boolean;
        isDisabled: boolean;
    };

    /** Группа «Обязательно каждый месяц» */
    monthly: {
        opv: PaymentLine;
        so: PaymentLine;
        vosms: PaymentLine;
        opvr: PaymentLine;
        /** Итого ежемесячных обязательных платежей */
        totalMonthly: number;
    };

    /** Группа «Налог по итогам периода» */
    tax: {
        /** Общий налог по ставке */
        totalTax: number;
        /** ИПН — индивидуальный подоходный налог */
        ipn: PaymentLine;
        /** Социальный налог (для упрощёнки: 50% налога − СО) */
        socialTax: PaymentLine;
        /** Является ли режим «упрощёнкой» (ставка ≤ 3%) */
        isSimplified: boolean;
    };

    /** Итоговая сводка */
    summary: {
        /** Валовый доход */
        grossIncome: number;
        /** Сумма всех вычетов (платежи + налог) */
        totalDeductions: number;
        /** «На руки» = доход − все вычеты */
        netIncome: number;
    };

    /** Подсказки для UI (готовые строки) */
    tooltips: string[];
}

// ─── Вспомогательные функции ──────────────────────────────────────────────────

/** Ограничивает значение в диапазоне [min, max] */
function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

/** Округление до 2 знаков (тиын) */
function round2(value: number): number {
    return Math.round(value * 100) / 100;
}

// ─── Основная функция ─────────────────────────────────────────────────────────

/**
 * Рассчитывает все обязательные ежемесячные платежи ИП «за себя».
 *
 * @param input — параметры расчёта
 * @returns структурированный результат для отрисовки в UI
 *
 * @example
 * ```ts
 * const result = calculateMonthlyObligations({
 *   monthlyIncome: 500_000,
 *   customTaxRate: 3,
 * });
 * console.log(result.summary.netIncome); // «На руки»
 * ```
 */
export function calculateMonthlyObligations(
    input: TaxCalculationInput
): TaxCalculationResult {
    const {
        monthlyIncome,
        customTaxRate,
        isPensioner = false,
        isDisabled = false,
    } = input;

    const C = TAX_CONSTANTS_2026;
    const income = Math.max(monthlyIncome, 0); // Не допускаем отрицательный доход

    // ───────────────── ОПВ (Обязательные пенсионные взносы) ─────────────────────
    // 10% от дохода, но база ограничена: не менее 1 МЗП, не более 50 МЗП.
    // Пенсионеры и инвалиды освобождены.

    let opvAmount = 0;
    if (!isPensioner && !isDisabled) {
        const opvBase = clamp(income, C.OPV_MIN_MZP * C.MZP, C.OPV_MAX_MZP * C.MZP);
        opvAmount = round2(opvBase * C.OPV_RATE);
    }

    // ───────────────── СО (Социальные отчисления) ───────────────────────────────
    // 3.5% от (Доход − ОПВ), база ограничена: не менее 1 МЗП, не более 7 МЗП.
    // Инвалиды освобождены.

    let soAmount = 0;
    if (!isDisabled) {
        const soObject = Math.max(income - opvAmount, 0);
        const soBase = clamp(soObject, C.SO_MIN_MZP * C.MZP, C.SO_MAX_MZP * C.MZP);
        soAmount = round2(soBase * C.SO_RATE);
    }

    // ───────────────── ВОСМС (Взносы на мед. страхование) ──────────────────────
    // Фиксированная сумма: 5% от 1.4 × МЗП. Не зависит от дохода.

    const vosmsBase = C.VOSMS_BASE_MULTIPLIER * C.MZP;
    const vosmsAmount = round2(vosmsBase * C.VOSMS_RATE);

    // ───────────────── ОПВР (Обязательные профессиональные пенсионные взносы) ───
    // 1.5% от дохода. При нулевом доходе = 0.

    const opvrAmount = round2(income * C.OPVR_RATE);

    // ───────────────── Итого ежемесячных платежей ──────────────────────────────

    const totalMonthly = round2(opvAmount + soAmount + vosmsAmount + opvrAmount);

    // ───────────────── Основной налог ──────────────────────────────────────────
    // Если customTaxRate ≤ 3% — считаем «упрощёнку» (910.00):
    //   - Общий налог = доход × ставка
    //   - ИПН = 50% от общего налога
    //   - СоцНалог = 50% от общего налога − СО (но не менее 0)
    // Иначе — простой расчёт: весь налог = доход × ставка (например, розничный 4%).

    const isSimplified = customTaxRate <= 3;
    const totalTax = round2(income * (customTaxRate / 100));

    let ipnAmount: number;
    let socialTaxAmount: number;

    if (isSimplified) {
        ipnAmount = round2(totalTax * 0.5);
        socialTaxAmount = round2(Math.max(totalTax * 0.5 - soAmount, 0));
    } else {
        // Для розничного налога и прочих — весь налог считается единым
        ipnAmount = totalTax;
        socialTaxAmount = 0;
    }

    // ───────────────── Сводка ─────────────────────────────────────────────────

    const grossIncome = income;
    const totalDeductions = round2(totalMonthly + totalTax);
    const netIncome = round2(grossIncome - totalDeductions);

    // ───────────────── Подсказки ───────────────────────────────────────────────

    const tooltips: string[] = [
        `ОПВ — это ваша будущая пенсия. 10% от дохода, минимум ${C.MZP.toLocaleString('ru-KZ')} ₸ (1 МЗП) даже при нулевом доходе.`,
        `СО — социальное страхование: больничные, декрет, потеря работы. 3.5% от (доход − ОПВ).`,
        `ВОСМС — медицинская страховка. Фиксированная сумма ${vosmsAmount.toLocaleString('ru-KZ')} ₸/мес, не зависит от дохода.`,
        `Итого на руки — это ваш реальный доход после всех обязательных платежей и налогов.`,
    ];

    // ───────────────── Результат ──────────────────────────────────────────────

    return {
        input: {
            monthlyIncome: income,
            customTaxRate,
            isPensioner,
            isDisabled,
        },

        monthly: {
            opv: {
                amount: opvAmount,
                label: 'ОПВ (пенсионные)',
                tooltip: tooltips[0],
            },
            so: {
                amount: soAmount,
                label: 'СО (соц. отчисления)',
                tooltip: tooltips[1],
            },
            vosms: {
                amount: vosmsAmount,
                label: 'ВОСМС (мед. страховка)',
                tooltip: tooltips[2],
            },
            opvr: {
                amount: opvrAmount,
                label: 'ОПВР (проф. взносы)',
                tooltip: `ОПВР — обязательные профессиональные пенсионные взносы работодателя за себя. 1.5% от дохода.`,
            },
            totalMonthly,
        },

        tax: {
            totalTax,
            ipn: {
                amount: ipnAmount,
                label: isSimplified ? 'ИПН (50% от налога)' : `ИПН (${customTaxRate}%)`,
                tooltip: isSimplified
                    ? `При упрощённой декларации общий налог ${customTaxRate}% делится пополам: половина — ИПН.`
                    : `Индивидуальный подоходный налог по ставке ${customTaxRate}%.`,
            },
            socialTax: {
                amount: socialTaxAmount,
                label: isSimplified ? 'Соц. налог (50% − СО)' : 'Соц. налог',
                tooltip: isSimplified
                    ? `Вторая половина налога — социальный налог, уменьшенный на сумму СО (${soAmount.toLocaleString('ru-KZ')} ₸).`
                    : `Социальный налог не начисляется при данном режиме налогообложения.`,
            },
            isSimplified,
        },

        summary: {
            grossIncome,
            totalDeductions,
            netIncome,
        },

        tooltips,
    };
}
