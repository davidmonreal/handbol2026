import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config/api';
import { toTitleCase } from '../utils/textUtils';
import { playerImportService, type DuplicateMatch } from '../services/playerImportService';
import type { Player, Club, Team, Season } from '../types';

interface PlayerFormData {
    name: string;
    number: number | '';
    handedness: 'RIGHT' | 'LEFT';
    isGoalkeeper: boolean;
}

interface PlayerData {
    clubs: Club[];
    teams: Team[];
    seasons: Season[];
    playerTeams: any[]; // Explicit type from PlayerFormPage
    currentTeamPlayers: any[];
}

interface DuplicateState {
    matches: DuplicateMatch[];
    hasWarning: boolean;
    isChecking: boolean;
}

export const usePlayerForm = (playerId?: string) => {
    // UI State
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState<PlayerFormData>({
        name: '',
        number: '',
        handedness: 'RIGHT',
        isGoalkeeper: false
    });

    // Data State
    const [data, setData] = useState<PlayerData>({
        clubs: [],
        teams: [],
        seasons: [],
        playerTeams: [],
        currentTeamPlayers: []
    });

    // Duplicate State
    const [duplicateState, setDuplicateState] = useState<DuplicateState>({
        matches: [],
        hasWarning: false,
        isChecking: false
    });

    const isEditMode = !!playerId;

    // Load Data
    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [clubsRes, teamsRes, seasonsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/clubs`),
                fetch(`${API_BASE_URL}/api/teams`),
                fetch(`${API_BASE_URL}/api/seasons`)
            ]);

            const clubs = await clubsRes.json();
            const teams = await teamsRes.json();
            const seasons = await seasonsRes.json();

            // Sort data alphabetically
            clubs.sort((a: Club, b: Club) => a.name.localeCompare(b.name));
            teams.sort((a: Team, b: Team) => a.name.localeCompare(b.name));

            let playerTeams: any[] = [];

            if (isEditMode && playerId) {
                const playerRes = await fetch(`${API_BASE_URL}/api/players/${playerId}`);
                if (!playerRes.ok) throw new Error('Player not found');
                const player: Player = await playerRes.json();

                setFormData({
                    name: player.name,
                    number: player.number,
                    handedness: player.handedness as 'RIGHT' | 'LEFT',
                    isGoalkeeper: player.isGoalkeeper
                });
                playerTeams = player.teams || [];
            }

            setData({ clubs, teams, seasons, playerTeams, currentTeamPlayers: [] });
        } catch (err) {
            console.error('Error loading data:', err);
            setError('Failed to load data');
        } finally {
            setIsLoading(false);
        }
    }, [playerId, isEditMode]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const setName = (name: string) => {
        setFormData(prev => ({ ...prev, name: toTitleCase(name) }));
        // Reset warning when name changes significantly, but we rely on useEffect for logic
    };

    const setNumber = (number: number | '') => setFormData(prev => ({ ...prev, number }));
    const setHandedness = (handedness: 'RIGHT' | 'LEFT') => setFormData(prev => ({ ...prev, handedness }));
    const setIsGoalkeeper = (isGoalkeeper: boolean) => setFormData(prev => ({ ...prev, isGoalkeeper }));

    const ignoreMatch = (matchId: string) => {
        setDuplicateState(prev => {
            const newMatches = prev.matches.filter(m => m.id !== matchId);
            return {
                ...prev,
                matches: newMatches,
                hasWarning: newMatches.length > 0
            };
        });
    };

    // Duplicate Check Effect
    useEffect(() => {
        if (isEditMode || formData.name.trim().length < 3) {
            setDuplicateState(prev => ({ ...prev, matches: [], hasWarning: false }));
            return;
        }

        const timeoutId = setTimeout(async () => {
            setDuplicateState(prev => ({ ...prev, isChecking: true }));
            try {
                const res = await playerImportService.checkDuplicates([formData.name]);
                if (res.duplicates && res.duplicates[0]) {
                    const info = res.duplicates[0];
                    const hasMatches = info.hasDuplicates && info.matches.length > 0;
                    setDuplicateState(prev => ({
                        ...prev,
                        matches: hasMatches ? info.matches : [],
                        hasWarning: hasMatches
                    }));
                }
            } catch (err) {
                console.error(err);
            } finally {
                setDuplicateState(prev => ({ ...prev, isChecking: false }));
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [formData.name, isEditMode]);


    const savePlayer = async (selectedTeamId?: string | null) => {
        if (!formData.name || formData.number === '') throw new Error('Name and Number required');

        setIsSaving(true);
        try {
            const payload = {
                ...formData,
                number: Number(formData.number)
            };

            let savedPlayer: Player;
            const url = isEditMode ? `${API_BASE_URL}/api/players/${playerId}` : `${API_BASE_URL}/api/players`;
            const method = isEditMode ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Failed to save player');
            savedPlayer = await res.json();

            // Handle Team Assignment
            if (selectedTeamId) {
                await fetch(`${API_BASE_URL}/api/teams/${selectedTeamId}/players`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        playerId: savedPlayer.id,
                        role: 'Player'
                    })
                });
            }

            return savedPlayer;
        } finally {
            setIsSaving(false);
        }
    };

    // Helper handlers for Creating Club/Team (delegated to UI but logic here)
    const createClubHandler = async (name: string) => {
        const res = await fetch(`${API_BASE_URL}/api/clubs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        if (!res.ok) throw new Error('Failed to create club');
        const newClub: Club = await res.json();
        setData(prev => ({ ...prev, clubs: [...prev.clubs, newClub] }));
        return newClub;
    };

    const createTeamHandler = async (teamData: Partial<Team> & { clubId: string, seasonId: string }) => {
        const res = await fetch(`${API_BASE_URL}/api/teams`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...teamData,
                isMyTeam: false
            })
        });
        if (!res.ok) throw new Error('Failed to create team');
        const newTeam: Team = await res.json();
        setData(prev => ({ ...prev, teams: [...prev.teams, newTeam] }));
        return newTeam;
    };

    const removeTeamHandler = async (teamId: string) => {
        if (!playerId) return;
        const res = await fetch(`${API_BASE_URL}/api/teams/${teamId}/players/${playerId}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error('Failed to remove team');
        setData(prev => ({
            ...prev,
            playerTeams: prev.playerTeams.filter(pt => pt.team.id !== teamId)
        }));
    };

    const fetchTeamPlayers = async (teamId: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/teams/${teamId}/players`);
            if (res.ok) {
                const players = await res.json();
                setData(prev => ({ ...prev, currentTeamPlayers: players }));
            }
        } catch (error) {
            console.error('Failed to fetch team players:', error);
        }
    };

    return {
        isLoading,
        isSaving,
        error,
        formData,
        data,
        duplicateState,
        handlers: {
            setName,
            setNumber,
            setHandedness,
            setIsGoalkeeper,
            ignoreMatch,
            savePlayer,
            createClub: createClubHandler,
            createTeam: createTeamHandler,
            removeTeam: removeTeamHandler,
            fetchTeamPlayers
        }
    };
};
