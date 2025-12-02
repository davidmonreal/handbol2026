import { TeamSelector } from './TeamSelector';
import { PlayerCard } from './PlayerCard';
import { MergeComparisonRow } from './MergeComparisonRow';
import type { ExtractedPlayer, DuplicateInfo } from '../../../services/playerImportService';
import type { Team } from '../../../types';

interface ExtractedPlayersListProps {
    extractedPlayers: ExtractedPlayer[];
    teams: Team[];
    selectedTeamId: string | null;
    onTeamChange: (id: string | null) => void;
    onCreateTeam: (teamName: string) => void;
    duplicates: Map<number, DuplicateInfo>;
    duplicateActions: Map<number, 'merge' | 'skip' | 'keep'>;
    reviewingDuplicates: Map<number, boolean>;
    resolvedDuplicates: Set<number>;
    mergeChoices: Map<number, Map<string, 'existing' | 'new'>>;
    onUpdatePlayer: (index: number, player: ExtractedPlayer) => void;
    onRemovePlayer: (index: number) => void;
    onClearAll: () => void;
    onReviewDuplicate: (index: number) => void;
    onUndoDuplicateAction: (index: number) => void;
    onActionChange: (index: number, action: 'merge' | 'skip' | 'keep') => void;
    onFieldChoiceChange: (index: number, field: string, choice: 'existing' | 'new') => void;
    onConfirmMerge: (index: number) => void;
    onConfirmImport: () => void;
    isProcessing: boolean;
    isCheckingDuplicates: boolean;
}

export const ExtractedPlayersList = ({
    extractedPlayers,
    teams,
    selectedTeamId,
    onTeamChange,
    onCreateTeam,
    duplicates,
    duplicateActions,
    reviewingDuplicates,
    resolvedDuplicates,
    mergeChoices,
    onUpdatePlayer,
    onRemovePlayer,
    onClearAll,
    onReviewDuplicate,
    onUndoDuplicateAction,
    onActionChange,
    onFieldChoiceChange,
    onConfirmMerge,
    onConfirmImport,
    isProcessing,
    isCheckingDuplicates
}: ExtractedPlayersListProps) => {
    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">
                    Extracted Players ({extractedPlayers.length})
                </h2>
                <button
                    onClick={onClearAll}
                    className="text-sm text-gray-600 hover:text-gray-900"
                >
                    Clear all
                </button>
            </div>

            <TeamSelector
                teams={teams}
                selectedTeamId={selectedTeamId}
                onTeamChange={onTeamChange}
                onCreateTeam={onCreateTeam}
                isCheckingDuplicates={isCheckingDuplicates}
            />

            <div className="mt-6 space-y-4">
                {extractedPlayers.map((player, index) => {
                    const duplicate = duplicates.get(index);
                    const isReviewing = reviewingDuplicates.get(index);
                    const playerMergeChoices = mergeChoices.get(index) || new Map();
                    const action = duplicateActions.get(index);
                    const isResolved = resolvedDuplicates.has(index);

                    // If reviewing duplicate, show comparison
                    if (isReviewing && duplicate && duplicate.hasDuplicates && !isResolved) {
                        return (
                            <MergeComparisonRow
                                key={index}
                                newPlayer={player}
                                existingPlayer={duplicate.matches[0]}
                                action={action}
                                mergeChoices={playerMergeChoices}
                                onActionChange={(newAction) => onActionChange(index, newAction)}
                                onFieldChoiceChange={(field, choice) => onFieldChoiceChange(index, field, choice)}
                                onConfirmMerge={() => onConfirmMerge(index)}
                            />
                        );
                    }

                    // Otherwise show regular player card
                    return (
                        <PlayerCard
                            key={index}
                            player={player}
                            onDelete={() => onRemovePlayer(index)}
                            onEdit={(updatedPlayer) => onUpdatePlayer(index, updatedPlayer)}
                            duplicate={isResolved ? undefined : duplicate}
                            duplicateAction={action}
                            onReviewDuplicate={() => onReviewDuplicate(index)}
                            onUndoDuplicateAction={() => onUndoDuplicateAction(index)}
                        />
                    );
                })}
            </div>

            <button
                onClick={onConfirmImport}
                disabled={!selectedTeamId || isProcessing || (duplicates.size > 0 && duplicates.size !== duplicateActions.size)}
                className="w-full mt-6 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isProcessing ? 'Importing...' : !selectedTeamId ? 'Select Team First' :
                    (duplicates.size > 0 && duplicates.size !== duplicateActions.size) ?
                        `Resolve ${duplicates.size - duplicateActions.size} Duplicates` :
                        `Import ${extractedPlayers.filter((_, i) => duplicateActions.get(i) !== 'skip').length} Players`}
            </button>
        </div>
    );
};
