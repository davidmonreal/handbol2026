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

    if (action === 'skip') {
        return (
            <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-semibold text-red-900">#{newPlayer.number} {newPlayer.name}</p>
                        <p className="text-sm text-red-700">This player will be skipped</p>
                    </div>
                    <button
                        onClick={() => onActionChange('merge')}
                        className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Review
                    </button>
                </div>
            </div>
        );
    }

    if (action === 'keep') {
        return (
            <div className="bg-green-50 border border-green-200 rounded p-3 mb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-semibold text-green-900">#{newPlayer.number} {newPlayer.name}</p>
                        <p className="text-sm text-green-700">Will be created as new player</p>
                    </div>
                    <button
                        onClick={() => onActionChange('merge')}
                        className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Review
                    </button>
                </div>
            </div>
        );
    }

    // Merge mode - show comparison table
    return (
        <div className="bg-white border-2 border-gray-300 rounded-lg p-4 mb-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                <div>
                    <div className="text-lg font-bold text-gray-900">
                        {isEditing ? 'Edit Player' : newPlayer.name} <span className="text-gray-600">#{isEditing ? editForm.number : newPlayer.number}</span>
                    </div>
                </div>
            </div>

            {!isEditing && <p className="text-xs text-gray-600 mb-2">Click on a value to select it:</p>}

            {/* Comparison table */}
            <table className="w-full text-sm border-collapse">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="text-left py-2 px-3 font-semibold text-gray-700 border border-gray-300 w-1/4">Field</th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-700 border border-gray-300 w-1/3">Existing (Database)</th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-700 border border-gray-300 w-1/3">New (Import)</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Name */}
                    <tr>
                        <td className="py-2 px-3 font-medium text-gray-600 border border-gray-300">Name</td>
                        <td className="py-2 px-3 text-gray-400 italic border border-gray-300">
                            {existingPlayer ? existingPlayer.name : '-'}
                        </td>
                        <td
                            onClick={() => !isEditing && onFieldChoiceChange('name', 'new')}
                            className={`py-2 px-3 border border-gray-300 transition-colors ${!isEditing && mergeChoices.get('name') === 'new'
                                ? 'bg-blue-100 border-blue-400 font-semibold text-gray-900'
                                : !isEditing ? 'hover:bg-gray-50 text-gray-700 cursor-pointer' : ''
                                }`}
                        >
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                            ) : newPlayer.name}
                        </td>
                    </tr>

                    {/* Number */}
                    <tr>
                        <td className="py-2 px-3 font-medium text-gray-600 border border-gray-300">Number</td>
                        <td className="py-2 px-3 text-gray-400 italic border border-gray-300">
                            {existingPlayer ? `#${existingPlayer.number}` : '-'}
                        </td>
                        <td
                            onClick={() => !isEditing && onFieldChoiceChange('number', 'new')}
                            className={`py-2 px-3 border border-gray-300 transition-colors ${!isEditing && mergeChoices.get('number') === 'new'
                                ? 'bg-blue-100 border-blue-400 font-semibold text-gray-900'
                                : !isEditing ? 'hover:bg-gray-50 text-gray-700 cursor-pointer' : ''
                                }`}
                        >
                            {isEditing ? (
                                <input
                                    type="number"
                                    value={editForm.number}
                                    onChange={(e) => setEditForm({ ...editForm, number: parseInt(e.target.value) || 0 })}
                                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                            ) : `#${newPlayer.number}`}
                        </td>
                    </tr>

                    {/* Handedness */}
                    <tr>
                        <td className="py-2 px-3 font-medium text-gray-600 border border-gray-300">Handedness</td>
                        <td className="py-2 px-3 text-gray-400 italic border border-gray-300">
                            {existingPlayer ? (existingPlayer.handedness || '-') : '-'}
                        </td>
                        <td
                            onClick={() => !isEditing && onFieldChoiceChange('handedness', 'new')}
                            className={`py-2 px-3 border border-gray-300 transition-colors ${!isEditing && mergeChoices.get('handedness') === 'new'
                                ? 'bg-blue-100 border-blue-400 font-semibold text-gray-900'
                                : !isEditing ? 'hover:bg-gray-50 text-gray-700 cursor-pointer' : ''
                                }`}
                        >
                            {isEditing ? (
                                <select
                                    value={editForm.handedness || ''}
                                    onChange={(e) => setEditForm({ ...editForm, handedness: e.target.value as any || undefined })}
                                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="">Unknown</option>
                                    <option value="RIGHT">Right</option>
                                    <option value="LEFT">Left</option>
                                </select>
                            ) : (newPlayer.handedness || '-')}
                        </td>
                    </tr>

                    {/* Goalkeeper */}
                    <tr>
                        <td className="py-2 px-3 font-medium text-gray-600 border border-gray-300">Goalkeeper</td>
                        <td className="py-2 px-3 text-gray-400 italic border border-gray-300">
                            {existingPlayer ? (existingPlayer.isGoalkeeper ? 'Yes' : 'No') : '-'}
                        </td>
                        <td
                            onClick={() => !isEditing && onFieldChoiceChange('isGoalkeeper', 'new')}
                            className={`py-2 px-3 border border-gray-300 transition-colors ${!isEditing && mergeChoices.get('isGoalkeeper') === 'new'
                                ? 'bg-blue-100 border-blue-400 font-semibold text-gray-900'
                                : !isEditing ? 'hover:bg-gray-50 text-gray-700 cursor-pointer' : ''
                                }`}
                        >
                            {isEditing ? (
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={editForm.isGoalkeeper || false}
                                        onChange={(e) => setEditForm({ ...editForm, isGoalkeeper: e.target.checked })}
                                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    />
                                    <span className="ml-2 text-gray-700">{editForm.isGoalkeeper ? 'Yes' : 'No'}</span>
                                </div>
                            ) : (newPlayer.isGoalkeeper ? 'Yes' : 'No')}
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* Footer Actions */}
            <div className="mt-4 flex items-center justify-end gap-3">
                {isEditing ? (
                    <>
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded shadow-sm hover:shadow font-medium transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => onSave && onSave(editForm)}
                            className="px-4 py-2 bg-blue-600 text-white rounded font-medium shadow-sm hover:bg-blue-700 hover:shadow transition-all"
                        >
                            Save Changes
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={() => onActionChange('skip')}
                            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded shadow-sm hover:shadow font-medium transition-all"
                        >
                            Skip (Don't Import)
                        </button>
                        <button
                            onClick={() => onActionChange('keep')}
                            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded shadow-sm hover:shadow font-medium transition-all"
                        >
                            Keep Both
                        </button>
                        <button
                            onClick={onConfirmMerge}
                            disabled={mergeChoices.size < 4}
                            className={`px-4 py-2 rounded font-medium shadow-sm transition-all ${mergeChoices.size === 4
                                ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow'
                                : 'bg-white border border-gray-300 text-gray-400 cursor-not-allowed'
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
