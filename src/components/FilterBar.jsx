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

                <div className="flex gap-2 w-full sm:w-auto relative">
                    {/* Additional Filters Button */}
                    <Button
                        color="gray"
                        onClick={() => setShowModal(true)}
                        className="relative"
                    >
                        <Filter className="w-4 h-4 mr-2" />
                        Фильтры
                    </Button>
                </div>
            </div>

            {/* Active Filters Chips */}
            {(filters.category || filters.isTaxable) && (
                <div className="flex flex-wrap items-center gap-2 pt-2">
                    <span className="text-xs text-gray-500 font-medium mr-1">Активные фильтры:</span>

                    {filters.category && (
                        <Badge color="indigo" size="sm" className="px-2 py-1 flex items-center gap-1 shadow-sm">
                            {filters.category}
                            <button
                                onClick={() => onFilterChange({ ...filters, category: '' })}
                                className="ml-1 hover:bg-indigo-200 rounded-full p-0.5 transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </Badge>
                    )}

                    {filters.isTaxable && (
                        <Badge color="warning" size="sm" className="px-2 py-1 flex items-center gap-1 shadow-sm">
                            Налогооблагаемые
                            <button
                                onClick={() => onFilterChange({ ...filters, isTaxable: false })}
                                className="ml-1 hover:bg-yellow-200 rounded-full p-0.5 transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </Badge>
                    )}

                    <button
                        onClick={clearAdditionalFilters}
                        className="text-xs text-red-500 hover:text-red-700 hover:underline flex items-center gap-1 ml-2 transition-colors"
                    >
                        <X className="w-3 h-3" />
                        Сбросить все
                    </button>
                </div>
            )}

            {/* Additional Filters Dropdown/Popover */}
            {showModal && (
                <div className="absolute top-12 right-0 z-50 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Фильтры</h3>
                        <button
                            onClick={() => setShowModal(false)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="p-4 space-y-4">
                        <div>
                            <Label htmlFor="filter-category" value="Категория" className="mb-2 block" />
                            <Select
                                id="filter-category"
                                value={filters.category}
                                onChange={handleCategoryChange}
                                className="w-full"
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

                    <div className="p-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-b-xl flex gap-3">
                        <Button
                            onClick={clearAdditionalFilters}
                            color="gray"
                            size="sm"
                            className="flex-1 border-none bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                        >
                            <RotateCcw className="w-3 h-3 mr-2" />
                            Сбросить
                        </Button>
                        <Button
                            onClick={() => setShowModal(false)}
                            size="sm"
                            className="flex-[1.5] bg-gradient-to-r from-blue-600 to-indigo-600 border-none shadow-sm hover:shadow-md"
                        >
                            <Check className="w-3 h-3 mr-2 text-white" />
                            Готово
                        </Button>
                    </div>
                </div>
            )}

            {/* Removed Modal Component */}
        </div>
    );
}
