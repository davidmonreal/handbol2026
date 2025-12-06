import { useState } from 'react';
import type { MatchEvent, FlowType } from '../../../types';
import { useMatch } from '../../../context/MatchContext';
import { ConfirmationModal } from '../../common';

interface EventEditCategoryProps {
    event: MatchEvent;
    onSave: () => void;
    onCancel: () => void;
}

export const EventEditCategory = ({ event, onSave, onCancel }: EventEditCategoryProps) => {
    const { updateEvent, deleteEvent } = useMatch();
    const [selectedCategory, setSelectedCategory] = useState<FlowType>(event.category as FlowType);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

    const categories: { value: FlowType; label: string; icon: string }[] = [
        { value: 'Shot', label: 'Shot', icon: '🎯' },
        { value: 'Turnover', label: 'Turnover', icon: '❌' },
        { value: 'Sanction', label: 'Sanction', icon: '⚠️' },
    ];

    const handleSelect = (category: FlowType) => {
        setSelectedCategory(category);
    };

    const handleSave = async () => {
        if (selectedCategory === null) return;

        await updateEvent(event.id, {
            category: selectedCategory,
            // Reset action when changing category
            action: selectedCategory === 'Shot' ? 'Goal' : selectedCategory === 'Turnover' ? 'Pass' : 'Foul'
        });
        onSave();
    };

    const handleDelete = () => {
        setShowDeleteConfirmation(true);
    };

    const confirmDelete = async () => {
        setShowDeleteConfirmation(false);
        await deleteEvent(event.id);
        onSave();
    };

    return (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Category
            </div>
            <div className="flex gap-2">
                {categories.map(cat => (
                    <button
                        key={cat.value}
                        onClick={() => handleSelect(cat.value)}
                        className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-all ${selectedCategory === cat.value
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                            }`}
                    >
                        <span className="mr-1">{cat.icon}</span>
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Save, Cancel and Delete buttons at bottom */}
            <div className="flex justify-between items-center mt-3">
                <button
                    onClick={handleDelete}
                    className="px-4 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                </button>

                <div className="flex gap-2">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 text-sm bg-indigo-600 text-white hover:bg-indigo-700 font-medium rounded-lg transition-colors shadow-sm"
                    >
                        Save
                    </button>
                </div>
            </div>

            <ConfirmationModal
                isOpen={showDeleteConfirmation}
                title="Delete Event"
                message="Are you sure you want to delete this event? This action cannot be undone."
                confirmLabel="Delete"
                cancelLabel="Cancel"
                variant="danger"
                onConfirm={confirmDelete}
                onCancel={() => setShowDeleteConfirmation(false)}
            />
        </div>
    );
};
