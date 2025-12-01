interface ExtractedPlayer {
    name: string;
    number: number;
    handedness?: 'left' | 'right' | 'both';
    isGoalkeeper?: boolean;
}

interface DuplicateMatch {
    id: string;
    name: string;
    number: number;
    distance: number;
    similarity: number;
    handedness?: 'left' | 'right' | 'both';
    isGoalkeeper?: boolean;
    teams?: { id: string; name: string; club: string }[];
}


interface MergeComparisonRowProps {
    newPlayer: ExtractedPlayer;
    existingPlayer: DuplicateMatch;
    playerIndex: number;
    action: 'merge' | 'skip' | 'keep' | undefined;
    mergeChoices: Map<string, 'existing' | 'new'>;
    onActionChange: (action: 'merge' | 'skip' | 'keep') => void;
    onFieldChoiceChange: (field: string, choice: 'existing' | 'new') => void;
}

export const MergeComparisonRow = ({
    newPlayer,
    existingPlayer,
    playerIndex,
    action,
    mergeChoices,
    onActionChange,
    onFieldChoiceChange,
}: MergeComparisonRowProps) => {
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
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-indigo-300 rounded-xl p-5 mb-4 shadow-md">
            {/* Header with action buttons */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-sm font-bold">
                        MERGE MODE
                    </div>
                    <div>
                        <div className="text-lg font-bold text-indigo-900">
                            {newPlayer.name} <span className="text-indigo-600">#{newPlayer.number}</span>
                        </div>
                        <div className="text-xs text-indigo-700">
                            {Math.round(existingPlayer.similarity * 100)}% similarity with existing player
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => onActionChange('skip')}
                        className="text-xs px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium shadow-sm transition-colors"
                    >
                        Skip Import
                    </button>
                    <button
                        onClick={() => onActionChange('keep')}
                        className="text-xs px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium shadow-sm transition-colors"
                    >
                        Keep Both
                    </button>
                </div>
            </div>

            {/* Existing player info */}
            {existingPlayer.teams && existingPlayer.teams.length > 0 && (
                <div className="mb-4 p-3 bg-white rounded-lg border border-indigo-200">
                    <p className="text-xs font-semibold text-indigo-900 mb-1">Existing player teams:</p>
                    <div className="flex flex-wrap gap-2">
                        {existingPlayer.teams.map((team, idx) => (
                            <span key={idx} className="text-xs px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full">
                                {team.name} ({team.club})
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <div className="text-xs font-semibold text-indigo-900 mb-2">
                ⚙️ Select which values to keep for each field:
            </div>

            {/* Comparison table */}
            <div className="bg-white rounded-lg border border-indigo-200 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-indigo-100 border-b border-indigo-200">
                            <th className="text-left py-3 px-4 font-semibold text-indigo-900">Field</th>
                            <th className="text-left py-3 px-4 font-semibold text-indigo-900">Existing (Database)</th>
                            <th className="text-left py-3 px-4 font-semibold text-indigo-900">New (Import)</th>
                            <th className="text-center py-3 px-4 font-semibold text-indigo-900">Keep</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Name */}
                        <tr className={`border-b border-indigo-100 ${mergeChoices.get('name') === 'new' ? 'bg-green-50' : 'bg-blue-50'}`}>
                            <td className="py-3 px-4 font-medium text-gray-700">Name</td>
                            <td className={`py-3 px-4 ${mergeChoices.get('name') === 'existing' ? 'font-bold text-indigo-900' : 'text-gray-600'}`}>
                                {existingPlayer.name}
                            </td>
                            <td className={`py-3 px-4 ${mergeChoices.get('name') === 'new' ? 'font-bold text-green-900' : 'text-gray-600'}`}>
                                {newPlayer.name}
                            </td>
                            <td className="py-3 px-4 text-center">
                                <div className="flex justify-center gap-4">
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input
                                            type="radio"
                                            name={`name-${playerIndex}`}
                                            checked={mergeChoices.get('name') === 'existing'}
                                            onChange={() => onFieldChoiceChange('name', 'existing')}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-xs font-medium">Existing</span>
                                    </label>
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input
                                            type="radio"
                                            name={`name-${playerIndex}`}
                                            checked={mergeChoices.get('name') === 'new'}
                                            onChange={() => onFieldChoiceChange('name', 'new')}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-xs font-medium">New</span>
                                    </label>
                                </div>
                            </td>
                        </tr>

                        {/* Number */}
                        <tr className={`border-b border-indigo-100 ${mergeChoices.get('number') === 'new' ? 'bg-green-50' : 'bg-blue-50'}`}>
                            <td className="py-3 px-4 font-medium text-gray-700">Number</td>
                            <td className={`py-3 px-4 ${mergeChoices.get('number') === 'existing' ? 'font-bold text-indigo-900' : 'text-gray-600'}`}>
                                #{existingPlayer.number}
                            </td>
                            <td className={`py-3 px-4 ${mergeChoices.get('number') === 'new' ? 'font-bold text-green-900' : 'text-gray-600'}`}>
                                #{newPlayer.number}
                            </td>
                            <td className="py-3 px-4 text-center">
                                <div className="flex justify-center gap-4">
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input
                                            type="radio"
                                            name={`number-${playerIndex}`}
                                            checked={mergeChoices.get('number') === 'existing'}
                                            onChange={() => onFieldChoiceChange('number', 'existing')}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-xs font-medium">Existing</span>
                                    </label>
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input
                                            type="radio"
                                            name={`number-${playerIndex}`}
                                            checked={mergeChoices.get('number') === 'new'}
                                            onChange={() => onFieldChoiceChange('number', 'new')}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-xs font-medium">New</span>
                                    </label>
                                </div>
                            </td>
                        </tr>

                        {/* Handedness */}
                        <tr className={`border-b border-indigo-100 ${mergeChoices.get('handedness') === 'new' ? 'bg-green-50' : 'bg-blue-50'}`}>
                            <td className="py-3 px-4 font-medium text-gray-700">Handedness</td>
                            <td className={`py-3 px-4 ${mergeChoices.get('handedness') === 'existing' ? 'font-bold text-indigo-900' : 'text-gray-600'}`}>
                                {existingPlayer.handedness || '-'}
                            </td>
                            <td className={`py-3 px-4 ${mergeChoices.get('handedness') === 'new' ? 'font-bold text-green-900' : 'text-gray-600'}`}>
                                {newPlayer.handedness || '-'}
                            </td>
                            <td className="py-3 px-4 text-center">
                                <div className="flex justify-center gap-4">
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input
                                            type="radio"
                                            name={`handedness-${playerIndex}`}
                                            checked={mergeChoices.get('handedness') === 'existing'}
                                            onChange={() => onFieldChoiceChange('handedness', 'existing')}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-xs font-medium">Existing</span>
                                    </label>
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input
                                            type="radio"
                                            name={`handedness-${playerIndex}`}
                                            checked={mergeChoices.get('handedness') === 'new'}
                                            onChange={() => onFieldChoiceChange('handedness', 'new')}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-xs font-medium">New</span>
                                    </label>
                                </div>
                            </td>
                        </tr>

                        {/* Goalkeeper */}
                        <tr className={mergeChoices.get('isGoalkeeper') === 'new' ? 'bg-green-50' : 'bg-blue-50'}>
                            <td className="py-3 px-4 font-medium text-gray-700">Goalkeeper</td>
                            <td className={`py-3 px-4 ${mergeChoices.get('isGoalkeeper') === 'existing' ? 'font-bold text-indigo-900' : 'text-gray-600'}`}>
                                {existingPlayer.isGoalkeeper ? '✓ Yes' : '✗ No'}
                            </td>
                            <td className={`py-3 px-4 ${mergeChoices.get('isGoalkeeper') === 'new' ? 'font-bold text-green-900' : 'text-gray-600'}`}>
                                {newPlayer.isGoalkeeper ? '✓ Yes' : '✗ No'}
                            </td>
                            <td className="py-3 px-4 text-center">
                                <div className="flex justify-center gap-4">
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input
                                            type="radio"
                                            name={`isGoalkeeper-${playerIndex}`}
                                            checked={mergeChoices.get('isGoalkeeper') === 'existing'}
                                            onChange={() => onFieldChoiceChange('isGoalkeeper', 'existing')}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-xs font-medium">Existing</span>
                                    </label>
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input
                                            type="radio"
                                            name={`isGoalkeeper-${playerIndex}`}
                                            checked={mergeChoices.get('isGoalkeeper') === 'new'}
                                            onChange={() => onFieldChoiceChange('isGoalkeeper', 'new')}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-xs font-medium">New</span>
                                    </label>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="mt-3 text-xs text-indigo-700 flex items-center gap-1">
                <span>💡</span>
                <span>The merged player will update the existing database record with your selected values</span>
            </div>
        </div>
    );
};
