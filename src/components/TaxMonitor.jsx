import { useMemo } from 'react';
import { Card, Badge } from 'flowbite-react';
import { Calculator, Shield, AlertCircle, Info } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { calculateMonthlyObligations, TAX_CONSTANTS_2026 } from '../utils/taxCalculator';
import { formatCurrency } from '../utils/formatUtils';

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];

/**
 * Единый компонент Налогового Монитора.
 *
 * Логика:
 * - businessIncome (Зарплата / ИП-деятельность): все 5 взносов (ОПВ, ОПВР, ВОСМС, СО, ИПН)
 * - otherTaxableIncome (Фриланс / Инвестиции / Другое): только ИПН
 *
 * @param {'compact' | 'full'} viewMode — режим отображения
 * @param {number} businessIncome — доход от ИП-деятельности (все 5 взносов)
 * @param {number} otherTaxableIncome — прочий облагаемый доход (только ИПН)
 * @param {number} taxRate — ставка налога (%)
 */
export default function TaxMonitor({ viewMode = 'compact', businessIncome = 0, otherTaxableIncome = 0, taxRate = 4 }) {
    const result = useMemo(() => {
        const hasBusinessIncome = businessIncome > 0;
        const hasOtherIncome = otherTaxableIncome > 0;

        if (!hasBusinessIncome && !hasOtherIncome) return null;

        // Расчёт по бизнес-доходу (все 5 взносов)
        const businessResult = hasBusinessIncome
            ? calculateMonthlyObligations({
                monthlyIncome: businessIncome,
                customTaxRate: taxRate,
            })
            : null;

        // ИПН по прочему доходу — фиксированная ставка 10% (инвестиции, фриланс)
        const OTHER_IPN_RATE = 10;
        const otherIpn = hasOtherIncome
            ? Math.round(otherTaxableIncome * (OTHER_IPN_RATE / 100) * 100) / 100
            : 0;

        // Собираем платежи: из бизнес-расчета + отдельная строка за прочий доход
        const payments = [];
        if (businessResult) {
            businessResult.allPayments.forEach(p => payments.push({ ...p }));
        }

        if (hasOtherIncome) {
            // Прочий доход всегда отдельной строкой (ставка 10% отличается от бизнес-ставки)
            payments.push({
                amount: otherIpn,
                label: `ИПН 10% (фриланс/инвест.)`,
                tooltip: `Доход от инвестиций, фриланса и другого облагается ИПН по ставке 10%.`,
                base: `10% от прочего дохода`,
            });
        }

        const totalGross = businessIncome + otherTaxableIncome;
        const taxReserve = payments.reduce((sum, p) => sum + p.amount, 0);
        const totalTax = businessResult ? businessResult.tax.totalTax + otherIpn : otherIpn;
        const totalMonthly = businessResult ? businessResult.monthly.totalMonthly : 0;
        const netIncome = Math.round((totalGross - totalMonthly - totalTax) * 100) / 100;

        return {
            allPayments: payments,
            summary: {
                grossIncome: totalGross,
                taxReserve: Math.round(taxReserve * 100) / 100,
                netIncome,
            },
            hasBusinessIncome,
            hasOtherIncome,
            otherIpn,
        };
    }, [businessIncome, otherTaxableIncome, taxRate]);

    if (!result) return null;

    if (viewMode === 'compact') {
        return <CompactView result={result} taxRate={taxRate} />;
    }

    return <FullView result={result} taxRate={taxRate} />;
}

// ─── Compact View (Dashboard) ─────────────────────────────────────────────────

