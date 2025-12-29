import { Save, Trash2 } from 'lucide-react';

type MatchFormActionsProps = {
    isEditMode: boolean;
    canResetClock: boolean;
    isDeleting: boolean;
    isResettingClock: boolean;
    isSaving: boolean;
    isMigrationPreviewLoading: boolean;
    isMigrationApplying: boolean;
    onDelete: () => void;
    onResetClock: () => void;
    onCancel: () => void;
    onSave: () => void;
};

export const MatchFormActions = ({
    isEditMode,
    canResetClock,
    isDeleting,
    isResettingClock,
    isSaving,
    isMigrationPreviewLoading,
    isMigrationApplying,
    onDelete,
    onResetClock,
    onCancel,
    onSave,
}: MatchFormActionsProps) => (
    <div className="flex justify-between items-center pt-4 border-t">
        {isEditMode ? (
            <div className="flex items-center gap-3">
                <button
                    onClick={onDelete}
                    disabled={isDeleting}
                    className="inline-flex items-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                    <Trash2 size={18} />
                    {isDeleting ? 'Deleting...' : 'Delete Match'}
                </button>
                {canResetClock && (
                    <button
                        onClick={onResetClock}
                        disabled={isResettingClock}
                        className="inline-flex items-center gap-2 px-4 py-2 text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors disabled:opacity-50"
                        title="Reset live clock for this match"
                    >
                        {isResettingClock ? 'Resetting...' : 'Reset Clock'}
                    </button>
                )}
            </div>
        ) : (
            <div />
        )}
        <div className="flex gap-3">
            <button
                onClick={onCancel}
                className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
            >
                Cancel
            </button>
            <button
                onClick={onSave}
                disabled={isSaving || isMigrationPreviewLoading || isMigrationApplying}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
            >
                <Save size={18} />
                {isSaving ? 'Saving...' : isEditMode ? 'Update Match' : 'Create Match'}
            </button>
        </div>
    </div>
);
