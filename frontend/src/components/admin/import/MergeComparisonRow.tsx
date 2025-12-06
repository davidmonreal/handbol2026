import { useState, useEffect } from 'react';
import type { ExtractedPlayer, DuplicateMatch } from '../../../services/playerImportService';

interface MergeComparisonRowProps {
    newPlayer: ExtractedPlayer;
    existingPlayer: DuplicateMatch | null;
    action: 'merge' | 'skip' | 'keep' | undefined;
    mergeChoices: Map<string, 'existing' | 'new'>;
    onActionChange: (action: 'merge' | 'skip' | 'keep') => void;
    onFieldChoiceChange: (field: string, choice: 'existing' | 'new') => void;
    onConfirmMerge: () => void;
    // Edit Mode Props
    isEditing?: boolean;
    onSave?: (player: ExtractedPlayer) => void;
    onCancel?: () => void;
}

// Constants for field configuration
const FIELD_LABELS = {
    name: 'Name',
    number: 'Number',
    handedness: 'Handedness',
    isGoalkeeper: 'Goalkeeper'
} as const;

type FieldKey = keyof typeof FIELD_LABELS;

interface ComparisonFieldProps {
    field: FieldKey;
    existingValue: string;
    newValue: string;
    choice?: 'existing' | 'new';
    onChoiceChange: (field: string, choice: 'existing' | 'new') => void;
    isEditing: boolean;
    editForm?: ExtractedPlayer;
    setEditForm?: (form: ExtractedPlayer) => void;
}

