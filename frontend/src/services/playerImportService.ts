import { API_BASE_URL } from '../config/api';

export interface ExtractedPlayer {
    name: string;
    number: number;
    handedness?: 'left' | 'right' | 'both';
    isGoalkeeper?: boolean;
}

export interface DuplicateMatch {
    id: string;
    name: string;
    number: number;
    distance: number;
    similarity: number;
    handedness?: 'left' | 'right' | 'both';
    isGoalkeeper?: boolean;
    teams?: { id: string; name: string; club: string }[];
}

export interface DuplicateInfo {
    name: string;
    hasDuplicates: boolean;
    matches: DuplicateMatch[];
}

export const playerImportService = {
    fetchTeams: async () => {
        const response = await fetch(`${API_BASE_URL}/api/teams`);
        if (!response.ok) throw new Error('Failed to fetch teams');
        return response.json();
    },

    checkDuplicates: async (names: string[], threshold: number = 3) => {
        const response = await fetch(`${API_BASE_URL}/api/players/check-duplicates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ names, threshold }),
        });
        if (!response.ok) throw new Error('Failed to check duplicates');
        return response.json();
    },

    extractPlayersFromImage: async (image: string) => {
        const response = await fetch(`${API_BASE_URL}/api/import-players-from-image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to process image');
        }
        return response.json();
    },

    mergePlayer: async (oldPlayerId: string, newPlayerData: ExtractedPlayer, teamId: string) => {
        const response = await fetch(`${API_BASE_URL}/api/players/merge`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                oldPlayerId,
                newPlayerData,
                teamId,
            }),
        });
        if (!response.ok) throw new Error('Failed to merge player');
        return response.json();
    },

    importPlayersBatch: async (players: ExtractedPlayer[], teamId: string) => {
        const response = await fetch(`${API_BASE_URL}/api/players/batch-with-team`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                players,
                teamId,
            }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to import players');
        }
        return response.json();
    }
};
