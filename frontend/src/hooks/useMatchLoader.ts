import { useState, useEffect, useCallback } from 'react';
import type { Team } from '../types';
import type { MatchApiResponse, TeamApiResponse } from '../types/api.types';

interface UseMatchLoaderReturn {
    homeTeam: Team | null;
    visitorTeam: Team | null;
    matchId: string;
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
}

/**
 * Transform API team response to frontend Team format
 */
const transformTeam = (teamData: TeamApiResponse, color: string): Team => ({
    id: teamData.id,
    name: teamData.name,
    category: teamData.category,
    club: teamData.club ? { id: teamData.club.id || '', name: teamData.club.name } : undefined,
    color,
    players: teamData.players.map((p) => ({
        id: p.player.id,
        number: p.player.number,
        name: p.player.name,
        handedness: '',
        isGoalkeeper: p.player.isGoalkeeper || false,
        // Note: 'position' is stored in the Team's player list, not Player interface
    })),
});

/**
 * Custom hook for loading match data
 * Encapsulates fetching, transformation, and error handling
 */
export const useMatchLoader = (matchId: string): UseMatchLoaderReturn => {
    const [homeTeam, setHomeTeam] = useState<Team | null>(null);
    const [visitorTeam, setVisitorTeam] = useState<Team | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMatchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || '';
            const response = await fetch(`${apiUrl}/api/matches/${matchId}`);

            if (!response.ok) {
                throw new Error(`Failed to load match: ${response.status}`);
            }

            const data: MatchApiResponse = await response.json();

            setHomeTeam(transformTeam(data.homeTeam, '#3B82F6'));
            setVisitorTeam(transformTeam(data.awayTeam, '#EF4444'));
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, [matchId]);

    useEffect(() => {
        if (matchId) {
            fetchMatchData();
        }
    }, [matchId, fetchMatchData]);

    return {
        homeTeam,
        visitorTeam,
        matchId,
        isLoading,
        error,
        refetch: fetchMatchData,
    };
};
