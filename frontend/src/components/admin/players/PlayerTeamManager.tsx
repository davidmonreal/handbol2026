import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { SearchableSelectWithCreate } from '../../common/SearchableSelectWithCreate';
import { TeamCreationModal } from './TeamCreationModal';
import { ConfirmationModal } from '../../common';
import { toTitleCase } from '../../../utils/textUtils';
import { TEAM_CATEGORIES } from '../../../utils/teamUtils';
import type { Club, Team, Season } from '../../../types';
import { PLAYER_POSITIONS } from '../../../constants/playerPositions';
import type { PlayerPositionId } from '../../../constants/playerPositions';
import { useSafeTranslation } from '../../../context/LanguageContext';
import { DropdownSelect } from '../../common/DropdownSelect';
import type { Player } from '../../../types';

interface PlayerTeamEntry {
    id?: string;
    team: Pick<Team, 'id' | 'name' | 'category' | 'club'>;
    position?: number;
    player?: Player;
}

interface PlayerTeamManagerProps {
    clubs: Club[];
    teams: Team[];
    seasons: Season[];
    playerTeams: PlayerTeamEntry[];
    isEditMode: boolean;
    // Handlers
    onCreateClub: (name: string) => Promise<Club | undefined>;
    onCreateTeam: (data: Partial<Team> & { clubId: string; seasonId: string }) => Promise<Team>;
    onRemoveTeam: (teamId: string) => Promise<void>;
    // Selection State (managed by parent or local? Let's Manage Local for selection)
    selectedClubId: string | null;
    selectedCategory: string;
    selectedTeamId: string | null;
    selectedPosition: PlayerPositionId;
    onSelectedClubChange: (id: string | null) => void;
    onSelectedCategoryChange: (cat: string) => void;
    onSelectedTeamChange: (id: string | null) => void;
    onSelectedPositionChange: (pos: PlayerPositionId) => void;
    onUpdateTeamPosition: (teamId: string, position: PlayerPositionId) => Promise<void>;
    collision: { player?: Player } | null;
    acceptNumberConflict: boolean;
    onAcceptNumberConflictChange: (value: boolean) => void;
}

