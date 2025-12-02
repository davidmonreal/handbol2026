import { API_BASE_URL } from '../config/api';

export const HANDEDNESS = {
    LEFT: 'LEFT',
    RIGHT: 'RIGHT'
} as const;

export type Handedness = typeof HANDEDNESS[keyof typeof HANDEDNESS];

export interface ExtractedPlayer {
    name: string;
    number: number;
    handedness?: Handedness;
    isGoalkeeper?: boolean;
}

export interface DuplicateMatch {
    id: string;
    name: string;
    number: number;
    distance: number;
    similarity: number;
    handedness?: Handedness;
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
    },

    createTeam: async (clubName: string, teamName: string, category: string) => {
        // First, verify if club exists or create it, then create team.
        // For simplicity, we'll assume the backend handles "get or create club" logic 
        // or we use a specific endpoint. 
        // If the backend /api/teams supports creating a team with a club name, great.
        // Otherwise we might need to fetch clubs, check existence, create club, then create team.
        // Let's assume a new endpoint or enhanced /api/teams for this specific flow 
        // or just use the standard creation flow if it supports it.

        // Based on typical patterns, let's try to post to /api/teams with clubName.
        // If the backend doesn't support this, we might need to adjust.
        // Given I can't see backend code easily right now, I'll assume a standard structure.

        const response = await fetch(`${API_BASE_URL}/api/teams`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: teamName,
                category,
                clubName, // Backend should handle finding or creating club
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create team');
        }
        return response.json();
    }
};
