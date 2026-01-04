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
    number?: number;
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
    selectedNumber: number | '';
    onSelectedClubChange: (id: string | null) => void;
    onSelectedCategoryChange: (cat: string) => void;
    onSelectedTeamChange: (id: string | null) => void;
    onSelectedPositionChange: (pos: PlayerPositionId) => void;
    onSelectedNumberChange: (value: number | '') => void;
    onUpdateTeamPosition: (teamId: string, position: PlayerPositionId) => Promise<void>;
    onUpdateTeamNumber: (teamId: string, number: number) => Promise<void>;
    collision: { player?: Player; number?: number } | null;
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
    selectedNumber,
    onSelectedClubChange,
    onSelectedCategoryChange,
    onSelectedTeamChange,
    onSelectedPositionChange,
    onSelectedNumberChange,
    onUpdateTeamPosition,
    onUpdateTeamNumber,
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
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                        {t('playerTeam.currentTeamsTitle')}
                    </h3>
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
                                        <input
                                            key={`${pt.team.id}-${pt.number ?? 'unset'}`}
                                            type="number"
                                            defaultValue={pt.number ?? ''}
                                            onBlur={(event) => {
                                                const value = event.target.value;
                                                if (value === '') return;
                                                const nextNumber = Number(value);
                                                if (!Number.isInteger(nextNumber) || nextNumber < 0 || nextNumber > 99) {
                                                    alert(t('playerTeam.invalidNumber'));
                                                    return;
                                                }
                                                if (pt.number === nextNumber) return;
                                                onUpdateTeamNumber(pt.team.id, nextNumber).catch((err) => {
                                                    console.error('Failed to update number', err);
                                                    const message = err instanceof Error ? err.message : '';
                                                    const fallback = t('playerTeam.updateNumberError');
                                                    const normalised = message === 'Failed to update number' ||
                                                        message === 'Save player before updating number'
                                                        ? fallback
                                                        : message || fallback;
                                                    alert(normalised);
                                                });
                                            }}
                                            className="w-16 rounded border border-indigo-200 bg-white px-2 py-1 text-center text-sm font-mono text-gray-800 focus:border-indigo-400 focus:outline-none"
                                            placeholder="#"
                                            min={0}
                                            max={99}
                                        />
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
                                        title={t('playerTeam.removeFromTeamTitle')}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <h3 className="text-sm font-medium text-gray-700 mb-3">
                {t('playerTeam.addToTeamTitle')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SearchableSelectWithCreate
                    label={t('playerTeam.clubLabel')}
                    value={selectedClubId}
                    options={clubs.map(c => ({ value: c.id, label: c.name }))}
                    onChange={(val) => {
                        onSelectedClubChange(val);
                        onSelectedTeamChange(null);
                    }}
                    onCreate={handleCreateClubRequest}
                    placeholder={t('playerTeam.selectOrCreatePlaceholder')}
                />

                <SearchableSelectWithCreate
                    label={t('playerTeam.categoryLabel')}
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
                    placeholder={t('playerTeam.selectCategoryPlaceholder')}
                />

                <SearchableSelectWithCreate
                    label={t('playerTeam.teamLabel')}
                    value={selectedTeamId}
                    options={filteredTeams.map(t => ({
                        value: t.id,
                        label: t.name
                    }))}
                    onChange={onSelectedTeamChange}
                    onCreate={handleCreateTeamRequest}
                    placeholder={selectedClubId
                        ? t('playerTeam.selectOrCreatePlaceholder')
                        : t('playerTeam.selectClubFirstPlaceholder')}
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
            <div className="mt-4 max-w-xs">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('playerTeam.numberLabel')}</label>
                <input
                    type="number"
                    value={selectedNumber}
                    onChange={(event) =>
                        onSelectedNumberChange(event.target.value === '' ? '' : Number(event.target.value))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-center font-mono text-lg text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder={t('playerTeam.numberPlaceholder')}
                    min={0}
                    max={99}
                />
            </div>
            <p className="text-sm text-gray-500 mt-2">
                {t('playerTeam.helperText')}
            </p>

            {collision && collision.player && selectedTeamId && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 flex items-start gap-2 animate-fadeIn">
                    <span className="font-bold flex-shrink-0">{t('playerTeam.numberConflictLabel')}</span>
                    <div>
                        <div>
                            {t('playerTeam.numberConflictPrefix')}{' '}
                            <strong>{collision.player.name}</strong>{' '}
                            {t('playerTeam.numberConflictMiddle')}{' '}
                            <strong>{collision.number ?? '-'}</strong>{' '}
                            {t('playerTeam.numberConflictSuffix')}
                        </div>
                        <label className="mt-2 inline-flex items-center gap-2 text-sm text-red-800">
                            <input
                                type="checkbox"
                                checked={acceptNumberConflict}
                                onChange={(event) => onAcceptNumberConflictChange(event.target.checked)}
                                className="h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-400"
                            />
                            <span>{t('playerTeam.acceptNumberConflict')}</span>
                        </label>
                    </div>
                </div>
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
                title={t('playerTeam.removeFromTeamTitle')}
                message={t('playerTeam.removeFromTeamMessage')}
                confirmLabel={t('playerTeam.removeFromTeamConfirm')}
                cancelLabel={t('playerTeam.removeFromTeamCancel')}
                variant="danger"
                onConfirm={confirmRemoveTeam}
                onCancel={() => setRemoveTeamConfirmation({ isOpen: false, teamId: null })}
            />

            <ConfirmationModal
                isOpen={createClubConfirmation.isOpen}
                title={t('playerTeam.createClubTitle')}
                message={t('playerTeam.createClubMessage', {
                    clubName: createClubConfirmation.clubName ?? '',
                })}
                confirmLabel={t('playerTeam.createClubConfirm')}
                cancelLabel={t('playerTeam.createClubCancel')}
                variant="info"
                onConfirm={confirmCreateClub}
                onCancel={() => setCreateClubConfirmation({ isOpen: false, clubName: null })}
            />
        </div >
    );
};
