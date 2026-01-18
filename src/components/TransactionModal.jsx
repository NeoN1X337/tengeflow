import { useState, useEffect } from 'react';
import { Modal, Label, TextInput, Select, Textarea, Checkbox, Button } from 'flowbite-react';

import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../constants/categories';

export default function TransactionModal({ show, onClose, onSave, initialData = null }) {
    const [formData, setFormData] = useState({
        amount: '',
        type: 'income',
        category: 'Зарплата',
        date: new Date().toISOString().split('T')[0],
        comment: '',
        isTaxable: false
    });

    useEffect(() => {
        if (show && initialData) {
            setFormData({
                ...initialData,
                date: initialData.date instanceof Date
                    ? initialData.date.toISOString().split('T')[0]
                    : new Date(initialData.date).toISOString().split('T')[0]
            });
        } else if (show && !initialData) {
            setFormData({
                amount: '',
                type: 'income',
                category: 'Зарплата',
                date: new Date().toISOString().split('T')[0],
                comment: '',
                isTaxable: false
            });
        }
    }, [show, initialData]);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.amount || parseFloat(formData.amount) < 1) {
            setError('Сумма должна быть не менее 1 ₸');
            return;
        }

        const selectedDate = new Date(formData.date);
        const today = new Date();
        today.setHours(23, 59, 59, 999); // Allow today until end of day

        if (selectedDate > today) {
            setError('Будущие даты недоступны');
            return;
        }

        try {
            await onSave({
                ...formData,
                amount: parseFloat(formData.amount),
                date: new Date(formData.date)
            });

            // Сбросить форму
            // Форма сбрасывается в useEffect
            onClose();
        } catch (err) {
            setError('Ошибка при сохранении. Попробуйте снова.');
            console.error(err);
        }
    };

    const handleTypeChange = (type) => {
        setFormData({
            ...formData,
            type,
            category: type === 'income' ? 'Зарплата' : 'Продукты',
            isTaxable: false
        });
    };

    const categories = formData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

    return (
        <Modal
            show={show}
            onClose={onClose}
            size="md"
            dismissible
            className="backdrop-blur-sm"
            position="center"
            data-testid="modal-overlay"
        >
            <div className="relative bg-white rounded-lg shadow-2xl border-2 border-gray-200">
                <Modal.Header className="border-b border-gray-200">
                    <span className="text-xl font-bold text-gray-900">
                        {initialData ? 'Редактировать операцию' : 'Добавить операцию'}
                    </span>
                </Modal.Header>
                <Modal.Body>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm font-medium">
                                {error}
                            </div>
                        )}

                        {/* Тип операции */}
                        <div>
                            <Label htmlFor="type" value="Тип операции" className="text-gray-700 font-semibold mb-2 block" />
                            <Select
                                id="type"
                                value={formData.type}
                                onChange={(e) => handleTypeChange(e.target.value)}
                                required
                                className="border-gray-300"
                                data-testid="transaction-type-select"
                            >
                                <option value="income">Доход</option>
                                <option value="expense">Расход</option>
                            </Select>
                        </div>

                        {/* Сумма */}
                        <div>
                            <Label htmlFor="amount" value="Сумма (₸)" className="text-gray-700 font-semibold mb-2 block" />
                            <TextInput
                                id="amount"
                                type="number"
                                min="1"
                                step="0.01"
                                placeholder="5000"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                required
                                className="border-gray-300"
                                data-testid="transaction-amount-input"
                            />
                        </div>

                        {/* Категория */}
                        <div>
                            <Label htmlFor="category" value="Категория" className="text-gray-700 font-semibold mb-2 block" />
                            <Select
                                id="category"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                required
                                className="border-gray-300"
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </Select>
                        </div>

                        {/* Дата */}
                        <div>
                            <Label htmlFor="date" value="Дата" className="text-gray-700 font-semibold mb-2 block" />
                            <TextInput
                                id="date"
                                type="date"
                                max={new Date().toISOString().split('T')[0]}
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                required
                                className="border-gray-300"
                            />
                        </div>

                        {/* Чекбокс налога (только для доходов) */}
                        {formData.type === 'income' && (
                            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <Checkbox
                                    id="taxable"
                                    checked={formData.isTaxable}
                                    onChange={(e) => setFormData({ ...formData, isTaxable: e.target.checked })}
                                    className="text-blue-600"
                                    data-testid="tax-checkbox"
                                />
                                <Label htmlFor="taxable" className="text-gray-700 font-medium cursor-pointer">
                                    Облагается налогом (4%)
                                </Label>
                            </div>
                        )}

                        {/* Комментарий */}
                        <div>
                            <Label htmlFor="comment" value="Комментарий (необязательно)" className="text-gray-700 font-semibold mb-2 block" />
                            <Textarea
                                id="comment"
                                rows={3}
                                placeholder="Описание операции..."
                                value={formData.comment}
                                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                                className="border-gray-300"
                            />
                        </div>

                        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                            <Button
                                color="gray"
                                onClick={onClose}
                                className="px-6"
                            >
                                <span className="font-semibold">Отмена</span>
                            </Button>
                            <Button
                                type="submit"
                                className="px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                                data-testid="save-button"
                            >
                                <span className="text-white font-semibold">
                                    {initialData ? 'Сохранить изменения' : 'Сохранить'}
                                </span>
                            </Button>
                        </div>
                    </form>
                </Modal.Body>
            </div>
        </Modal>
    );
}
