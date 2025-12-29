import { useState } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { API_BASE_URL } from '../../../../config/api';
import { useDataRefresh } from '../../../../context/DataRefreshContext';
import type { Team } from '../../../../types';

type MatchFormActionsParams = {
    matchId?: string;
    isEditMode: boolean;
    fromPath?: string;
    navigate: NavigateFunction;
    teams: Team[];
    status: 'SCHEDULED' | 'FINISHED';
    dateValue: string;
    timeValue: string;
    selectedHomeTeamId: string | null;
    selectedAwayTeamId: string | null;
    initialHomeTeamId: string | null;
    initialAwayTeamId: string | null;
    initialDateValue: string | null;
    initialTimeValue: string | null;
    initialStatus: 'SCHEDULED' | 'FINISHED' | null;
    initialHomeScore: string | null;
    initialAwayScore: string | null;
    homeScore: string;
    awayScore: string;
    shouldMigrateTeams: boolean;
    prepareMigrationPreview: () => Promise<{ ok: boolean; error?: string }>;
    applyMigration: () => Promise<{ ok: boolean }>;
    setError: (message: string | null) => void;
    setInfoMessage: (message: string | null) => void;
};

export const useMatchFormActions = ({
    matchId,
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
    initialDateValue,
    initialTimeValue,
    initialStatus,
    initialHomeScore,
    initialAwayScore,
    homeScore,
    awayScore,
    shouldMigrateTeams,
    prepareMigrationPreview,
    applyMigration,
    setError,
    setInfoMessage,
}: MatchFormActionsParams) => {
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isResettingClock, setIsResettingClock] = useState(false);
    const { bumpRefreshToken } = useDataRefresh();

    const navigateWithMessage = (message: string) => {
        if (fromPath) {
            navigate(fromPath, { state: { message } });
        } else if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate('/matches', { state: { message } });
        }
    };

    const handleSave = async () => {
        if (!dateValue || !timeValue || !selectedHomeTeamId || !selectedAwayTeamId) {
            setError('All fields are required');
            return;
        }

        if (selectedHomeTeamId === selectedAwayTeamId) {
            setError('Home and Away teams must be different');
            return;
        }

        if (status === 'FINISHED') {
            const homeScoreNum = homeScore !== '' ? parseInt(homeScore) : 0;
            const awayScoreNum = awayScore !== '' ? parseInt(awayScore) : 0;

            if (homeScoreNum === 0 && awayScoreNum === 0) {
                setError('Finished matches must have a result (score cannot be 0-0)');
                return;
            }
        }

        setIsSaving(true);
        setError(null);

        try {
            if (shouldMigrateTeams && isEditMode && matchId) {
                const previewResult = await prepareMigrationPreview();
                if (!previewResult.ok && previewResult.error) {
                    setError(previewResult.error);
                }
                return;
            }

            const dateTime = new Date(`${dateValue}T${timeValue}`);

            const matchData = {
                date: dateTime.toISOString(),
                homeTeamId: selectedHomeTeamId,
                awayTeamId: selectedAwayTeamId,
                isFinished: status === 'FINISHED',
                homeScore: status === 'FINISHED' ? parseInt(homeScore || '0') : undefined,
                awayScore: status === 'FINISHED' ? parseInt(awayScore || '0') : undefined,
            };

            const method = isEditMode ? 'PUT' : 'POST';
            const url = isEditMode
                ? `${API_BASE_URL}/api/matches/${matchId}`
                : `${API_BASE_URL}/api/matches`;

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(matchData),
            });

            if (!res.ok) throw new Error('Failed to save match');

            const homeTeam = teams.find((t) => t.id === selectedHomeTeamId);
            const awayTeam = teams.find((t) => t.id === selectedAwayTeamId);
            const successMessage = `Match ${isEditMode ? 'updated' : 'created'}: ${homeTeam?.name || 'Team'} vs ${awayTeam?.name || 'Team'}`;

            const hasChanges = !isEditMode
                || initialHomeTeamId !== selectedHomeTeamId
                || initialAwayTeamId !== selectedAwayTeamId
                || initialDateValue !== dateValue
                || initialTimeValue !== timeValue
                || initialStatus !== status
                || initialHomeScore !== homeScore
                || initialAwayScore !== awayScore;

            if (hasChanges) {
                bumpRefreshToken();
            }

            navigateWithMessage(successMessage);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save match');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!isEditMode || !matchId) return;
        const confirmed = window.confirm('Delete this match? This cannot be undone.');
        if (!confirmed) return;
        setIsDeleting(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE_URL}/api/matches/${matchId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete match');
            bumpRefreshToken();
            navigate('/matches', { state: { message: 'Match deleted' } });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete match');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleResetClock = async () => {
        if (!isEditMode || !matchId) return;
        setIsResettingClock(true);
        setError(null);
        setInfoMessage(null);
        try {
            const res = await fetch(`${API_BASE_URL}/api/matches/${matchId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    realTimeFirstHalfStart: null,
                    realTimeFirstHalfEnd: null,
                    realTimeSecondHalfStart: null,
                    realTimeSecondHalfEnd: null,
                }),
            });
            if (!res.ok) throw new Error('Failed to reset clock');
            setInfoMessage('Clock reset to 00:00');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to reset clock');
        } finally {
            setIsResettingClock(false);
        }
    };

    const handleMigrationConfirm = async () => {
        const applyResult = await applyMigration();
        if (applyResult.ok) {
            const homeTeam = teams.find((t) => t.id === selectedHomeTeamId);
            const awayTeam = teams.find((t) => t.id === selectedAwayTeamId);
            const successMessage = `Match updated: ${homeTeam?.name || 'Team'} vs ${awayTeam?.name || 'Team'}`;
            bumpRefreshToken();
            navigateWithMessage(successMessage);
        }
    };

    return {
        isSaving,
        isDeleting,
        isResettingClock,
        handleSave,
        handleDelete,
        handleResetClock,
        handleMigrationConfirm,
    };
};
