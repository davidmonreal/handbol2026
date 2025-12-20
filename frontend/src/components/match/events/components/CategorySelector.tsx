import React from 'react';
import type { EventCategory } from '../eventFormStateMachine';
import type { Translator } from './types';

const categories: Array<{ value: EventCategory; key: string }> = [
    { value: 'Shot', key: 'eventForm.categoryShot' },
    { value: 'Sanction', key: 'eventForm.categoryFoul' },
    { value: 'Turnover', key: 'eventForm.categoryTurnover' },
];

type CategorySelectorProps = {
    selectedCategory: EventCategory;
    onSelect: (category: EventCategory) => void;
    lockClass: string;
    t: Translator;
};

const CategorySelectorInner = (
    { selectedCategory, onSelect, lockClass, t }: CategorySelectorProps,
    ref: React.Ref<HTMLDivElement>,
) => (
    <div className={lockClass} ref={ref}>
        <div className="hidden sm:block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            {t('eventForm.category')}
        </div>
        <div className="grid grid-cols-3 gap-2">
            {categories.map((cat) => (
                <button
                    key={cat.value}
                    onClick={() => onSelect(cat.value)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedCategory === cat.value
                            ? 'bg-indigo-500 text-white shadow-sm'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                    }`}
                >
                    {t(cat.key)}
                </button>
            ))}
        </div>
    </div>
);

export const CategorySelector = React.forwardRef<HTMLDivElement, CategorySelectorProps>(
    CategorySelectorInner,
);
