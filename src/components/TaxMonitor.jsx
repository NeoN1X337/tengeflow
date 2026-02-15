import { useMemo, useState } from 'react';
import { Card, Badge } from 'flowbite-react';
import { Calculator, Shield, AlertCircle, Info, Users, ChevronDown } from 'lucide-react';
import { calculateMonthlyObligations, TAX_CONSTANTS_2026 } from '../utils/taxCalculator';
import { formatCurrency } from '../utils/formatUtils';
import TaxBreakdownChart from './charts/TaxBreakdownChart';

/**
 * Единый компонент Налогового Монитора.
 *
 * @param {'compact' | 'full'} viewMode — режим отображения
 * @param {number} businessIncome — доход от ИП-деятельности (все 5 взносов)
 * @param {number} otherTaxableIncome — прочий облагаемый доход (только ИПН)
 * @param {number} taxRate — ставка налога (%)
 * @param {boolean} bornAfter1975 — рождён после 01.01.1975
 * @param {boolean} hasEmployees — есть сотрудники
 * @param {number} totalEmployeeSalary — общий ФОТ
 */
export default function TaxMonitor({
    viewMode = 'compact',
    businessIncome = 0,
    otherTaxableIncome = 0,
    taxRate = 4,
    bornAfter1975 = true,
    hasEmployees = false,
    totalEmployeeSalary = 0,
}) {
    const result = useMemo(() => {
        const hasBusinessIncome = businessIncome > 0;
        const hasOtherIncome = otherTaxableIncome > 0;
        const hasEmployeeData = hasEmployees && totalEmployeeSalary > 0;

        if (!hasBusinessIncome && !hasOtherIncome && !hasEmployeeData) return null;

        // Расчёт по бизнес-доходу (все 5 взносов)
        const businessResult = hasBusinessIncome
            ? calculateMonthlyObligations({
                monthlyIncome: businessIncome,
                customTaxRate: taxRate,
                bornAfter1975,
                hasEmployees,
                totalEmployeeSalary,
            })
            : hasEmployeeData
                ? calculateMonthlyObligations({
                    monthlyIncome: 0,
                    customTaxRate: taxRate,
                    bornAfter1975,
                    hasEmployees,
                    totalEmployeeSalary,
                })
                : null;

        // ИПН по прочему доходу — фиксированная ставка 10%
        const otherIpn = hasOtherIncome
            ? Math.round(otherTaxableIncome * 0.10 * 100) / 100
            : 0;

        // Собираем платежи
        const personalPayments = [];
        if (businessResult) {
            businessResult.allPayments.forEach(p => personalPayments.push({ ...p }));
        }
        if (hasOtherIncome) {
            personalPayments.push({
                amount: otherIpn,
                label: 'ИПН 10% (фриланс/инвест.)',
                tooltip: 'Доход от инвестиций, фриланса и другого облагается ИПН по ставке 10%.',
                base: '10% от прочего дохода',
            });
        }

        const totalGross = businessIncome + otherTaxableIncome;
        const personalReserve = Math.round(personalPayments.reduce((s, p) => s + p.amount, 0) * 100) / 100;
        const totalTax = businessResult ? businessResult.tax.totalTax + otherIpn : otherIpn;
        const totalMonthly = businessResult ? businessResult.monthly.totalMonthly : 0;
        const netIncome = Math.round((totalGross - totalMonthly - totalTax) * 100) / 100;

        const employeeObligations = businessResult?.employeeObligations ?? null;
        const employeeTotal = employeeObligations?.totalEmployeeObligations ?? 0;
        const totalToPay = Math.round((personalReserve + employeeTotal) * 100) / 100;

        return {
            personalPayments,
            employeeObligations,
            summary: { grossIncome: totalGross, personalReserve, employeeTotal, totalToPay, netIncome },
            hasBusinessIncome,
            hasOtherIncome,
            hasEmployeeData,
            otherIpn,
            bornAfter1975,
        };
    }, [businessIncome, otherTaxableIncome, taxRate, bornAfter1975, hasEmployees, totalEmployeeSalary]);

    if (!result) return null;

    if (viewMode === 'compact') {
        return <CompactView result={result} taxRate={taxRate} />;
    }
    return <FullView result={result} taxRate={taxRate} />;
}

// ─── Compact View (Dashboard) ─────────────────────────────────────────────────

