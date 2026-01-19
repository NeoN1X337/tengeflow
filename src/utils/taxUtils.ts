/**
 * Transaction interface matching the shape used in the app
 */
export interface Transaction {
    id?: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    date: Date | string | number; // Handling different date formats as seen in code
    isTaxable?: boolean;
    description?: string;
    createdAt?: any;
}

export interface PeriodStats {
    income: number;
    tax: number;
    status: string;
    containerClass?: string;
    deadlines?: {
        submission: string;
        payment: string;
        label: string;
        status?: string;
        ui?: any;
    };
}

export interface TaxStats {
    q1: PeriodStats;
    q2: PeriodStats;
    q3: PeriodStats;
    q4: PeriodStats;
    h1: PeriodStats;
    h2: PeriodStats;
    year: PeriodStats;
}

/**
 * Calculates tax statistics for a specific year.
 * @param {Transaction[]} transactions - List of transactions
 * @param {number} year - The year to calculate for (default 2026)
 * @param {number} taxRate - Tax rate in percent (e.g., 4), default 4
 * @returns {TaxStats} Tax stats for Q1-Q4, H1-H2, and Year
 */
export function getTaxStats(transactions: Transaction[], year: number = 2026, taxRate: number = 4): TaxStats {
    const stats: TaxStats = {
        q1: { income: 0, tax: 0, status: 'Накопление' },
        q2: { income: 0, tax: 0, status: 'Ожидание' },
        q3: { income: 0, tax: 0, status: 'Ожидание' },
        q4: { income: 0, tax: 0, status: 'Ожидание' },
        h1: { income: 0, tax: 0, status: 'В процессе' },
        h2: { income: 0, tax: 0, status: 'Ожидание' },
        year: { income: 0, tax: 0, status: 'Всего' }
    };

    const rateMultiplier = taxRate / 100;

    // Filter for taxable income in the target year
    const taxableTxns = (transactions || []).filter(t => {
        if (!t.date) return false;
        const d = new Date(t.date);
        return t.type === 'income' &&
            t.isTaxable === true &&
            d.getFullYear() === year;
    });

    taxableTxns.forEach(t => {
        const amount = Number(t.amount); // Ensure number
        const tax = amount * rateMultiplier; // Dynamic tax rate
        const date = new Date(t.date);
        const month = date.getMonth(); // 0-11

        // Update Year
        stats.year.income += amount;
        stats.year.tax += tax;

        // Update Quarters
        if (month >= 0 && month <= 2) { // Jan-Mar
            stats.q1.income += amount;
            stats.q1.tax += tax;
        } else if (month >= 3 && month <= 5) { // Apr-Jun
            stats.q2.income += amount;
            stats.q2.tax += tax;
        } else if (month >= 6 && month <= 8) { // Jul-Sep
            stats.q3.income += amount;
            stats.q3.tax += tax;
        } else if (month >= 9 && month <= 11) { // Oct-Dec
            stats.q4.income += amount;
            stats.q4.tax += tax;
        }

        // Update Half-Years
        if (month <= 5) { // Jan-Jun
            stats.h1.income += amount;
            stats.h1.tax += tax;
        } else { // Jul-Dec
            stats.h2.income += amount;
            stats.h2.tax += tax;
        }
    });

    // Determine status labels (simplified logic based on current date vs period)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const setStatus = (periodKey: keyof TaxStats, endMonth: number) => {
        // This function was defined but not used in the original JS properly in loop or it was just helper scope
        // Re-implementing correctly or using logic from original
    };

    // Original JS logic for statuses seems custom/hardcoded for 2026 in some parts or conditional.
    // Porting strictly:

    if (year === 2026) {
        stats.q1.status = 'Текущий квартал';
        stats.h1.status = 'В процессе накопления';
    }

    // Optional: Round to 2 decimals for precision (standard currency)
    (Object.keys(stats) as Array<keyof TaxStats>).forEach(key => {
        // Format to 2 decimals to avoid long floats like 4.020000001
        stats[key].income = Number(stats[key].income.toFixed(2));
        stats[key].tax = Number(stats[key].tax.toFixed(2));
    });

    // Deadline Logic
    const formatDeadline = (day: number, month: number, y: number) => {
        const d = String(day).padStart(2, '0');
        const m = String(month).padStart(2, '0');
        return `${d}.${m}.${y}`;
    };

    // H1 (Jan-Jun)
    stats.h1.deadlines = {
        submission: formatDeadline(15, 8, year),
        payment: formatDeadline(25, 8, year),
        label: `Сдача до ${formatDeadline(15, 8, year)}, Оплата до ${formatDeadline(25, 8, year)}`
    };

    // H2 (Jul-Dec)
    stats.h2.deadlines = {
        submission: formatDeadline(15, 2, year + 1),
        payment: formatDeadline(25, 2, year + 1),
        label: `Сдача до ${formatDeadline(15, 2, year + 1)}, Оплата до ${formatDeadline(25, 2, year + 1)}`
    };

    // Check urgency
    const getDeadlineStatus = (deadlineDateStr: string) => {
        const [d, m, y] = deadlineDateStr.split('.').map(Number);
        const deadline = new Date(y, m - 1, d, 23, 59, 59);
        const now = new Date();

        const diffTime = deadline.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return { color: 'text-red-700 font-bold', icon: '🚨', isUrgent: true };
        } else if (diffDays <= 7) {
            return { color: 'text-red-600 font-bold', icon: '🚨', isUrgent: true };
        } else if (diffDays <= 30) {
            return { color: 'text-orange-600 font-medium', icon: '⏳', isUrgent: false };
        } else {
            return { color: 'text-gray-500', icon: '📅', isUrgent: false };
        }
    };

    const h1SubmissionStatus = getDeadlineStatus(stats.h1.deadlines.submission);
    const h1PaymentStatus = getDeadlineStatus(stats.h1.deadlines.payment);

    if (stats.h1.deadlines) {
        stats.h1.deadlines.status = h1SubmissionStatus.isUrgent || h1PaymentStatus.isUrgent ? 'critical' : 'normal';
        stats.h1.deadlines.ui = {
            submission: h1SubmissionStatus,
            payment: h1PaymentStatus
        };
    }

    const h2SubmissionStatus = getDeadlineStatus(stats.h2.deadlines.submission);
    const h2PaymentStatus = getDeadlineStatus(stats.h2.deadlines.payment);

    if (stats.h2.deadlines) {
        stats.h2.deadlines.ui = {
            submission: h2SubmissionStatus,
            payment: h2PaymentStatus
        };
    }

    // Helper to determine border class based on priority
    const getContainerStyle = (deadlineStatus: any, startMonth: number, endMonth: number) => {
        // 1. Critical Deadline (Red) - Highest Priority
        if (deadlineStatus && deadlineStatus.isUrgent && deadlineStatus.color.includes('red')) {
            return 'border-red-500 bg-red-50 dark:bg-red-900/10 shadow-md';
        }

        // 2. Warning Deadline (Orange)
        if (deadlineStatus && deadlineStatus.isUrgent && deadlineStatus.color.includes('orange')) {
            return 'border-orange-400 bg-orange-50 dark:bg-orange-900/10 shadow-md';
        }

        // 3. Active Period (Green)
        if (year === currentYear && currentMonth >= startMonth && currentMonth <= endMonth) {
            return 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10 shadow-md ring-1 ring-emerald-500';
        }

        // 4. Completed (Gray)
        if (year < currentYear || (year === currentYear && currentMonth > endMonth)) {
            return 'border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 opacity-75';
        }

        // 5. Future/Default
        return 'border-blue-100 bg-white dark:bg-gray-700/30';
    };

    // Apply styles to H1 (Jan-Jun: 0-5)
    const h1WorstStatus = (h1SubmissionStatus.isUrgent ? h1SubmissionStatus :
        (h1PaymentStatus.isUrgent ? h1PaymentStatus : null));

    stats.h1.containerClass = getContainerStyle(h1WorstStatus, 0, 5);

    // Apply styles to H2 (Jul-Dec: 6-11)
    const h2WorstStatus = (h2SubmissionStatus.isUrgent ? h2SubmissionStatus :
        (h2PaymentStatus.isUrgent ? h2PaymentStatus : null));

    stats.h2.containerClass = getContainerStyle(h2WorstStatus, 6, 11);

    // Apply styles to Quarters
    stats.q1.containerClass = getContainerStyle(null, 0, 2);
    stats.q2.containerClass = getContainerStyle(null, 3, 5);
    stats.q3.containerClass = getContainerStyle(null, 6, 8);
    stats.q4.containerClass = getContainerStyle(null, 9, 11);

    return stats;
}
