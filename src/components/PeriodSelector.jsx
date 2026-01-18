import { Select } from 'flowbite-react';

export default function PeriodSelector({
    selectedYear,
    selectedMonth,
    onYearChange,
    onMonthChange,
    years = [] // Dynmaic years list
}) {
    const months = [
        { value: 'all', label: 'Весь год' },
        { value: '0', label: 'Январь' },
        { value: '1', label: 'Февраль' },
        { value: '2', label: 'Март' },
        { value: '3', label: 'Апрель' },
        { value: '4', label: 'Май' },
        { value: '5', label: 'Июнь' },
        { value: '6', label: 'Июль' },
        { value: '7', label: 'Август' },
        { value: '8', label: 'Сентябрь' },
        { value: '9', label: 'Октябрь' },
        { value: '10', label: 'Ноябрь' },
        { value: '11', label: 'Декабрь' },
    ];

    // Default range if no years provided (2024-2030)
    const yearOptions = years.length > 0
        ? years
        : Array.from({ length: 7 }, (_, i) => 2024 + i);

    return (
        <div className="flex gap-2">
            <Select
                id="month-select"
                value={selectedMonth}
                onChange={(e) => onMonthChange(e.target.value)}
                className="w-40"
            >
                {months.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                ))}
            </Select>

            <Select
                id="year-select"
                value={selectedYear}
                onChange={(e) => onYearChange(parseInt(e.target.value))}
                className="w-32"
            >
                {yearOptions.map(year => (
                    <option key={year} value={year}>{year}</option>
                ))}
            </Select>
        </div>
    );
}
