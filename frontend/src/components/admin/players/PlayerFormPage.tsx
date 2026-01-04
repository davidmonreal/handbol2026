import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { usePlayerForm } from '../../../hooks/usePlayerForm';
import { PlayerBasicInfo } from './PlayerBasicInfo';
import { PlayerAttributes } from './PlayerAttributes';
import { PlayerTeamManager } from './PlayerTeamManager';
import { TEAM_CATEGORIES } from '../../../utils/teamUtils';
import { DEFAULT_FIELD_POSITION, PLAYER_POSITIONS } from '../../../constants/playerPositions';
import type { PlayerPositionId } from '../../../constants/playerPositions';
import { useSafeTranslation } from '../../../context/LanguageContext';
import { useBackNavigation } from '../../../hooks/useBackNavigation';

export const PlayerFormPage = () => {
    const { id } = useParams();
    const location = useLocation();
    const { t } = useSafeTranslation();
    const navigationState = (location.state || {}) as {
        from?: string;
        preselectClubId?: string | null;
        preselectCategory?: string;
        preselectTeamId?: string | null;
    };
    const handleBack = useBackNavigation({
        fromPath: navigationState.from,
        fallbackPath: '/players',
    });
    const isEditMode = !!id;

    const {
        isLoading,
        isSaving,
        error,
        formData,
        data,
        duplicateState,
        handlers
    } = usePlayerForm(id);

    // State for Team Selection (Managed here to pass to save)
    const [selectedClubId, setSelectedClubId] = useState<string | null>(navigationState.preselectClubId ?? null);
    const [selectedCategory, setSelectedCategory] = useState<string>(
        navigationState.preselectCategory ?? TEAM_CATEGORIES[0]
    );
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(navigationState.preselectTeamId ?? null);
    const [selectedPosition, setSelectedPosition] = useState<PlayerPositionId>(
        formData.isGoalkeeper ? PLAYER_POSITIONS[0].id : DEFAULT_FIELD_POSITION
    );
    const [selectedNumber, setSelectedNumber] = useState<number | ''>('');
    const [acceptedConflictKey, setAcceptedConflictKey] = useState<string | null>(null);

    const handleSelectedTeamChange = (teamId: string | null) => {
        setSelectedTeamId(teamId);
        setSelectedNumber('');
        setAcceptedConflictKey(null);
    };

    // Fetch team players when selection changes to check for number collisions
    useEffect(() => {
        if (selectedTeamId) {
            handlers.fetchTeamPlayers(selectedTeamId);
        }
    }, [selectedTeamId, handlers]); // handlers.fetchTeamPlayers is stable

    const teamCollision = selectedNumber !== '' && data.currentTeamPlayers
        ? data.currentTeamPlayers.find((p) => p?.number === Number(selectedNumber)) ?? null
        : null;
    const collisionKey = teamCollision?.player
        ? `${teamCollision.player.id}:${teamCollision.number ?? 0}:${selectedTeamId ?? ''}`
        : null;
    const acceptNumberConflict = Boolean(collisionKey && acceptedConflictKey === collisionKey);
    const handleAcceptNumberConflictChange = (checked: boolean) => {
        setAcceptedConflictKey(checked ? collisionKey : null);
    };

    const handleSave = async () => {
        try {
            await handlers.savePlayer(selectedTeamId, selectedPosition, selectedNumber === '' ? null : selectedNumber);
            handleBack();
        } catch (err) {
            console.error(err);
            // Error is handled in hook state usually, but validaton errors might throw
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-3xl mx-auto p-6">
                <div className="bg-red-50 text-red-600 p-4 rounded-lg">
                    {error}
                </div>
                <button onClick={handleBack} className="mt-4 text-indigo-600 hover:underline">
                    {t('playerForm.backToPlayers')}
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleBack}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft className="text-gray-600" size={24} />
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {isEditMode ? t('playerForm.editTitle') : t('playerForm.newTitle')}
                    </h1>
                </div>
                <button
                    onClick={handleSave}
                    disabled={
                        isSaving ||
                        (!isEditMode && duplicateState.hasWarning) ||
                        (Boolean(teamCollision) && !acceptNumberConflict) ||
                        (Boolean(selectedTeamId) && selectedNumber === '')
                    }
                    className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium shadow-sm"
                >
                    {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                    {isSaving ? t('playerForm.savingButton') : t('playerForm.saveButton')}
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="p-8 space-y-8">
                    {/* Basic Info Section */}
                    <section>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            {t('playerForm.basicInfoTitle')}
                        </h2>
                        <PlayerBasicInfo
                            name={formData.name}
                            onNameChange={handlers.setName}
                            isEditMode={isEditMode}
                            duplicateState={duplicateState}
                            onIgnoreMatch={handlers.ignoreMatch}
                        />
                    </section>

                    <hr className="border-gray-100" />

                    {/* Attributes Section */}
                    <section>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            {t('playerForm.attributesTitle')}
                        </h2>
                        <PlayerAttributes
                            handedness={formData.handedness}
                            onHandednessChange={handlers.setHandedness}
                        />
                    </section>

                    <hr className="border-gray-100" />

                    {/* Team Assignment Section */}
                    <section>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            {t('playerForm.teamAssignmentTitle')}
                        </h2>
                        <PlayerTeamManager
                            clubs={data.clubs}
                            teams={data.teams}
                            seasons={data.seasons}
                            playerTeams={data.playerTeams}
                            isEditMode={isEditMode}
                            onCreateClub={handlers.createClub}
                            onCreateTeam={handlers.createTeam}
                            onRemoveTeam={handlers.removeTeam}
                            selectedClubId={selectedClubId}
                            selectedCategory={selectedCategory}
                            selectedTeamId={selectedTeamId}
                            selectedPosition={selectedPosition}
                            selectedNumber={selectedNumber}
                            onSelectedClubChange={setSelectedClubId}
                            onSelectedCategoryChange={setSelectedCategory}
                            onSelectedTeamChange={handleSelectedTeamChange}
                            onSelectedPositionChange={setSelectedPosition}
                            onSelectedNumberChange={setSelectedNumber}
                            onUpdateTeamPosition={handlers.updateTeamPosition}
                            onUpdateTeamNumber={handlers.updateTeamNumber}
                            collision={teamCollision}
                            acceptNumberConflict={acceptNumberConflict}
                            onAcceptNumberConflictChange={handleAcceptNumberConflictChange}
                        />
                    </section>
                </div>
            </div>
        </div>
    );
};