function CompactView({ result, taxRate }) {
    const now = new Date();
    const currentDay = now.getDate();
    const daysUntilDeadline = 25 - currentDay;

    const deadlineStatus = daysUntilDeadline > 7
        ? { text: `Оплатить до 25 числа`, color: 'text-gray-500', bg: 'bg-gray-50' }
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
                    <h3 className="text-lg font-bold text-gray-900">
                        Налоговый монитор
                    </h3>
                </div>
                <Badge color="indigo" className="text-xs">
                    ИПН {taxRate}%
                </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Налоговый резерв */}
                <div className="p-4 bg-red-50 rounded-xl">
                    <p className="text-xs text-red-500 font-medium mb-1">Налоговый резерв</p>
                    <p className="text-2xl font-bold text-red-600">
                        {formatCurrency(result.summary.taxReserve)} ₸
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        {result.allPayments.length} платеж(ей) за месяц
                    </p>
                </div>

                {/* Чистая прибыль */}
                <div className="p-4 bg-green-50 rounded-xl">
                    <p className="text-xs text-green-500 font-medium mb-1">Чистая прибыль</p>
                    <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(result.summary.netIncome)} ₸
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        Доход − все налоги
                    </p>
                </div>
            </div>

            {/* Подсказка о прочем доходе */}
            {result.hasOtherIncome && (
                <div className="mt-3 flex items-start gap-2 px-3 py-2 bg-blue-50 rounded-lg">
                    <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-xs text-blue-700">
                        Фриланс/инвестиции — только ИПН ({formatCurrency(result.otherIpn)} ₸), без ОПВ/СО/ВОСМС/ОПВР
                    </span>
                </div>
            )}

            {/* Статус оплаты */}
            <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-lg ${deadlineStatus.bg}`}>
                <AlertCircle className={`w-4 h-4 ${deadlineStatus.color}`} />
                <span className={`text-sm font-medium ${deadlineStatus.color}`}>
                    📅 {deadlineStatus.text}
                </span>
            </div>
        </Card>
    );
}

// ─── Full View (Analytics) ────────────────────────────────────────────────────

function FullView({ result, taxRate }) {
    const pieData = result.allPayments
        .filter(p => p.amount > 0)
        .map(p => ({
            name: p.label,
            value: p.amount,
        }));

    const CustomTooltip = ({ active, payload }) => {
        if (!active || !payload?.length) return null;
        const data = payload[0];
        const percent = ((data.value / result.summary.taxReserve) * 100).toFixed(1);
        return (
            <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
                <p className="text-sm font-semibold text-gray-900">{data.name}</p>
                <p className="text-sm text-gray-600">
                    {formatCurrency(data.value)} ₸ ({percent}%)
                </p>
            </div>
        );
    };

    return (
        <Card className="shadow-lg border-t-4 border-t-blue-600">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                    <Calculator className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex flex-col">
                    <h3 className="text-xl font-bold text-gray-900">
                        Налоговый монитор
                    </h3>
                    <Badge color="blue" className="inline-flex mt-1">
                        Упрощенная декларация (ИПН: {taxRate}%)
                    </Badge>
                </div>
            </div>

            {/* Подсказка о типах дохода */}
            {result.hasOtherIncome && result.hasBusinessIncome && (
                <div className="flex items-start gap-2 p-3 mb-4 bg-amber-50 rounded-lg border border-amber-200">
                    <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-800">
                        <strong>Зарплата/ИП</strong> — полный расчёт (5 взносов).{' '}
                        <strong>Фриланс/Инвестиции/Другое</strong> — только ИПН ({formatCurrency(result.otherIpn)} ₸).
                    </p>
                </div>
            )}

            {/* Детальный список платежей */}
            <div className="space-y-2 mb-6">
                {result.allPayments.map((payment, idx) => (
                    <div
                        key={payment.label}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                            />
                            <div>
                                <p className="text-sm font-medium text-gray-900">{payment.label}</p>
                                <p className="text-xs text-gray-400">{payment.base}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold text-gray-900">
                                {formatCurrency(payment.amount)} ₸
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Итого */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">Валовый доход</p>
                    <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(result.summary.grossIncome)} ₸
                    </p>
                </div>
                <div className="p-4 bg-red-50 rounded-xl">
                    <p className="text-sm text-red-600 mb-1">Налоговый резерв</p>
                    <p className="text-2xl font-bold text-red-600">
                        {formatCurrency(result.summary.taxReserve)} ₸
                    </p>
                </div>
                <div className="p-4 bg-green-50 rounded-xl">
                    <p className="text-sm text-green-600 mb-1">Чистая прибыль</p>
                    <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(result.summary.netIncome)} ₸
                    </p>
                </div>
            </div>

            {/* Pie Chart */}
            {pieData.length > 0 && (
                <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">
                        Структура налоговых платежей
                    </h4>
                    <div className="w-full" style={{ minHeight: 280 }}>
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={3}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {pieData.map((_, idx) => (
                                        <Cell
                                            key={`cell-${idx}`}
                                            fill={COLORS[idx % COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend
                                    verticalAlign="bottom"
                                    iconType="circle"
                                    iconSize={8}
                                    formatter={(value) => (
                                        <span className="text-xs text-gray-600">{value}</span>
                                    )}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Подсказка */}
            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-700">
                    Расчет произведен исходя из МЗП {TAX_CONSTANTS_2026.MZP.toLocaleString('ru-KZ')} ₸ (2026).
                    Пожалуйста, проверяйте актуальные ставки в кабинете налогоплательщика РК.
                </p>
            </div>
        </Card>
    );
}
