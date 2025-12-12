import { PlayerCard } from './PlayerCard';
import { MergeComparisonRow } from './MergeComparisonRow';
import type { ExtractedPlayer, DuplicateInfo } from '../../../services/playerImportService';

interface ExtractedPlayersListProps {
    extractedPlayers: ExtractedPlayer[];
    selectedTeamId: string | null;
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
    // Edit Props
    editingPlayerIndex: number | null;
    onSaveEditedPlayer: (player: ExtractedPlayer) => void;
    onCancelEdit: () => void;
    // Success State Props
    importedCount: number | null;
    onGoToPlayers: () => void;
}

export const ExtractedPlayersList = ({
    extractedPlayers,
    selectedTeamId,
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
    editingPlayerIndex,
    onSaveEditedPlayer,
    onCancelEdit,
    importedCount,
    onGoToPlayers
}: ExtractedPlayersListProps) => {

    // If import is successful, only show the success header/button or maybe just the container?
    // User said "List must disappear". We'll keep the container but empty the list, and show the Success Button.

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">
                    {importedCount !== null
                        ? 'Importació Completada'
                        : `Extracted Players (${extractedPlayers.length})`}
                </h2>
                {!importedCount && (
                    <button
                        onClick={onClearAll}
                        className="text-sm text-gray-600 hover:text-gray-900"
                    >
                        Clear all
                    </button>
                )}
            </div>

            <div className="mt-6 space-y-4">
                {!importedCount && extractedPlayers.map((player, index) => {
                    const duplicate = duplicates.get(index);
                    const isReviewing = reviewingDuplicates.get(index);
                    const playerMergeChoices = mergeChoices.get(index) || new Map();
                    const action = duplicateActions.get(index);
                    const isResolved = resolvedDuplicates.has(index);
                    const isEditing = editingPlayerIndex === index;

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

                    // If editing, show inline editor
                    if (isEditing) {
                        return (
                            <MergeComparisonRow
                                key={index}
                                newPlayer={player}
                                existingPlayer={null}
                                action={undefined}
                                mergeChoices={new Map()}
                                onActionChange={() => { }}
                                onFieldChoiceChange={() => { }}
                                onConfirmMerge={() => { }}
                                isEditing={true}
                                onSave={onSaveEditedPlayer}
                                onCancel={onCancelEdit}
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

            {importedCount !== null ? (
                <button
                    onClick={onGoToPlayers}
                    className="w-full mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold text-lg animate-fade-in"
                >
                    {`Importació correcte! (${importedCount} jugadors). Anar a la llista.`}
                </button>
            ) : (
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
            )}
        </div>
    );
};