const ComparisonField = ({
    field,
    existingValue,
    newValue,
    choice,
    onChoiceChange,
    isEditing,
    editForm,
    setEditForm
}: ComparisonFieldProps) => {
    const label = FIELD_LABELS[field];

    if (isEditing && editForm && setEditForm) {
        return (
            <div className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-b-0">
                <div className="w-24 text-sm font-medium text-gray-500">{label}</div>
                <div className="flex-1">
                    {field === 'name' && (
                        <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    )}
                    {field === 'number' && (
                        <input
                            type="number"
                            value={editForm.number}
                            onChange={(e) => setEditForm({ ...editForm, number: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    )}
                    {field === 'handedness' && (
                        <div className="flex gap-2">
                            {['Unknown', 'RIGHT', 'LEFT'].map((hand) => (
                                <button
                                    key={hand}
                                    type="button"
                                    onClick={() => setEditForm({ ...editForm, handedness: hand === 'Unknown' ? undefined : hand as 'RIGHT' | 'LEFT' })}
                                    className={`px-4 py-2 text-sm rounded-lg border-2 transition-all ${(hand === 'Unknown' && !editForm.handedness) ||
                                            editForm.handedness === hand
                                            ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                        }`}
                                >
                                    {hand === 'Unknown' ? 'Unknown' : hand === 'RIGHT' ? 'Right' : 'Left'}
                                </button>
                            ))}
                        </div>
                    )}
                    {field === 'isGoalkeeper' && (
                        <div className="flex gap-2">
                            {[false, true].map((isGK) => (
                                <button
                                    key={isGK ? 'yes' : 'no'}
                                    type="button"
                                    onClick={() => setEditForm({ ...editForm, isGoalkeeper: isGK })}
                                    className={`px-4 py-2 text-sm rounded-lg border-2 transition-all ${editForm.isGoalkeeper === isGK
                                            ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                        }`}
                                >
                                    {isGK ? 'Yes' : 'No'}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-b-0">
            <div className="w-24 text-sm font-medium text-gray-500">{label}</div>
            <div className="flex-1 flex gap-3">
                {/* Existing (Database) option */}
                <button
                    onClick={() => onChoiceChange(field, 'existing')}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all text-left ${choice === 'existing'
                            ? 'border-blue-500 bg-blue-50 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                >
                    <span className={`text-sm ${choice === 'existing' ? 'text-blue-700 font-medium' : 'text-gray-700'}`}>
                        {existingValue}
                    </span>
                </button>

                {/* New (Import) option */}
                <button
                    onClick={() => onChoiceChange(field, 'new')}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all text-left ${choice === 'new'
                            ? 'border-blue-500 bg-blue-50 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                >
                    <span className={`text-sm ${choice === 'new' ? 'text-blue-700 font-medium' : 'text-gray-700'}`}>
                        {newValue}
                    </span>
                </button>
            </div>
        </div>
    );
};

export const MergeComparisonRow = ({
    newPlayer,
    existingPlayer,
    action,
    mergeChoices,
    onActionChange,
    onFieldChoiceChange,
    onConfirmMerge,
    isEditing = false,
    onSave,
    onCancel
}: MergeComparisonRowProps) => {
    // Local state for editing
    const [editForm, setEditForm] = useState<ExtractedPlayer>(newPlayer);

    useEffect(() => {
        setEditForm(newPlayer);
    }, [newPlayer]);

    // Helper to format values for display
    const formatValue = (field: FieldKey, existing: boolean): string => {
        if (existing && !existingPlayer) return '-';

        const player = existing ? existingPlayer : newPlayer;
        if (!player) return '-';

        switch (field) {
            case 'name':
                return player.name || '-';
            case 'number':
                return `#${player.number}`;
            case 'handedness':
                if (!player.handedness) return '-';
                return player.handedness === 'RIGHT' ? 'Right' : 'Left';
            case 'isGoalkeeper':
                return player.isGoalkeeper ? 'Yes' : 'No';
            default:
                return '-';
        }
    };

    if (action === 'skip') {
        return (
            <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl p-4 mb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-semibold text-red-900">#{newPlayer.number} {newPlayer.name}</p>
                        <p className="text-sm text-red-700">This player will be skipped</p>
                    </div>
                    <button
                        onClick={() => onActionChange('merge')}
                        className="text-sm px-4 py-2 bg-white text-blue-600 border border-blue-200 rounded-lg font-medium hover:bg-blue-50 transition-all"
                    >
                        Review
                    </button>
                </div>
            </div>
        );
    }

    if (action === 'keep') {
        return (
            <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-4 mb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-semibold text-green-900">#{newPlayer.number} {newPlayer.name}</p>
                        <p className="text-sm text-green-700">Will be created as new player</p>
                    </div>
                    <button
                        onClick={() => onActionChange('merge')}
                        className="text-sm px-4 py-2 bg-white text-blue-600 border border-blue-200 rounded-lg font-medium hover:bg-blue-50 transition-all"
                    >
                        Review
                    </button>
                </div>
            </div>
        );
    }

    // Merge mode - show comparison cards
    const fields: FieldKey[] = ['name', 'number', 'handedness', 'isGoalkeeper'];

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 mb-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
                <div>
                    <div className="text-lg font-bold text-gray-900">
                        {isEditing ? 'Edit Player' : newPlayer.name}
                        <span className="text-gray-500 font-normal ml-2">#{isEditing ? editForm.number : newPlayer.number}</span>
                    </div>
                </div>
            </div>

            {/* Column Headers */}
            {!isEditing && (
                <div className="flex items-center gap-4 mb-2 px-1">
                    <div className="w-24"></div>
                    <div className="flex-1 flex gap-3">
                        <div className="flex-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                            Database
                        </div>
                        <div className="flex-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                            Import
                        </div>
                    </div>
                </div>
            )}

            {/* Comparison Fields */}
            <div className="space-y-0">
                {fields.map((field) => (
                    <ComparisonField
                        key={field}
                        field={field}
                        existingValue={formatValue(field, true)}
                        newValue={formatValue(field, false)}
                        choice={mergeChoices.get(field)}
                        onChoiceChange={onFieldChoiceChange}
                        isEditing={isEditing}
                        editForm={editForm}
                        setEditForm={setEditForm}
                    />
                ))}
            </div>

            {/* Footer Actions */}
            <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                {isEditing ? (
                    <>
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => onSave && onSave(editForm)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
                        >
                            Save Changes
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={() => onActionChange('skip')}
                            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all"
                        >
                            Skip (Don't Import)
                        </button>
                        <button
                            onClick={() => onActionChange('keep')}
                            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all"
                        >
                            Keep Both
                        </button>
                        <button
                            onClick={onConfirmMerge}
                            disabled={mergeChoices.size < 4}
                            className={`px-5 py-2 rounded-lg font-medium transition-all ${mergeChoices.size === 4
                                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            Confirm Data
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};
