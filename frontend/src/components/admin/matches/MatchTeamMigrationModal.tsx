import { ConfirmationModal } from '../../common';
import type { Team, MatchMigrationPreview, MatchMigrationTeamSummary } from '../../../types';
import { useSafeTranslation } from '../../../context/LanguageContext';

type MatchTeamMigrationModalProps = {
    isOpen: boolean;
    preview: MatchMigrationPreview | null;
    error: string | null;
    goalkeeperOptions: { home: Team['players']; away: Team['players'] };
    selectedGoalkeepers: { home: string | null; away: string | null };
    onGoalkeeperChange: (side: 'home' | 'away', value: string | null) => void;
    onConfirm: () => void;
    onCancel: () => void;
};

const formatTeamLabel = (team: MatchMigrationTeamSummary) =>
    [team.clubName, team.category, team.name].filter(Boolean).join(' ') || team.name;

export const MatchTeamMigrationModal = ({
    isOpen,
    preview,
    error,
    goalkeeperOptions,
    selectedGoalkeepers,
    onGoalkeeperChange,
    onConfirm,
    onCancel,
}: MatchTeamMigrationModalProps) => {
    const { t } = useSafeTranslation();

    const migrationMessage = preview ? (
        <div className="space-y-4 text-sm text-gray-600">
            <p>{t('matchMigration.description')}</p>
            <div className="border-t border-gray-200 pt-3 space-y-4">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t('matchMigration.summaryTitle')}
                </div>
                {preview.changes.map((change) => {
                    const playersToShow = change.players.slice(0, 6);
                    const remainingPlayers = change.players.length - playersToShow.length;
                    const teamLabel = t('matchMigration.teamChangeLabel', {
                        side: t(
                            change.side === 'home'
                                ? 'matchMigration.homeSide'
                                : 'matchMigration.awaySide',
                        ),
                        from: formatTeamLabel(change.fromTeam),
                        to: formatTeamLabel(change.toTeam),
                    });
                    const goalkeeperCandidates = (goalkeeperOptions[change.side] ?? []).filter(
                        (entry) => entry.position === 1 || entry.player?.isGoalkeeper,
                    );

                    return (
                        <div key={change.side} className="space-y-2">
                            <div className="text-sm font-semibold text-gray-900">{teamLabel}</div>
                            <div>{t('matchMigration.eventsCount', { count: change.eventCount })}</div>
                            <div>{t('matchMigration.playersCount', { count: change.players.length })}</div>
                            <div className="text-xs text-gray-500">
                                {t('matchMigration.playersListHint')}
                            </div>
                            <div className="text-xs text-gray-600">
                                <div className="font-semibold text-gray-700">
                                    {t('matchMigration.playersListTitle')}
                                </div>
                                {playersToShow.length > 0 ? (
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {playersToShow.map((player) => (
                                            <span
                                                key={player.id}
                                                className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                                            >
                                                #{player.number} {player.name}
                                            </span>
                                        ))}
                                        {remainingPlayers > 0 && (
                                            <span className="text-xs text-gray-500">
                                                {t('matchMigration.morePlayers', { count: remainingPlayers })}
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-xs text-gray-500 mt-1">
                                        {t('matchMigration.noPlayers')}
                                    </div>
                                )}
                            </div>
                            {change.requiresGoalkeeper && (
                                <div className="space-y-2 rounded-lg border border-gray-200 p-3 bg-gray-50">
                                    <div className="text-sm font-semibold text-gray-900">
                                        {t('matchMigration.goalkeeperTitle')}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {t('matchMigration.goalkeeperHint', {
                                            count: change.goalkeeperEventCount,
                                        })}
                                    </div>
                                    <select
                                        value={selectedGoalkeepers[change.side] ?? ''}
                                        onChange={(event) =>
                                            onGoalkeeperChange(change.side, event.target.value || null)
                                        }
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
                                    >
                                        <option value="">{t('matchMigration.goalkeeperPlaceholder')}</option>
                                        {goalkeeperCandidates.map((entry) => (
                                            <option key={entry.player.id} value={entry.player.id}>
                                                #{entry.player.number} {entry.player.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="text-xs text-gray-500">
                                        {t('matchMigration.goalkeeperAssignedHint')}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            {error && (
                <div className="text-sm text-red-600">{error}</div>
            )}
        </div>
    ) : (
        <div className="text-sm text-gray-600">{t('matchMigration.loading')}</div>
    );

    return (
        <ConfirmationModal
            isOpen={isOpen}
            title={t('matchMigration.title')}
            message={migrationMessage}
            confirmLabel={t('matchMigration.confirm')}
            cancelLabel={t('matchMigration.cancel')}
            variant="info"
            onConfirm={onConfirm}
            onCancel={onCancel}
        />
    );
};
