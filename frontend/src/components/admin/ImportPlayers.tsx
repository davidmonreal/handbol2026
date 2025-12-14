import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { usePlayerImport } from '../../hooks/usePlayerImport';
import { ImageUpload } from './import/ImageUpload';
import { ImagePreview } from './import/ImagePreview';
import { CreateTeamModal } from './import/CreateTeamModal';
import { ExtractedPlayersList } from './import/ExtractedPlayersList';
import { TeamSelector } from './import/TeamSelector';

export const ImportPlayers = () => {
    const navigate = useNavigate();
    const { state, actions } = usePlayerImport();
    const [importedCount, setImportedCount] = useState<number | null>(null);

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate('/players')}
                    className="text-gray-600 hover:text-gray-900"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-3xl font-bold text-gray-800">Import Players from Image</h1>
            </div>

            {state.error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {state.error}
                </div>
            )}

            {/* TOP SECTION: Upload and Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="flex flex-col gap-4">
                    <ImageUpload
                        onImageUpload={actions.handleImageUpload}
                        isProcessing={state.isProcessing}
                    />
                    <TeamSelector
                        teams={state.teams}
                        selectedTeamId={state.selectedTeamId}
                        onTeamChange={actions.setSelectedTeamId}
                        onCreateTeam={actions.handleCreateTeam}
                        isCheckingDuplicates={state.isCheckingDuplicates}
                    />

                    {state.image && state.selectedTeamId && (
                        <button
                            onClick={actions.handleExtract}
                            disabled={state.isProcessing}
                            className="w-full bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 font-medium shadow-sm transition-colors text-lg"
                        >
                            {state.isProcessing ? (
                                'Processing...'
                            ) : (
                                'Extract Players'
                            )}
                        </button>
                    )}
                </div>

                {state.image && (
                    <ImagePreview image={state.image} />
                )}
            </div>

            {/* BOTTOM SECTION: Extracted Players (Full Width) */}
            {state.extractedPlayers.length > 0 && (
                <ExtractedPlayersList
                    extractedPlayers={state.extractedPlayers}
                    selectedTeamId={state.selectedTeamId}
                    selectedTeam={state.teams.find(t => t.id === state.selectedTeamId)}
                    duplicates={state.duplicates}
                    duplicateActions={state.duplicateActions}
                    reviewingDuplicates={state.reviewingDuplicates}
                    resolvedDuplicates={state.resolvedDuplicates}
                    mergeChoices={state.mergeChoices}
                    onUpdatePlayer={actions.handleEditClick}
                    onRemovePlayer={actions.handleRemovePlayer}
                    onClearAll={actions.handleClearAll}
                    onReviewDuplicate={actions.handleReviewDuplicate}
                    onUndoDuplicateAction={actions.handleUndoDuplicateAction}
                    onActionChange={actions.handleActionChange}
                    onFieldChoiceChange={actions.handleFieldChoiceChange}
                    onConfirmMerge={actions.handleConfirmMerge}
                    onConfirmImport={() => actions.handleConfirmImport((_summary, count) => {
                        setImportedCount(count);
                        actions.setImage(null); // hide preview after final import
                        // Optional: scrollToBottom or ensure button is visible
                    })}
                    importedCount={importedCount}
                    onGoToPlayers={() => navigate('/players')}
                    isProcessing={state.isProcessing}
                    // Edit Props
                    editingPlayerIndex={state.editingPlayerIndex}
                    onSaveEditedPlayer={actions.handleSaveEditedPlayer}
                    onCancelEdit={actions.handleCancelEdit}
                />
            )}

            <CreateTeamModal
                isOpen={state.isCreateTeamModalOpen}
                onClose={() => actions.setIsCreateTeamModalOpen(false)}
                onSubmit={actions.handleSubmitCreateTeam}
                initialTeamName={state.newTeamName}
                applyTitleCase={false}
            />
        </div>
    );
};
