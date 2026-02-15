/**
 * Модуль «Умный расчет налогов» для ИП в РК — 2026 год.
 *
 * Рассчитывает все обязательные ежемесячные платежи ИП «за себя»
 * и (опционально) обязательства за наёмных сотрудников.
 *
 * Ставки актуализированы согласно ТЗ 2026 года.
 */

// ─── Константы 2026 ───────────────────────────────────────────────────────────

export const TAX_CONSTANTS_2026 = {
    /** Минимальная заработная плата */
    MZP: 85_000,
    /** Месячный расчётный показатель */
    MRP: 4_325,

    // ── За себя (ИП) ──────────────────────────────────────────────────────────
    /** Ставка ОПВ — 10% */
    OPV_RATE: 0.10,
    /** Ставка СО — 5% */
    SO_RATE: 0.05,
    /** Ставка ВОСМС — 5% от базы */
    VOSMS_RATE: 0.05,
    /** Множитель базы ВОСМС: 1.4 × МЗП */
    VOSMS_BASE_MULTIPLIER: 1.4,
    /** Ставка ОПВР — 3.5% (от 1 МЗП, фиксированная база) */
    OPVR_RATE: 0.035,
    /** Максимальная база для ОПВ: 50 МЗП */
    OPV_MAX_MZP: 50,
    /** Максимальная база для СО: 7 МЗП */
    SO_MAX_MZP: 7,

    // ── За работников ─────────────────────────────────────────────────────────
    /** ИПН за работников — 10% */
    EMPLOYEE_IPN_RATE: 0.10,
    /** ОПВ за работников — 10% */
    EMPLOYEE_OPV_RATE: 0.10,
    /** ОПВР за работников — 3.5% */
    EMPLOYEE_OPVR_RATE: 0.035,
    /** СО за работников — 5% */
    EMPLOYEE_SO_RATE: 0.05,
    /** ОСМС за работников — 3% */
    EMPLOYEE_OSMS_RATE: 0.03,
    /** ВОСМС за работников — 2% */
    EMPLOYEE_VOSMS_RATE: 0.02,
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
    /** Рождён после 01.01.1975 — для расчёта ОПВР «за себя» (default: true) */
    bornAfter1975?: boolean;
    /** Есть ли наёмные сотрудники */
    hasEmployees?: boolean;
    /** Общий фонд оплаты труда (зарплаты всех сотрудников) */
    totalEmployeeSalary?: number;
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

export interface EmployeeObligations {
    ipn: PaymentLine;
    opv: PaymentLine;
    opvr: PaymentLine;
    so: PaymentLine;
    osms: PaymentLine;
    vosms: PaymentLine;
    /** Итого обязательств за работников */
    totalEmployeeObligations: number;
    /** Массив всех платежей за работников (для UI) */
    allPayments: PaymentLine[];
}

export interface TaxCalculationResult {
    /** Входные параметры (для отладки / отображения) */
    input: {
        monthlyIncome: number;
        customTaxRate: number;
        isPensioner: boolean;
        isDisabled: boolean;
        bornAfter1975: boolean;
        hasEmployees: boolean;
        totalEmployeeSalary: number;
    };

    /** Группа «Обязательно каждый месяц» (за себя) */
    monthly: {
        opv: PaymentLine;
        so: PaymentLine;
        vosms: PaymentLine;
        opvr: PaymentLine;
        /** Итого ежемесячных обязательных платежей (за себя) */
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

    /** Обязательства за работников (если есть) */
    employeeObligations?: EmployeeObligations;

    /** Итоговая сводка */
    summary: {
        /** Валовый доход */
        grossIncome: number;
        /** Сумма всех вычетов (платежи + налог) */
        totalDeductions: number;
        /** «На руки» = доход − все вычеты */
        netIncome: number;
        /** Налоговый резерв (за себя): ОПВ + ОПВР + ВОСМС + СО + ИПН */
        taxReserve: number;
        /** Общая сумма «К уплате»: за себя + за работников */
        totalToPay: number;
    };

    /** Массив всех платежей за себя (для UI) */
    allPayments: PaymentLine[];

    /** Подсказки для UI (готовые строки) */
    tooltips: string[];
}

// ─── Вспомогательные функции ──────────────────────────────────────────────────

/** Округление до 2 знаков (тиын) */
function round2(value: number): number {
    return Math.round(value * 100) / 100;
}

// ─── Расчёт обязательств за работников ────────────────────────────────────────

function calculateEmployeeObligations(totalSalary: number): EmployeeObligations {
    const C = TAX_CONSTANTS_2026;
    const salary = Math.max(totalSalary, 0);

    const ipnAmount = round2(salary * C.EMPLOYEE_IPN_RATE);
    const opvAmount = round2(salary * C.EMPLOYEE_OPV_RATE);
    const opvrAmount = round2(salary * C.EMPLOYEE_OPVR_RATE);
    const soAmount = round2(salary * C.EMPLOYEE_SO_RATE);
    const osmsAmount = round2(salary * C.EMPLOYEE_OSMS_RATE);
    const vosmsAmount = round2(salary * C.EMPLOYEE_VOSMS_RATE);

    const ipnLine: PaymentLine = {
        amount: ipnAmount,
        label: 'ИПН за работников (10%)',
        tooltip: `Индивидуальный подоходный налог за работников: 10% от ФОТ.`,
        base: `10% от ${salary.toLocaleString('ru-KZ')} ₸`,
    };

    const opvLine: PaymentLine = {
        amount: opvAmount,
        label: 'ОПВ за работников (10%)',
        tooltip: `Обязательные пенсионные взносы за работников: 10% от ФОТ.`,
        base: `10% от ФОТ`,
    };

    const opvrLine: PaymentLine = {
        amount: opvrAmount,
        label: 'ОПВР за работников (3.5%)',
        tooltip: `Обязательные профессиональные пенсионные взносы за работников: 3.5% от ФОТ.`,
        base: `3.5% от ФОТ`,
    };

    const soLine: PaymentLine = {
        amount: soAmount,
        label: 'СО за работников (5%)',
        tooltip: `Социальные отчисления за работников: 5% от ФОТ.`,
        base: `5% от ФОТ`,
    };

    const osmsLine: PaymentLine = {
        amount: osmsAmount,
        label: 'ОСМС за работников (3%)',
        tooltip: `Обязательное социальное медицинское страхование за работников: 3% от ФОТ.`,
        base: `3% от ФОТ`,
    };

    const vosmsLine: PaymentLine = {
        amount: vosmsAmount,
        label: 'ВОСМС за работников (2%)',
        tooltip: `Взносы на обязательное социальное медицинское страхование за работников: 2% от ФОТ.`,
        base: `2% от ФОТ`,
    };

    const allPayments = [ipnLine, opvLine, opvrLine, soLine, osmsLine, vosmsLine];
    const totalEmployeeObligations = round2(
        ipnAmount + opvAmount + opvrAmount + soAmount + osmsAmount + vosmsAmount
    );

    return {
        ipn: ipnLine,
        opv: opvLine,
        opvr: opvrLine,
        so: soLine,
        osms: osmsLine,
        vosms: vosmsLine,
        totalEmployeeObligations,
        allPayments,
    };
}

// ─── Основная функция ─────────────────────────────────────────────────────────

/**
 * Рассчитывает все обязательные ежемесячные платежи ИП «за себя»
 * и (опционально) за наёмных работников.
 *
 * @param input — параметры расчёта
 * @returns структурированный результат для отрисовки в UI
 *
 * Ставки 2026 — за себя:
 * - ИПН: Доход × Пользовательский_%
 * - ОПВ: 10% от дохода (мин. 1 МЗП, макс. 50 МЗП)
 * - СО: 5% от дохода (мин. 1 МЗП, макс. 7 МЗП)
 * - ВОСМС: 5% от 1.4 МЗП = 5 950 ₸ (фиксированная)
 * - ОПВР: 3.5% от 1 МЗП = 2 975 ₸ (только если рождён после 01.01.1975)
 *
 * За работников (от ФОТ):
 * - ИПН 10%, ОПВ 10%, ОПВР 3.5%, СО 5%, ОСМС 3%, ВОСМС 2%
 */
export function calculateMonthlyObligations(
    input: TaxCalculationInput
): TaxCalculationResult {
    const {
        monthlyIncome,
        customTaxRate,
        isPensioner = false,
        isDisabled = false,
        bornAfter1975 = true,
        hasEmployees = false,
        totalEmployeeSalary = 0,
    } = input;

    const C = TAX_CONSTANTS_2026;
    const income = Math.max(monthlyIncome, 0); // Не допускаем отрицательный доход

    // ───────────────── ОПВ (Обязательные пенсионные взносы) ─────────────────────
    // 10% от дохода. Мин. база = 1 МЗП, макс. = 50 МЗП.
    // При нулевом доходе = 0.
    // Пенсионеры и инвалиды освобождены.

    let opvAmount = 0;
    if (!isPensioner && !isDisabled && income > 0) {
        const opvBase = Math.min(Math.max(income, C.MZP), C.OPV_MAX_MZP * C.MZP);
        opvAmount = round2(opvBase * C.OPV_RATE);
    }

    // ───────────────── СО (Социальные отчисления) ───────────────────────────────
    // 5% от дохода. Мин. база = 1 МЗП, макс. = 7 МЗП.
    // Инвалиды освобождены.

    let soAmount = 0;
    if (!isDisabled) {
        const soBase = Math.min(Math.max(income > 0 ? income : C.MZP, C.MZP), C.SO_MAX_MZP * C.MZP);
        soAmount = round2(soBase * C.SO_RATE);
    }

    // ───────────────── ВОСМС (Взносы на мед. страхование) ──────────────────────
    // Фиксированная сумма: 5% от 1.4 × МЗП = 5 950 ₸. Не зависит от дохода.

    const vosmsBase = C.VOSMS_BASE_MULTIPLIER * C.MZP;
    const vosmsAmount = round2(vosmsBase * C.VOSMS_RATE);

    // ───────────────── ОПВР (Обязательные профессиональные пенсионные взносы) ───
    // 3.5% от 1 МЗП = 2 975 ₸ (фиксированная база, не зависит от дохода).
    // Рассчитывается только если ИП рождён после 01.01.1975.

    const opvrAmount = bornAfter1975 ? round2(C.MZP * C.OPVR_RATE) : 0;

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

    // ───────────────── Обязательства за работников ─────────────────────────────

    const employeeObligations = (hasEmployees && totalEmployeeSalary > 0)
        ? calculateEmployeeObligations(totalEmployeeSalary)
        : undefined;

    // ───────────────── Сводка ─────────────────────────────────────────────────

    const grossIncome = income;
    const taxReserve = round2(opvAmount + opvrAmount + vosmsAmount + soAmount + ipnAmount);
    const employeeTotal = employeeObligations?.totalEmployeeObligations ?? 0;
    const totalToPay = round2(taxReserve + employeeTotal);
    const totalDeductions = round2(totalMonthly + totalTax);
    const netIncome = round2(grossIncome - totalDeductions);

    // ───────────────── Подсказки ───────────────────────────────────────────────

    const tooltips: string[] = [
        `ОПВ — это ваша будущая пенсия. 10% от дохода (мин. 1 МЗП, макс. ${(C.OPV_MAX_MZP * C.MZP).toLocaleString('ru-KZ')} ₸).`,
        `СО — социальное страхование: больничные, декрет. ${(C.SO_RATE * 100)}% от дохода (мин. 1 МЗП, макс. 7 МЗП).`,
        `ВОСМС — медицинская страховка. Фиксированная сумма ${vosmsAmount.toLocaleString('ru-KZ')} ₸/мес.`,
        bornAfter1975
            ? `ОПВР — профессиональные пенсионные взносы. ${(C.OPVR_RATE * 100)}% от 1 МЗП = ${opvrAmount.toLocaleString('ru-KZ')} ₸.`
            : `ОПВР — не рассчитывается (рождён до 01.01.1975).`,
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
        base: bornAfter1975 ? `${(C.OPVR_RATE * 100)}% от 1 МЗП` : 'Не применимо',
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
        base: `${(C.SO_RATE * 100)}% от дохода (мин. 1 МЗП, макс. 7 МЗП)`,
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
            bornAfter1975,
            hasEmployees,
            totalEmployeeSalary,
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

        employeeObligations,

        summary: {
            grossIncome,
            totalDeductions,
            netIncome,
            taxReserve,
            totalToPay,
        },

        allPayments,
        tooltips,
    };
}