function CompactView({ result, taxRate }) {
    const now = new Date();
    const daysUntilDeadline = 25 - now.getDate();

    const deadlineStatus = daysUntilDeadline > 7
        ? { text: 'Оплатить до 25 числа', color: 'text-gray-500', bg: 'bg-gray-50' }
        : daysUntilDeadline > 0
            ? { text: `Осталось ${daysUntilDeadline} дн. до оплаты`, color: 'text-orange-600', bg: 'bg-orange-50' }
            : daysUntilDeadline === 0
                ? { text: 'Сегодня крайний срок!', color: 'text-red-600', bg: 'bg-red-50' }
                : { text: 'Срок оплаты прошёл', color: 'text-red-700', bg: 'bg-red-50' };

    return (
        <Card className="shadow-lg border-l-4 border-l-indigo-500">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                        <Shield className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Налоговый монитор</h3>
                </div>
                <div className="flex gap-1">
                    <Badge color="indigo" className="text-xs">ИПН {taxRate}%</Badge>
                    {result.hasEmployeeData && (
                        <Badge color="purple" className="text-xs">+ штат</Badge>
                    )}
                </div>
            </div>

            {/* К уплате — единая карточка (без дублирования «Чистая прибыль») */}
            <div className="p-4 bg-red-50 rounded-xl" data-testid="tax-monitor-amount">
                <p className="text-xs text-red-500 font-medium mb-1">К уплате в этом месяце</p>
                <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(result.summary.totalToPay)} ₸
                </p>
                <p className="text-xs text-gray-400 mt-1">
                    {result.hasEmployeeData
                        ? `за себя: ${formatCurrency(result.summary.personalReserve)} ₸ · за штат: ${formatCurrency(result.summary.employeeTotal)} ₸`
                        : `${result.personalPayments.length} платеж(ей) за месяц`
                    }
                </p>
            </div>

            {/* Подсказка о прочем доходе */}
            {result.hasOtherIncome && (
                <div className="mt-3 flex items-start gap-2 px-3 py-2 bg-blue-50 rounded-lg">
                    <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-xs text-blue-700">
                        Фриланс/инвестиции — только ИПН ({formatCurrency(result.otherIpn)} ₸)
                    </span>
                </div>
            )}

            {/* Дедлайн */}
            <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-lg ${deadlineStatus.bg}`}>
                <AlertCircle className={`w-4 h-4 ${deadlineStatus.color}`} />
                <span className={`text-sm font-medium ${deadlineStatus.color}`}>
                    📅 {deadlineStatus.text}
                </span>
            </div>
        </Card>
    );
}

// ─── Full View (Analytics) — Accordion-based ──────────────────────────────────

function FullView({ result, taxRate }) {
    const [personalOpen, setPersonalOpen] = useState(false);
    const [employeeOpen, setEmployeeOpen] = useState(false);

    const employeePayments = result.employeeObligations?.allPayments ?? [];

    return (
        <Card className="shadow-lg border-t-4 border-t-blue-600">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                    <Calculator className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex flex-col">
                    <h3 className="text-xl font-bold text-gray-900">Налоговый монитор</h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                        <Badge color="blue" className="inline-flex">
                            Упрощенная декларация (ИПН: {taxRate}%)
                        </Badge>
                        {result.hasEmployeeData && (
                            <Badge color="purple" className="inline-flex">
                                <Users className="w-3 h-3 mr-1" />
                                С работниками
                            </Badge>
                        )}
                    </div>
                </div>
            </div>

            {/* Тип дохода hint */}
            {result.hasOtherIncome && result.hasBusinessIncome && (
                <div className="flex items-start gap-2 p-3 mb-4 bg-amber-50 rounded-lg border border-amber-200">
                    <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-800">
                        <strong>ИП</strong> — полный расчёт (5 взносов).{' '}
                        <strong>Фриланс/Инвестиции</strong> — только ИПН ({formatCurrency(result.otherIpn)} ₸).
                    </p>
                </div>
            )}

            {/* ─── Accordion: Личные налоги (ИП) ───────────────────────────── */}
            <TaxAccordion
                title="Личные налоги (ИП)"
                total={result.summary.personalReserve}
                payments={result.personalPayments}
                accentColor="blue"
                isOpen={personalOpen}
                onToggle={() => setPersonalOpen(!personalOpen)}
            />

            {/* ─── Accordion: Налоги за сотрудников ────────────────────────── */}
            {result.employeeObligations && (
                <div className="mt-3">
                    <TaxAccordion
                        title="Налоги за сотрудников"
                        total={result.summary.employeeTotal}
                        payments={employeePayments}
                        accentColor="violet"
                        isOpen={employeeOpen}
                        onToggle={() => setEmployeeOpen(!employeeOpen)}
                        footerNote="Расчет за штат ведется на основе введенного ФОТ (Фонда оплаты труда)"
                    />
                </div>
            )}

            {/* ─── Summary Cards ──────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 mb-6">
                <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">Валовый доход</p>
                    <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(result.summary.grossIncome)} ₸
                    </p>
                </div>
                <div className="p-4 bg-red-50 rounded-xl">
                    <p className="text-sm text-red-600 mb-1">К уплате (всего)</p>
                    <p className="text-2xl font-bold text-red-600">
                        {formatCurrency(result.summary.totalToPay)} ₸
                    </p>
                    {result.hasEmployeeData && (
                        <div className="flex gap-2 mt-1 text-xs text-gray-500">
                            <span>за себя: {formatCurrency(result.summary.personalReserve)} ₸</span>
                            <span>·</span>
                            <span>за штат: {formatCurrency(result.summary.employeeTotal)} ₸</span>
                        </div>
                    )}
                </div>
                <div className="p-4 bg-green-50 rounded-xl">
                    <p className="text-sm text-green-600 mb-1">Чистая прибыль</p>
                    <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(result.summary.netIncome)} ₸
                    </p>
                </div>
            </div>

            {/* ─── Adaptive Chart ─────────────────────────────────────────── */}
            <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    Структура налоговых платежей
                </h4>
                <TaxBreakdownChart
                    personalPayments={result.personalPayments}
                    employeePayments={employeePayments}
                    totalToPay={result.summary.totalToPay}
                />
            </div>

            {/* ─── Footer Notes ───────────────────────────────────────────── */}
            <div className="space-y-2">
                {!result.bornAfter1975 && (
                    <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <Info className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-amber-700">
                            ОПВР «за себя» не рассчитывается — рождён до 01.01.1975.
                        </p>
                    </div>
                )}

                <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                    <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-700">
                        ОПВР рассчитывается автоматически на основе года рождения.
                        Расчет произведен исходя из МЗП {TAX_CONSTANTS_2026.MZP.toLocaleString('ru-KZ')} ₸ (2026).
                        Пожалуйста, проверяйте актуальные ставки в кабинете налогоплательщика РК.
                    </p>
                </div>
            </div>
        </Card>
    );
}

// ─── Accordion Sub-component ──────────────────────────────────────────────────

const ACCENT = {
    blue: {
        bar: 'bg-blue-500',
        headerBg: 'hover:bg-blue-50',
        itemBg: 'bg-gray-50',
        itemHover: 'hover:bg-gray-100',
        colors: ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'],
    },
    violet: {
        bar: 'bg-violet-500',
        headerBg: 'hover:bg-violet-50',
        itemBg: 'bg-violet-50/50',
        itemHover: 'hover:bg-violet-100/50',
        colors: ['#e11d48', '#f97316', '#a855f7', '#0ea5e9', '#14b8a6', '#eab308'],
    },
};

function TaxAccordion({ title, total, payments, accentColor, isOpen, onToggle, footerNote }) {
    const theme = ACCENT[accentColor] || ACCENT.blue;

    return (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
            {/* Header — clickable */}
            <button
                type="button"
                onClick={onToggle}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${theme.headerBg}`}
            >
                <div className={`w-1.5 h-6 rounded-full flex-shrink-0 ${theme.bar}`} />
                <span className="text-sm font-bold text-gray-900 flex-1 text-left">{title}</span>
                <span className="text-sm font-semibold text-gray-600 mr-2">
                    {formatCurrency(total)} ₸
                </span>
                <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Collapsible body */}
            <div
                className="grid transition-all duration-300 ease-in-out"
                style={{
                    gridTemplateRows: isOpen ? '1fr' : '0fr',
                }}
            >
                <div className="overflow-hidden">
                    <div className="px-4 pb-3 pt-1 space-y-1.5">
                        {payments.map((payment, idx) => (
                            <div
                                key={payment.label}
                                className={`flex items-center justify-between p-2.5 rounded-lg transition-colors ${theme.itemBg} ${theme.itemHover}`}
                            >
                                <div className="flex items-center gap-2.5">
                                    <div
                                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: theme.colors[idx % theme.colors.length] }}
                                    />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{payment.label}</p>
                                        <p className="text-xs text-gray-400">{payment.base}</p>
                                    </div>
                                </div>
                                <p className="text-sm font-bold text-gray-900">
                                    {formatCurrency(payment.amount)} ₸
                                </p>
                            </div>
                        ))}

                        {footerNote && (
                            <div className="flex items-start gap-2 pt-1 px-1">
                                <Info className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-gray-500">{footerNote}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
