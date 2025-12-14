import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { usePlayerForm } from '../../../hooks/usePlayerForm';
import { PlayerBasicInfo } from './PlayerBasicInfo';
import { PlayerAttributes } from './PlayerAttributes';
import { PlayerTeamManager } from './PlayerTeamManager';

export const PlayerFormPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const navigationState = (location.state || {}) as {
        from?: string;
        preselectClubId?: string | null;
        preselectCategory?: string;
        preselectTeamId?: string | null;
    };
    const backTo = navigationState.from || '/players';
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
    const [selectedCategory, setSelectedCategory] = useState<string>(navigationState.preselectCategory ?? 'SENIOR');
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(navigationState.preselectTeamId ?? null);

    // Fetch team players when selection changes to check for number collisions
    useEffect(() => {
        if (selectedTeamId) {
            handlers.fetchTeamPlayers(selectedTeamId);
        }
    }, [selectedTeamId, handlers]); // handlers.fetchTeamPlayers is stable

    const teamCollision = formData.number !== '' && data.currentTeamPlayers
        ? data.currentTeamPlayers.find((p: any) => p.player?.number === Number(formData.number))
        : null;

    const handleSave = async () => {
        try {
            await handlers.savePlayer(selectedTeamId);
            navigate(backTo);
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
                <button onClick={() => navigate('/players')} className="mt-4 text-indigo-600 hover:underline">
                    Back to Players
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
                        onClick={() => navigate(backTo)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft className="text-gray-600" size={24} />
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {isEditMode ? 'Edit Player' : 'New Player'}
                    </h1>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving || (!isEditMode && duplicateState.hasWarning) || !!teamCollision}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium shadow-sm"
                >
                    {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                    {isSaving ? 'Saving...' : 'Save Player'}
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="p-8 space-y-8">
                    {/* Basic Info Section */}
                    <section>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            Basic Information
                        </h2>
                        <PlayerBasicInfo
                            name={formData.name}
                            number={formData.number}
                            onNameChange={handlers.setName}
                            onNumberChange={handlers.setNumber}
                            isEditMode={isEditMode}
                            duplicateState={duplicateState}
                            onIgnoreMatch={handlers.ignoreMatch}
                        />
                    </section>

                    <hr className="border-gray-100" />

                    {/* Attributes Section */}
                    <section>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            Attributes
                        </h2>
                        <PlayerAttributes
                            handedness={formData.handedness}
                            isGoalkeeper={formData.isGoalkeeper}
                            onHandednessChange={handlers.setHandedness}
                            onIsGoalkeeperChange={handlers.setIsGoalkeeper}
                        />
                    </section>

                    <hr className="border-gray-100" />

                    {/* Team Assignment Section */}
                    <section>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            Team Assignment
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
                            onSelectedClubChange={setSelectedClubId}
                            onSelectedCategoryChange={setSelectedCategory}
                            onSelectedTeamChange={setSelectedTeamId}
                            collision={teamCollision}
                        />
                    </section>
                </div>
            </div>
        </div>
    );
};
