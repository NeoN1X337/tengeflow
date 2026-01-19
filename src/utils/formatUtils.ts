export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ru-KZ', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
};

export const formatDate = (date: Date | number | string): string => {
    const d = new Date(date);
    return new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(d);
};
