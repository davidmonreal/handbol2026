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

const transformTeam = (teamData: TeamApiResponse, defaultColor: string = '#000000'): Team => {
    return {
        id: teamData.id,
        name: teamData.name,
        category: teamData.category,
        club: teamData.club ? { id: teamData.club.id || '', name: teamData.club.name } : undefined,
        color: defaultColor,
        players: teamData.players?.map(p => ({
            player: {
                id: p.player.id,
                name: p.player.name,
                number: p.player.number,
                isGoalkeeper: p.player.isGoalkeeper || false,
                handedness: 'RIGHT'
            },
            role: p.role
        })) || []
    };
};

export const useMatchLoader = (matchId: string | undefined): UseMatchLoaderReturn => {
    const [homeTeam, setHomeTeam] = useState<Team | null>(null);
    const [visitorTeam, setVisitorTeam] = useState<Team | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMatchData = useCallback(async () => {
        if (!matchId) return;

        try {
            setIsLoading(true);
            setError(null);

            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${API_URL}/api/matches/${matchId}`);

            if (!response.ok) {
                throw new Error(`Failed to load match: ${response.status}`);
            }

            const data: MatchApiResponse = await response.json();

            setHomeTeam(transformTeam(data.homeTeam, '#3B82F6'));
            setVisitorTeam(transformTeam(data.awayTeam, '#EF4444'));
        } catch (err) {
            console.error('Error fetching match data:', err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setIsLoading(false);
        }
    }, [matchId]);

    useEffect(() => {
        fetchMatchData();
    }, [fetchMatchData]);

    return {
        homeTeam,
        visitorTeam,
        matchId: matchId || '',
        isLoading,
        error,
        refetch: fetchMatchData
    };
};
