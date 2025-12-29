import { useMemo, useState, useCallback } from 'react';
import { API_BASE_URL } from '../../../../config/api';
import type { Team, MatchMigrationChange, MatchMigrationPreview } from '../../../../types';
import { useSafeTranslation } from '../../../../context/LanguageContext';

type GoalkeeperOptions = { home: Team['players']; away: Team['players'] };

type SelectedGoalkeepers = {
    home: string | null;
    away: string | null;
};

type MatchTeamMigrationParams = {
    matchId?: string;
    isEditMode: boolean;
    status: 'SCHEDULED' | 'FINISHED';
    initialHomeTeamId: string | null;
    initialAwayTeamId: string | null;
    selectedHomeTeamId: string | null;
    selectedAwayTeamId: string | null;
};

type MigrationResult = {
    ok: boolean;
    error?: string;
};

export const useMatchTeamMigration = ({
    matchId,
    isEditMode,
    status,
    initialHomeTeamId,
    initialAwayTeamId,
    selectedHomeTeamId,
    selectedAwayTeamId,
}: MatchTeamMigrationParams) => {
    const { t } = useSafeTranslation();

    const [migrationPreview, setMigrationPreview] = useState<MatchMigrationPreview | null>(null);
    const [isMigrationModalOpen, setIsMigrationModalOpen] = useState(false);
    const [isMigrationPreviewLoading, setIsMigrationPreviewLoading] = useState(false);
    const [isMigrationApplying, setIsMigrationApplying] = useState(false);
    const [migrationError, setMigrationError] = useState<string | null>(null);
    const [goalkeeperOptions, setGoalkeeperOptions] = useState<GoalkeeperOptions>({
        home: [],
        away: [],
    });
    const [selectedGoalkeepers, setSelectedGoalkeepers] = useState<SelectedGoalkeepers>({
        home: null,
        away: null,
    });

    const shouldMigrateTeams = useMemo(() => {
        if (!isEditMode || status !== 'FINISHED') return false;
        if (!initialHomeTeamId || !initialAwayTeamId) return false;
        return !!(
            (selectedHomeTeamId && selectedHomeTeamId !== initialHomeTeamId) ||
            (selectedAwayTeamId && selectedAwayTeamId !== initialAwayTeamId)
        );
    }, [
        isEditMode,
        status,
        initialHomeTeamId,
        initialAwayTeamId,
        selectedHomeTeamId,
        selectedAwayTeamId,
    ]);

    const buildMigrationPayload = useCallback(() => {
        const payload: { homeTeamId?: string; awayTeamId?: string } = {};
        if (selectedHomeTeamId && selectedHomeTeamId !== initialHomeTeamId) {
            payload.homeTeamId = selectedHomeTeamId;
        }
        if (selectedAwayTeamId && selectedAwayTeamId !== initialAwayTeamId) {
            payload.awayTeamId = selectedAwayTeamId;
        }
        return payload;
    }, [selectedHomeTeamId, selectedAwayTeamId, initialHomeTeamId, initialAwayTeamId]);

    const loadGoalkeeperOptions = useCallback(async (changes: MatchMigrationChange[]) => {
        const options: GoalkeeperOptions = { home: [], away: [] };

        await Promise.all(
            changes.map(async (change) => {
                if (!change.requiresGoalkeeper) return;
                try {
                    const teamRes = await fetch(`${API_BASE_URL}/api/teams/${change.toTeam.id}`);
                    if (!teamRes.ok) return;
                    const teamData: Team = await teamRes.json();
                    options[change.side] = teamData.players ?? [];
                } catch (err) {
                    console.error('Failed to load team goalkeepers', err);
                }
            }),
        );

        setGoalkeeperOptions(options);
    }, []);

    const prepareMigrationPreview = useCallback(async (): Promise<MigrationResult> => {
        if (!matchId || !isEditMode || !shouldMigrateTeams) {
            return { ok: false, error: t('matchMigration.previewError') };
        }

        setIsMigrationPreviewLoading(true);
        setMigrationError(null);
        setMigrationPreview(null);
        setSelectedGoalkeepers({ home: null, away: null });
        setGoalkeeperOptions({ home: [], away: [] });
        setIsMigrationModalOpen(false);

        try {
            const payload = buildMigrationPayload();
            const previewRes = await fetch(`${API_BASE_URL}/api/matches/${matchId}/team-migration/preview`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!previewRes.ok) {
                const errorPayload = await previewRes.json().catch(() => null);
                const message = errorPayload?.error || t('matchMigration.previewError');
                return { ok: false, error: message };
            }

            const preview: MatchMigrationPreview = await previewRes.json();
            setMigrationPreview(preview);
            await loadGoalkeeperOptions(preview.changes);
            setIsMigrationModalOpen(true);
            return { ok: true };
        } catch (err) {
            console.error('Failed to load migration preview', err);
            return { ok: false, error: t('matchMigration.previewError') };
        } finally {
            setIsMigrationPreviewLoading(false);
        }
    }, [
        matchId,
        isEditMode,
        shouldMigrateTeams,
        buildMigrationPayload,
        loadGoalkeeperOptions,
        t,
    ]);

    const setGoalkeeperSelection = useCallback((side: 'home' | 'away', value: string | null) => {
        setSelectedGoalkeepers((prev) => ({
            ...prev,
            [side]: value,
        }));
    }, []);

    const applyMigration = useCallback(async (): Promise<MigrationResult> => {
        if (!migrationPreview || !matchId || isMigrationApplying) return { ok: false };
        setMigrationError(null);

        const requiresHomeGoalkeeper = migrationPreview.changes.some(
            (change) => change.side === 'home' && change.requiresGoalkeeper,
        );
        const requiresAwayGoalkeeper = migrationPreview.changes.some(
            (change) => change.side === 'away' && change.requiresGoalkeeper,
        );

        if (requiresHomeGoalkeeper && !selectedGoalkeepers.home) {
            const message = t('matchMigration.goalkeeperRequired');
            setMigrationError(message);
            return { ok: false, error: message };
        }
        if (requiresAwayGoalkeeper && !selectedGoalkeepers.away) {
            const message = t('matchMigration.goalkeeperRequired');
            setMigrationError(message);
            return { ok: false, error: message };
        }

        setIsMigrationApplying(true);
        try {
            const payload = buildMigrationPayload();
            const applyPayload = {
                ...payload,
                homeGoalkeeperId: selectedGoalkeepers.home || undefined,
                awayGoalkeeperId: selectedGoalkeepers.away || undefined,
            };

            const res = await fetch(`${API_BASE_URL}/api/matches/${matchId}/team-migration/apply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(applyPayload),
            });

            if (!res.ok) {
                const errorPayload = await res.json().catch(() => null);
                const message = errorPayload?.error || t('matchMigration.applyError');
                setMigrationError(message);
                return { ok: false, error: message };
            }

            setIsMigrationModalOpen(false);
            return { ok: true };
        } catch (err) {
            console.error('Failed to apply match migration', err);
            const message = t('matchMigration.applyError');
            setMigrationError(message);
            return { ok: false, error: message };
        } finally {
            setIsMigrationApplying(false);
        }
    }, [
        migrationPreview,
        matchId,
        isMigrationApplying,
        selectedGoalkeepers.home,
        selectedGoalkeepers.away,
        buildMigrationPayload,
        t,
    ]);

    const cancelMigration = useCallback(() => {
        setIsMigrationModalOpen(false);
        setMigrationError(null);
    }, []);

    return {
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
    };
};