export const PlayerTeamManager: React.FC<PlayerTeamManagerProps> = ({
    clubs,
    teams,
    seasons,
    playerTeams,
    isEditMode,
    onCreateClub,
    onCreateTeam,
    onRemoveTeam,
    selectedClubId,
    selectedCategory,
    selectedTeamId,
    selectedPosition,
    onSelectedClubChange,
    onSelectedCategoryChange,
    onSelectedTeamChange,
    onSelectedPositionChange,
    onUpdateTeamPosition,
    collision,
    acceptNumberConflict,
    onAcceptNumberConflictChange
}) => {
    const { t } = useSafeTranslation();
    // UI State
    const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
    const [createClubConfirmation, setCreateClubConfirmation] = useState<{ isOpen: boolean; clubName: string | null }>({
        isOpen: false,
        clubName: null,
    });
    const [removeTeamConfirmation, setRemoveTeamConfirmation] = useState<{ isOpen: boolean; teamId: string | null }>({
        isOpen: false,
        teamId: null,
    });

    // Derived State
    const filteredTeams = teams.filter(t =>
        t.club?.id === selectedClubId &&
        (t.category || TEAM_CATEGORIES[0]) === selectedCategory
    );

    // Handlers
    const handleCreateClubRequest = async (name: string) => {
        setCreateClubConfirmation({ isOpen: true, clubName: name });
    };

    const confirmCreateClub = async () => {
        if (createClubConfirmation.clubName) {
            const newClub = await onCreateClub(createClubConfirmation.clubName);
            if (newClub) {
                onSelectedClubChange(newClub.id);
            }
        }
        setCreateClubConfirmation({ isOpen: false, clubName: null });
    };

    const handleCreateTeamRequest = () => {
        setIsTeamModalOpen(true);
        // Note: Name is passed to modal via specialized prop if needed, or user re-types
        // For simplicity, we just open the modal.
    };

    const confirmRemoveTeam = async () => {
        if (removeTeamConfirmation.teamId) {
            await onRemoveTeam(removeTeamConfirmation.teamId);
        }
        setRemoveTeamConfirmation({ isOpen: false, teamId: null });
    };

    const positionOptions = PLAYER_POSITIONS.map((pos) => ({
        value: pos.id,
        label: t(pos.tKey),
    }));

    return (
        <div>
            {/* Current Teams List - Badge Style */}
            {isEditMode && playerTeams && playerTeams.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Current Teams</h3>
                    <div className="flex flex-wrap gap-2">
                        {playerTeams.map((pt) => {
                            if (!pt.team) return null;
                            return (
                                <div
                                    key={pt.team.id}
                                    className="inline-flex items-center gap-3 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-lg group hover:shadow-sm transition-all"
                                >
                                    <span className="text-sm">
                                        <span className="font-semibold text-indigo-900">{pt.team.club?.name}</span>
                                        {' '}
                                        <span className="text-indigo-700">{toTitleCase(pt.team.category || TEAM_CATEGORIES[0])}</span>
                                        {' '}
                                        <span className="text-indigo-600">{pt.team.name}</span>
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <DropdownSelect
                                            label={null}
                                            options={positionOptions}
                                            value={pt.position ?? 0}
                                            onChange={(val) => {
                                                const next = (val ?? 0) as PlayerPositionId;
                                                onUpdateTeamPosition(pt.team.id, next).catch((err) => {
                                                    console.error('Failed to update position', err);
                                                    alert(err instanceof Error ? err.message : 'Failed to update position');
                                                });
                                            }}
                                            placeholder={t('positions.unset')}
                                            buttonClassName="text-sm font-normal text-gray-800"
                                        />
                                    </div>
                                    <button
                                        onClick={() => setRemoveTeamConfirmation({ isOpen: true, teamId: pt.team.id })}
                                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                        title="Remove from team"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <h3 className="text-sm font-medium text-gray-700 mb-3">Add to Team</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SearchableSelectWithCreate
                    label="Club"
                    value={selectedClubId}
                    options={clubs.map(c => ({ value: c.id, label: c.name }))}
                    onChange={(val) => {
                        onSelectedClubChange(val);
                        onSelectedTeamChange(null);
                    }}
                    onCreate={handleCreateClubRequest}
                    placeholder="Select or create..."
                />

                <SearchableSelectWithCreate
                    label="Category"
                    value={selectedCategory}
                    options={Array.from(new Set([
                        ...TEAM_CATEGORIES,
                        ...teams.map(t => t.category || TEAM_CATEGORIES[0])
                    ])).map(cat => ({
                        value: cat,
                        label: toTitleCase(cat)
                    }))}
                    onChange={(val) => {
                        onSelectedCategoryChange(val);
                        onSelectedTeamChange(null);
                    }}
                    onCreate={(val) => {
                        onSelectedCategoryChange(val);
                        onSelectedTeamChange(null);
                    }}
                    placeholder="Select category..."
                />

                <SearchableSelectWithCreate
                    label="Team"
                    value={selectedTeamId}
                    options={filteredTeams.map(t => ({
                        value: t.id,
                        label: t.name
                    }))}
                    onChange={onSelectedTeamChange}
                    onCreate={handleCreateTeamRequest}
                    placeholder={selectedClubId ? "Select or create..." : "Select club first"}
                    disabled={!selectedClubId}
                />
            </div>
            <div className="mt-4 max-w-xs">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('positions.label')}</label>
                <DropdownSelect
                    options={positionOptions}
                    value={selectedPosition}
                    onChange={(val) => onSelectedPositionChange((val ?? 0) as PlayerPositionId)}
                    placeholder={t('positions.unset')}
                />
            </div>
            <p className="text-sm text-gray-500 mt-2">
                Select club and category to see available teams. You can create new clubs and teams directly from the dropdowns.
            </p>

            {collision && collision.player && selectedTeamId && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 flex items-start gap-2 animate-fadeIn">
                    <span className="font-bold flex-shrink-0">⚠️ Number Conflict:</span>
                    <div>
                        Player <strong>{collision.player.name}</strong> already holds number <strong>{collision.player.number}</strong> in this team.
                    </div>
                </div>
            )}
            {collision && collision.player && selectedTeamId && (
                <label className="mt-2 inline-flex items-center gap-2 text-sm text-gray-700">
                    <input
                        type="checkbox"
                        checked={acceptNumberConflict}
                        onChange={(event) => onAcceptNumberConflictChange(event.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>{t('playerTeam.acceptNumberConflict')}</span>
                </label>
            )}

            {/* Modals */}
            <TeamCreationModal
                isOpen={isTeamModalOpen}
                onClose={() => setIsTeamModalOpen(false)}
                clubs={clubs}
                seasons={seasons}
                initialClubId={selectedClubId}
                initialCategory={selectedCategory}
                onCreateClub={onCreateClub}
                onCreateTeam={async (data) => {
                    const newTeam = await onCreateTeam(data);
                    onSelectedTeamChange(newTeam.id);
                }}
            />

            <ConfirmationModal
                isOpen={removeTeamConfirmation.isOpen}
                title="Remove from Team"
                message="Are you sure you want to remove this player from the team?"
                confirmLabel="Remove"
                cancelLabel="Cancel"
                variant="danger"
                onConfirm={confirmRemoveTeam}
                onCancel={() => setRemoveTeamConfirmation({ isOpen: false, teamId: null })}
            />

            <ConfirmationModal
                isOpen={createClubConfirmation.isOpen}
                title="Create New Club"
                message={`Create new club "${createClubConfirmation.clubName}"?`}
                confirmLabel="Create"
                cancelLabel="Cancel"
                variant="info"
                onConfirm={confirmCreateClub}
                onCancel={() => setCreateClubConfirmation({ isOpen: false, clubName: null })}
            />
        </div >
    );
};
