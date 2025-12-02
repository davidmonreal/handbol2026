import type { ExtractedPlayer, DuplicateMatch } from '../../../services/playerImportService';


interface MergeComparisonRowProps {
    newPlayer: ExtractedPlayer;
    existingPlayer: DuplicateMatch;
    action: 'merge' | 'skip' | 'keep' | undefined;
    mergeChoices: Map<string, 'existing' | 'new'>;
    onActionChange: (action: 'merge' | 'skip' | 'keep') => void;
    onFieldChoiceChange: (field: string, choice: 'existing' | 'new') => void;
    onConfirmMerge: () => void;
}

export const MergeComparisonRow = ({
    newPlayer,
    existingPlayer,
    action,
    mergeChoices,
    onActionChange,
    onFieldChoiceChange,
    onConfirmMerge,
}: MergeComparisonRowProps) => {
    // ... (rest of component)

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
            {/* Header with action buttons */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                <div>
                    <div className="text-lg font-bold text-gray-900">
                        {newPlayer.name} <span className="text-gray-600">#{newPlayer.number}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => onActionChange('skip')}
                        className="text-xs px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded shadow-sm hover:shadow font-medium transition-all"
                        title="Do not import this player"
                    >
                        Skip (Don't Import)
                    </button>
                    <button
                        onClick={() => onActionChange('keep')}
                        className="text-xs px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded shadow-sm hover:shadow font-medium transition-all"
                        title="Import as a new player, creating a duplicate"
                    >
                        Keep Both (Create Duplicate)
                    </button>
                </div>
            </div>

            <p className="text-xs text-gray-600 mb-2">Click on a value to select it:</p>

            {/* Comparison table */}
            <table className="w-full text-sm border-collapse">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="text-left py-2 px-3 font-semibold text-gray-700 border border-gray-300">Field</th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-700 border border-gray-300">Existing (Database)</th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-700 border border-gray-300">New (Import)</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Name */}
                    <tr>
                        <td className="py-2 px-3 font-medium text-gray-600 border border-gray-300">Name</td>
                        <td
                            onClick={() => onFieldChoiceChange('name', 'existing')}
                            className={`py-2 px-3 cursor-pointer border border-gray-300 transition-colors ${mergeChoices.get('name') === 'existing'
                                ? 'bg-blue-100 border-blue-400 font-semibold text-gray-900'
                                : 'hover:bg-gray-50 text-gray-700'
                                }`}
                        >
                            {existingPlayer.name}
                        </td>
                        <td
                            onClick={() => onFieldChoiceChange('name', 'new')}
                            className={`py-2 px-3 cursor-pointer border border-gray-300 transition-colors ${mergeChoices.get('name') === 'new'
                                ? 'bg-blue-100 border-blue-400 font-semibold text-gray-900'
                                : 'hover:bg-gray-50 text-gray-700'
                                }`}
                        >
                            {newPlayer.name}
                        </td>
                    </tr>

                    {/* Number */}
                    <tr>
                        <td className="py-2 px-3 font-medium text-gray-600 border border-gray-300">Number</td>
                        <td
                            onClick={() => onFieldChoiceChange('number', 'existing')}
                            className={`py-2 px-3 cursor-pointer border border-gray-300 transition-colors ${mergeChoices.get('number') === 'existing'
                                ? 'bg-blue-100 border-blue-400 font-semibold text-gray-900'
                                : 'hover:bg-gray-50 text-gray-700'
                                }`}
                        >
                            #{existingPlayer.number}
                        </td>
                        <td
                            onClick={() => onFieldChoiceChange('number', 'new')}
                            className={`py-2 px-3 cursor-pointer border border-gray-300 transition-colors ${mergeChoices.get('number') === 'new'
                                ? 'bg-blue-100 border-blue-400 font-semibold text-gray-900'
                                : 'hover:bg-gray-50 text-gray-700'
                                }`}
                        >
                            #{newPlayer.number}
                        </td>
                    </tr>

                    {/* Handedness */}
                    <tr>
                        <td className="py-2 px-3 font-medium text-gray-600 border border-gray-300">Handedness</td>
                        <td
                            onClick={() => onFieldChoiceChange('handedness', 'existing')}
                            className={`py-2 px-3 cursor-pointer border border-gray-300 transition-colors ${mergeChoices.get('handedness') === 'existing'
                                ? 'bg-blue-100 border-blue-400 font-semibold text-gray-900'
                                : 'hover:bg-gray-50 text-gray-700'
                                }`}
                        >
                            {existingPlayer.handedness || '-'}
                        </td>
                        <td
                            onClick={() => onFieldChoiceChange('handedness', 'new')}
                            className={`py-2 px-3 cursor-pointer border border-gray-300 transition-colors ${mergeChoices.get('handedness') === 'new'
                                ? 'bg-blue-100 border-blue-400 font-semibold text-gray-900'
                                : 'hover:bg-gray-50 text-gray-700'
                                }`}
                        >
                            {newPlayer.handedness || '-'}
                        </td>
                    </tr>

                    {/* Goalkeeper */}
                    <tr>
                        <td className="py-2 px-3 font-medium text-gray-600 border border-gray-300">Goalkeeper</td>
                        <td
                            onClick={() => onFieldChoiceChange('isGoalkeeper', 'existing')}
                            className={`py-2 px-3 cursor-pointer border border-gray-300 transition-colors ${mergeChoices.get('isGoalkeeper') === 'existing'
                                ? 'bg-blue-100 border-blue-400 font-semibold text-gray-900'
                                : 'hover:bg-gray-50 text-gray-700'
                                }`}
                        >
                            {existingPlayer.isGoalkeeper ? 'Yes' : 'No'}
                        </td>
                        <td
                            onClick={() => onFieldChoiceChange('isGoalkeeper', 'new')}
                            className={`py-2 px-3 cursor-pointer border border-gray-300 transition-colors ${mergeChoices.get('isGoalkeeper') === 'new'
                                ? 'bg-blue-100 border-blue-400 font-semibold text-gray-900'
                                : 'hover:bg-gray-50 text-gray-700'
                                }`}
                        >
                            {newPlayer.isGoalkeeper ? 'Yes' : 'No'}
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* Confirm button */}
            <div className="mt-4 flex items-center justify-end">
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
            </div>
        </div>
    );
};
