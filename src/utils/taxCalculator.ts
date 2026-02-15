/**
 * Модуль «Умный расчет налогов» для ИП в РК — 2026 год.
 *
 * Рассчитывает все обязательные ежемесячные платежи ИП «за себя»:
 * ОПВ, СО, ВОСМС, ОПВР и основной налог (ИПН).
 *
 * Ставки актуализированы согласно ТЗ 2026 года.
 */

// ─── Константы 2026 ───────────────────────────────────────────────────────────

export const TAX_CONSTANTS_2026 = {
    /** Минимальная заработная плата */
    MZP: 85_000,
    /** Месячный расчётный показатель */
    MRP: 4_325,
    /** Ставка ОПВ — 10% */
    OPV_RATE: 0.10,
    /** Ставка СО — 5% (от 1 МЗП, фиксированная база) */
    SO_RATE: 0.05,
    /** Ставка ВОСМС — 5% от базы */
    VOSMS_RATE: 0.05,
    /** Множитель базы ВОСМС: 1.4 × МЗП */
    VOSMS_BASE_MULTIPLIER: 1.4,
    /** Ставка ОПВР — 3.5% (от 1 МЗП, фиксированная база) */
    OPVR_RATE: 0.035,
    /** Максимальная база для ОПВ: 50 МЗП */
    OPV_MAX_MZP: 50,
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
    /** Описание базы расчёта */
    base: string;
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
        /** Общий налоговый резерв (все 5 платежей: ОПВ + ОПВР + ВОСМС + СО + ИПН) */
        taxReserve: number;
    };

    /** Массив всех 5 платежей для отображения в UI */
    allPayments: PaymentLine[];

    /** Подсказки для UI (готовые строки) */
    tooltips: string[];
}

// ─── Вспомогательные функции ──────────────────────────────────────────────────

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
 * Ставки 2026:
 * - ОПВ: 10% от фактического дохода (макс. 50 МЗП)
 * - ОПВР: 3.5% от 1 МЗП = 2 975 ₸ (фиксированная)
 * - ВОСМС: 5% от 1.4 МЗП = 5 950 ₸ (фиксированная)
 * - СО: 5% от 1 МЗП = 4 250 ₸ (фиксированная)
 * - ИПН: Доход × Пользовательский_%
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
    // 10% от фактического дохода. Максимум = 50 МЗП × 10%.
    // При нулевом доходе = 0.
    // Пенсионеры и инвалиды освобождены.

    let opvAmount = 0;
    if (!isPensioner && !isDisabled && income > 0) {
        const opvBase = Math.min(income, C.OPV_MAX_MZP * C.MZP);
        opvAmount = round2(opvBase * C.OPV_RATE);
    }

    // ───────────────── СО (Социальные отчисления) ───────────────────────────────
    // 5% от 1 МЗП = 4 250 ₸ (фиксированная база, не зависит от дохода).
    // Инвалиды освобождены.

    let soAmount = 0;
    if (!isDisabled) {
        soAmount = round2(C.MZP * C.SO_RATE);
    }

    // ───────────────── ВОСМС (Взносы на мед. страхование) ──────────────────────
    // Фиксированная сумма: 5% от 1.4 × МЗП = 5 950 ₸. Не зависит от дохода.

    const vosmsBase = C.VOSMS_BASE_MULTIPLIER * C.MZP;
    const vosmsAmount = round2(vosmsBase * C.VOSMS_RATE);

    // ───────────────── ОПВР (Обязательные профессиональные пенсионные взносы) ───
    // 3.5% от 1 МЗП = 2 975 ₸ (фиксированная база, не зависит от дохода).

    const opvrAmount = round2(C.MZP * C.OPVR_RATE);

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
    const taxReserve = round2(opvAmount + opvrAmount + vosmsAmount + soAmount + ipnAmount);
    const totalDeductions = round2(totalMonthly + totalTax);
    const netIncome = round2(grossIncome - totalDeductions);

    // ───────────────── Подсказки ───────────────────────────────────────────────

    const tooltips: string[] = [
        `ОПВ — это ваша будущая пенсия. 10% от дохода (макс. ${(C.OPV_MAX_MZP * C.MZP).toLocaleString('ru-KZ')} ₸).`,
        `СО — социальное страхование: больничные, декрет. ${(C.SO_RATE * 100)}% от 1 МЗП = ${soAmount.toLocaleString('ru-KZ')} ₸.`,
        `ВОСМС — медицинская страховка. Фиксированная сумма ${vosmsAmount.toLocaleString('ru-KZ')} ₸/мес.`,
        `ОПВР — профессиональные пенсионные взносы. ${(C.OPVR_RATE * 100)}% от 1 МЗП = ${opvrAmount.toLocaleString('ru-KZ')} ₸.`,
        `Итого на руки — это ваш реальный доход после всех обязательных платежей и налогов.`,
    ];

    // ───────────────── Массив всех платежей (для UI) ──────────────────────────

    const opvLine: PaymentLine = {
        amount: opvAmount,
        label: 'ОПВ (пенсионные)',
        tooltip: tooltips[0],
        base: income > 0 ? `${(C.OPV_RATE * 100)}% от дохода` : '—',
    };

    const opvrLine: PaymentLine = {
        amount: opvrAmount,
        label: 'ОПВР (проф. взносы)',
        tooltip: tooltips[3],
        base: `${(C.OPVR_RATE * 100)}% от 1 МЗП`,
    };

    const vosmsLine: PaymentLine = {
        amount: vosmsAmount,
        label: 'ВОСМС (мед. страховка)',
        tooltip: tooltips[2],
        base: `${(C.VOSMS_RATE * 100)}% от 1.4 МЗП`,
    };

    const soLine: PaymentLine = {
        amount: soAmount,
        label: 'СО (соц. отчисления)',
        tooltip: tooltips[1],
        base: `${(C.SO_RATE * 100)}% от 1 МЗП`,
    };

    const ipnLine: PaymentLine = {
        amount: ipnAmount,
        label: isSimplified ? 'ИПН (50% от налога)' : `ИПН (${customTaxRate}%)`,
        tooltip: isSimplified
            ? `При упрощённой декларации общий налог ${customTaxRate}% делится пополам: половина — ИПН.`
            : `Индивидуальный подоходный налог по ставке ${customTaxRate}%.`,
        base: isSimplified ? '50% от общего налога' : `${customTaxRate}% от дохода`,
    };

    const allPayments: PaymentLine[] = [opvLine, opvrLine, vosmsLine, soLine, ipnLine];

    // ───────────────── Результат ──────────────────────────────────────────────

    return {
        input: {
            monthlyIncome: income,
            customTaxRate,
            isPensioner,
            isDisabled,
        },

        monthly: {
            opv: opvLine,
            so: soLine,
            vosms: vosmsLine,
            opvr: opvrLine,
            totalMonthly,
        },

        tax: {
            totalTax,
            ipn: ipnLine,
            socialTax: {
                amount: socialTaxAmount,
                label: isSimplified ? 'Соц. налог (50% − СО)' : 'Соц. налог',
                tooltip: isSimplified
                    ? `Вторая половина налога — социальный налог, уменьшенный на сумму СО (${soAmount.toLocaleString('ru-KZ')} ₸).`
                    : `Социальный налог не начисляется при данном режиме налогообложения.`,
                base: isSimplified ? '50% налога − СО' : '—',
            },
            isSimplified,
        },

        summary: {
            grossIncome,
            totalDeductions,
            netIncome,
            taxReserve,
        },

        allPayments,
        tooltips,
    };
}
