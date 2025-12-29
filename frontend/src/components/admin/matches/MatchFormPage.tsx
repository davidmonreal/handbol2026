import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { MatchTeamMigrationModal } from './MatchTeamMigrationModal';
import { useMatchTeamMigration } from './hooks/useMatchTeamMigration';
import { useMatchFormData } from './hooks/useMatchFormData';
import { MatchPreviewCard } from './MatchPreviewCard';
import { MatchFormActions } from './MatchFormActions';
import { MatchFormFields } from './MatchFormFields';
import { useMatchFormActions } from './hooks/useMatchFormActions';
import { MatchFormHeader } from './MatchFormHeader';
import { MatchFormAlerts } from './MatchFormAlerts';
import { useBackNavigation } from '../../../hooks/useBackNavigation';

export const MatchFormPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const isEditMode = !!id;
    const fromPath = (location.state as { from?: string } | undefined)?.from;
    const handleBack = useBackNavigation({
        fromPath,
        fallbackPath: '/matches',
        allowHistoryBack: true,
    });
    const {
        isLoading,
        error,
        infoMessage,
        setError,
        setInfoMessage,
        teams,
        hasEvents,
        hasVideo,
        dateValue,
        setDateValue,
        timeValue,
        setTimeValue,
        selectedHomeTeamId,
        setSelectedHomeTeamId,
        selectedAwayTeamId,
        setSelectedAwayTeamId,
        initialHomeTeamId,
        initialAwayTeamId,
        initialDateValue,
        initialTimeValue,
        initialStatus,
        initialHomeScore,
        initialAwayScore,
        status,
        setStatus,
        homeScore,
        setHomeScore,
        awayScore,
        setAwayScore,
    } = useMatchFormData({ matchId: id, isEditMode });
    const {
        shouldMigrateTeams,
        migrationPreview,
        isMigrationModalOpen,
        isMigrationPreviewLoading,
        isMigrationApplying,
        migrationError,
        goalkeeperOptions,
        selectedGoalkeepers,
        setGoalkeeperSelection,
        prepareMigrationPreview,
        applyMigration,
        cancelMigration,
    } = useMatchTeamMigration({
        matchId: id,
        isEditMode,
        status,
        initialHomeTeamId,
        initialAwayTeamId,
        selectedHomeTeamId,
        selectedAwayTeamId,
    });
    const {
        isSaving,
        isDeleting,
        isResettingClock,
        handleSave,
        handleDelete,
        handleResetClock,
        handleMigrationConfirm,
    } = useMatchFormActions({
        matchId: id,
        isEditMode,
        fromPath,
        navigate,
        teams,
        status,
        dateValue,
        timeValue,
        selectedHomeTeamId,
        selectedAwayTeamId,
        initialHomeTeamId,
        initialAwayTeamId,
        homeScore,
        awayScore,
        initialDateValue,
        initialTimeValue,
        initialStatus,
        initialHomeScore,
        initialAwayScore,
        shouldMigrateTeams,
        prepareMigrationPreview,
        applyMigration,
        setError,
        setInfoMessage,
    });


    const canResetClock = isEditMode && !hasEvents && !hasVideo;

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-lg text-gray-600">Loading...</div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <MatchFormHeader
                isEditMode={isEditMode}
                onBack={handleBack}
            />

            <MatchFormAlerts error={error} infoMessage={infoMessage} />

            {/* Form */}
            <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
                <MatchFormFields
                    teams={teams}
                    dateValue={dateValue}
                    timeValue={timeValue}
                    selectedHomeTeamId={selectedHomeTeamId}
                    selectedAwayTeamId={selectedAwayTeamId}
                    status={status}
                    homeScore={homeScore}
                    awayScore={awayScore}
                    onDateChange={setDateValue}
                    onTimeChange={setTimeValue}
                    onHomeTeamChange={setSelectedHomeTeamId}
                    onAwayTeamChange={setSelectedAwayTeamId}
                    onStatusChange={setStatus}
                    onHomeScoreChange={setHomeScore}
                    onAwayScoreChange={setAwayScore}
                />

                {/* Preview */}
                <MatchPreviewCard
                    teams={teams}
                    selectedHomeTeamId={selectedHomeTeamId}
                    selectedAwayTeamId={selectedAwayTeamId}
                    status={status}
                    homeScore={homeScore}
                    awayScore={awayScore}
                    dateValue={dateValue}
                    timeValue={timeValue}
                />

                {/* Actions */}
                <MatchFormActions
                    isEditMode={isEditMode}
                    canResetClock={canResetClock}
                    isDeleting={isDeleting}
                    isResettingClock={isResettingClock}
                    isSaving={isSaving}
                    isMigrationPreviewLoading={isMigrationPreviewLoading}
                    isMigrationApplying={isMigrationApplying}
                    onDelete={handleDelete}
                    onResetClock={handleResetClock}
                    onCancel={() => navigate('/matches')}
                    onSave={handleSave}
                />
            </div>
            <MatchTeamMigrationModal
                isOpen={isMigrationModalOpen}
                preview={migrationPreview}
                error={migrationError}
                goalkeeperOptions={goalkeeperOptions}
                selectedGoalkeepers={selectedGoalkeepers}
                onGoalkeeperChange={setGoalkeeperSelection}
                onConfirm={handleMigrationConfirm}
                onCancel={cancelMigration}
            />
        </div>
    );
};
