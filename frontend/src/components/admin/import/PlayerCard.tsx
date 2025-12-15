import { Edit2, X, AlertTriangle } from 'lucide-react';

import type { ExtractedPlayer } from '../../../services/playerImportService';

interface PlayerCardProps {
    player: ExtractedPlayer;
    onDelete: () => void;
    onEdit: (player: ExtractedPlayer) => void;
    duplicate?: {
        hasDuplicates: boolean;
        matches: any[];
    };
    duplicateAction?: 'merge' | 'skip' | 'keep';
    onReviewDuplicate: () => void;
    onUndoDuplicateAction?: () => void;
    resolvedDuplicate?: boolean;
}

export const PlayerCard = ({
    player,
    onDelete,
    onEdit,
    duplicate,
    duplicateAction,
    onReviewDuplicate,
    onUndoDuplicateAction,
    resolvedDuplicate = false,
}: PlayerCardProps) => {
    const handleEdit = () => {
        if (duplicate && duplicate.hasDuplicates) {
            onReviewDuplicate();
        } else {
            onEdit(player);
        }
    };

    return (
        <div className={`bg-white border rounded-lg p-3 flex items-center justify-between shadow-sm ${duplicateAction === 'skip' ? 'opacity-60 bg-gray-50' : ''}`}>
            <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 font-bold rounded-full text-sm">
                    {player.number}
                </div>
                <div className="font-medium text-gray-900 min-w-[150px]">
                    {player.name}
                </div>
                <div className="text-sm text-gray-500 flex gap-4">
                    <span>{player.handedness ? player.handedness.charAt(0) + player.handedness.slice(1).toLowerCase() + '-handed' : '-'}</span>
                    <span>{player.isGoalkeeper ? 'Goalkeeper' : 'Player'}</span>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {/* Duplicate Status / Review Button */}
                {duplicate && duplicate.hasDuplicates && (
                    <div className="mr-2">
                        {!duplicateAction && !resolvedDuplicate ? (
                            <button
                                onClick={onReviewDuplicate}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md hover:bg-amber-100 transition-colors text-sm font-medium shadow-sm"
                            >
                                <AlertTriangle className="w-4 h-4" />
                                Review Duplicate
                            </button>
                        ) : duplicateAction === 'skip' ? (
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded border border-red-200">
                                    Skipped
                                </span>
                                {onUndoDuplicateAction && (
                                    <button onClick={onUndoDuplicateAction} className="text-xs text-gray-400 hover:text-gray-600 underline">Undo</button>
                                )}
                            </div>
                        ) : duplicateAction === 'keep' ? (
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded border border-green-200">
                                    Create New
                                </span>
                                {onUndoDuplicateAction && (
                                    <button onClick={onUndoDuplicateAction} className="text-xs text-gray-400 hover:text-gray-600 underline">Undo</button>
                                )}
                            </div>
                        ) : resolvedDuplicate ? (
                            <span className="px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded border border-green-200">
                                Merge Ready
                            </span>
                        ) : null}
                    </div>
                )}

                {/* Edit or Review button */}
                {(!duplicate || !duplicate.hasDuplicates || resolvedDuplicate) && (
                    <button
                        onClick={handleEdit}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title={duplicate && duplicate.hasDuplicates ? 'Review merge' : 'Edit player'}
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                )}

                {/* Delete button */}
                <button
                    onClick={onDelete}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Remove player"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
