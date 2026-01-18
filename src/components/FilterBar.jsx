import { useState, useEffect } from 'react';
import { Badge, Button, Select, Modal, Label, Checkbox } from 'flowbite-react';
import { Filter, X, Check, RotateCcw } from 'lucide-react';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../constants/categories';

export default function FilterBar({ filters, onFilterChange }) {
    const [showModal, setShowModal] = useState(false);

    const handleTypeChange = (type) => {
        onFilterChange({ ...filters, type, category: '' });
    };

    const handleCategoryChange = (e) => {
        onFilterChange({ ...filters, category: e.target.value });
    };

    const handleTaxableChange = (e) => {
        onFilterChange({ ...filters, isTaxable: e.target.checked });
    };

    const clearAdditionalFilters = () => {
        onFilterChange({ ...filters, category: '', isTaxable: false });
        setShowModal(false);
    };

    const activeFiltersCount = (filters.category ? 1 : 0) + (filters.isTaxable ? 1 : 0);

    // Combine categories for "All" type or show specific
    const currentCategories = filters.type === 'income'
        ? INCOME_CATEGORIES
        : filters.type === 'expense'
            ? EXPENSE_CATEGORIES
            : [...new Set([...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES])];

    return (
        <div className="space-y-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                {/* Type Chips */}
                <div className="flex gap-2">
                    <span
                        onClick={() => handleTypeChange('all')}
                        className={`cursor-pointer px-3 py-1 rounded-full text-sm font-medium transition-colors ${filters.type === 'all'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        Все
                    </span>
                    <span
                        onClick={() => handleTypeChange('income')}
                        className={`cursor-pointer px-3 py-1 rounded-full text-sm font-medium transition-colors ${filters.type === 'income'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        Доходы
                    </span>
                    <span
                        onClick={() => handleTypeChange('expense')}
                        className={`cursor-pointer px-3 py-1 rounded-full text-sm font-medium transition-colors ${filters.type === 'expense'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        Расходы
                    </span>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                    {/* Additional Filters Button */}
                    <Button
                        color="gray"
                        onClick={() => setShowModal(true)}
                        className="relative"
                    >
                        <Filter className="w-4 h-4 mr-2" />
                        Фильтры
                        {activeFiltersCount > 0 && (
                            <Badge color="info" className="ml-2 absolute -top-2 -right-2 rounded-full px-2">
                                {activeFiltersCount}
                            </Badge>
                        )}
                    </Button>
                </div>
            </div>

            {/* Additional Filters Modal */}
            <Modal show={showModal} onClose={() => setShowModal(false)} size="sm">
                <Modal.Header>Дополнительные фильтры</Modal.Header>
                <Modal.Body>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="filter-category" value="Категория" className="mb-2 block" />
                            <Select
                                id="filter-category"
                                value={filters.category}
                                onChange={handleCategoryChange}
                            >
                                <option value="">Все категории</option>
                                {currentCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </Select>
                        </div>

                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="filter-taxable"
                                checked={filters.isTaxable}
                                onChange={handleTaxableChange}
                            />
                            <Label htmlFor="filter-taxable">Только налогооблагаемые</Label>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer className="flex justify-between gap-3 border-t dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                    <Button
                        onClick={clearAdditionalFilters}
                        color="gray"
                        className="flex-1 border-none bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 font-medium transition-all group"
                    >
                        <RotateCcw className="w-4 h-4 mr-2 group-hover:rotate-[-45deg] transition-transform" />
                        Сбросить
                    </Button>
                    <Button
                        onClick={() => setShowModal(false)}
                        className="flex-[1.5] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-none shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 py-1"
                    >
                        <Check className="w-4 h-4 mr-2 text-white" />
                        <span className="text-white font-bold tracking-wide">Применить</span>
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
