import { useMemo } from 'react';
import {
    PieChart, Pie, Cell,
    BarChart, Bar, XAxis, YAxis,
    ResponsiveContainer, Tooltip, Legend,
} from 'recharts';
import useMediaQuery from '../../hooks/useMediaQuery';
import { formatCurrency } from '../../utils/formatUtils';

const COLORS_PERSONAL = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];
const COLORS_EMPLOYEE = ['#e11d48', '#f97316', '#a855f7', '#0ea5e9', '#14b8a6', '#eab308'];
const GROUP_COLORS = { personal: '#3b82f6', employee: '#a855f7' };

/**
 * Адаптивный график налоговых платежей.
 *
 * Mobile (< 768px)  → горизонтальный Stacked Bar
 * Desktop (≥ 768px) → двухуровневый бублик
 *
 * @param {Array} personalPayments  — массив { label, amount }
 * @param {Array} employeePayments  — массив { label, amount } (может быть пустым)
 * @param {number} totalToPay — общая сумма «К уплате»
 */
export default function TaxBreakdownChart({ personalPayments = [], employeePayments = [], totalToPay = 0 }) {
    const isDesktop = useMediaQuery(768);

    const personalData = useMemo(() =>
        personalPayments.filter(p => p.amount > 0).map(p => ({ name: p.label, value: p.amount })),
        [personalPayments]
    );

    const employeeData = useMemo(() =>
        employeePayments.filter(p => p.amount > 0).map(p => ({ name: p.label, value: p.amount })),
        [employeePayments]
    );

    const hasData = personalData.length > 0 || employeeData.length > 0;
    if (!hasData) return null;

    const CustomTooltip = ({ active, payload }) => {
        if (!active || !payload?.length) return null;
        const d = payload[0];
        const pct = totalToPay > 0 ? ((d.value / totalToPay) * 100).toFixed(1) : '0';
        return (
            <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-100 text-sm">
                <p className="font-semibold text-gray-900">{d.name || d.payload?.name}</p>
                <p className="text-gray-600">{formatCurrency(d.value)} ₸ ({pct}%)</p>
            </div>
        );
    };

    if (!isDesktop) {
        return <MobileStackedBar personalData={personalData} employeeData={employeeData} CustomTooltip={CustomTooltip} />;
    }

    return <DesktopDualDonut personalData={personalData} employeeData={employeeData} CustomTooltip={CustomTooltip} />;
}

// ─── Mobile: Horizontal Stacked Bar ──────────────────────────────────────────

function MobileStackedBar({ personalData, employeeData, CustomTooltip }) {
    // Собираем данные для stacked bar: 1 строка «Я», 1 строка «Штат»
    const barData = [];

    if (personalData.length > 0) {
        const row = { name: 'Личные (ИП)' };
        personalData.forEach((d, i) => { row[`p${i}`] = d.value; });
        barData.push(row);
    }

    if (employeeData.length > 0) {
        const row = { name: 'Штат' };
        employeeData.forEach((d, i) => { row[`e${i}`] = d.value; });
        barData.push(row);
    }

    // Все ключи для stacked bars
    const personalKeys = personalData.map((_, i) => `p${i}`);
    const employeeKeys = employeeData.map((_, i) => `e${i}`);

    return (
        <div className="w-full">
            <div className="w-full" style={{ height: barData.length * 60 + 60 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={barData}
                        layout="vertical"
                        margin={{ top: 0, right: 10, bottom: 0, left: -10 }}
                        barSize={28}
                    >
                        <XAxis
                            type="number"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9CA3AF', fontSize: 11 }}
                            tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                        />
                        <YAxis
                            type="category"
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#374151', fontSize: 12, fontWeight: 600 }}
                            width={80}
                        />
                        <Tooltip content={<CustomTooltip />} />

                        {personalKeys.map((key, i) => (
                            <Bar
                                key={key}
                                dataKey={key}
                                stackId="stack"
                                fill={COLORS_PERSONAL[i % COLORS_PERSONAL.length]}
                                radius={i === personalKeys.length - 1 && employeeKeys.length === 0 ? [0, 4, 4, 0] : [0, 0, 0, 0]}
                                name={personalData[i]?.name || key}
                            />
                        ))}

                        {employeeKeys.map((key, i) => (
                            <Bar
                                key={key}
                                dataKey={key}
                                stackId="stack"
                                fill={COLORS_EMPLOYEE[i % COLORS_EMPLOYEE.length]}
                                radius={i === employeeKeys.length - 1 ? [0, 4, 4, 0] : [0, 0, 0, 0]}
                                name={employeeData[i]?.name || key}
                            />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Interactive legend — mobile friendly, wrapping */}
            <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-2 px-1">
                {personalData.map((d, i) => (
                    <span key={d.name} className="inline-flex items-center gap-1 text-xs text-gray-600">
                        <span className="w-2 h-2 rounded-full inline-block flex-shrink-0"
                            style={{ backgroundColor: COLORS_PERSONAL[i % COLORS_PERSONAL.length] }} />
                        {d.name}
                    </span>
                ))}
                {employeeData.map((d, i) => (
                    <span key={d.name} className="inline-flex items-center gap-1 text-xs text-gray-600">
                        <span className="w-2 h-2 rounded-full inline-block flex-shrink-0"
                            style={{ backgroundColor: COLORS_EMPLOYEE[i % COLORS_EMPLOYEE.length] }} />
                        {d.name}
                    </span>
                ))}
            </div>
        </div>
    );
}

// ─── Desktop: Dual-Ring Donut ────────────────────────────────────────────────

function DesktopDualDonut({ personalData, employeeData, CustomTooltip }) {
    const personalTotal = personalData.reduce((s, d) => s + d.value, 0);
    const employeeTotal = employeeData.reduce((s, d) => s + d.value, 0);

    // Inner ring: 2 segments — Я / Штат
    const innerData = [
        { name: 'Личные (ИП)', value: personalTotal },
    ];
    if (employeeTotal > 0) {
        innerData.push({ name: 'За штат', value: employeeTotal });
    }

    // Outer ring: detailed segments
    const outerData = [
        ...personalData.map((d, i) => ({ ...d, color: COLORS_PERSONAL[i % COLORS_PERSONAL.length] })),
        ...employeeData.map((d, i) => ({ ...d, color: COLORS_EMPLOYEE[i % COLORS_EMPLOYEE.length] })),
    ];

    return (
        <div className="w-full">
            <div className="w-full" style={{ minHeight: 300 }}>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        {/* Inner ring — Я / Штат */}
                        <Pie
                            data={innerData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={65}
                            paddingAngle={3}
                            dataKey="value"
                            stroke="none"
                        >
                            {innerData.map((entry, idx) => (
                                <Cell key={`inner-${idx}`} fill={idx === 0 ? GROUP_COLORS.personal : GROUP_COLORS.employee} opacity={0.7} />
                            ))}
                        </Pie>

                        {/* Outer ring — DetailedPayments */}
                        <Pie
                            data={outerData}
                            cx="50%"
                            cy="50%"
                            innerRadius={72}
                            outerRadius={110}
                            paddingAngle={2}
                            dataKey="value"
                            stroke="none"
                        >
                            {outerData.map((entry, idx) => (
                                <Cell key={`outer-${idx}`} fill={entry.color} />
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
    );
}
