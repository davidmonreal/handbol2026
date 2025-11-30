import { useMemo } from 'react';
import { type MatchEvent } from '../../../types';

/**
 * Hook to calculate player baseline averages for comparison
 * 
 * @param allPlayerEvents - All events for players (not filtered by team)
 * @param teamId - Optional team ID to filter baseline by specific team
 * @returns Map of playerId -> baseline efficiency percentage
 * 
 * When teamId is provided: Only uses events where player played for that team
 * When teamId is null: Uses all player events regardless of team
 */
export function usePlayerBaselines(
    allPlayerEvents: MatchEvent[],
    teamId?: string | null
): Map<string, number> {
    return useMemo(() => {
        const baselines = new Map<string, number>();

        // Group events by player
        const playerEventsMap = new Map<string, MatchEvent[]>();

        allPlayerEvents.forEach(event => {
            if (!event.playerId) return;

            // Filter by team if specified
            if (teamId && event.teamId !== teamId) return;

            if (!playerEventsMap.has(event.playerId)) {
                playerEventsMap.set(event.playerId, []);
            }
            playerEventsMap.get(event.playerId)!.push(event);
        });

        // Calculate baseline efficiency for each player
        playerEventsMap.forEach((events, playerId) => {
            const shots = events.filter(e => e.category === 'Shot');
            const goals = shots.filter(e => e.action === 'Goal');

            if (shots.length > 0) {
                const efficiency = (goals.length / shots.length) * 100;
                baselines.set(playerId, efficiency);
            }
        });

        return baselines;
    }, [allPlayerEvents, teamId]);
}
