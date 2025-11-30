import { useMemo } from 'react';
import { type MatchEvent, type ZoneType } from '../../../types';
import { ZONE_CONFIG } from '../../../config/zones';
import type {
    CalculatedStats,
    ZoneStatistics,
    GoalTargetStatistics,
    PlayerStatistics,
    ComparisonData,
} from '../types';

/**
 * Hook to calculate statistics from match events
 * Memoized for performance
 */
export function useStatisticsCalculator(
    events: MatchEvent[],
    comparison?: ComparisonData
): CalculatedStats {
    return useMemo(() => {
        // Filter only shot events
        const shots = events.filter(e => e.category === 'Shot');
        const goals = shots.filter(e => e.action === 'Goal');
        const saves = shots.filter(e => e.action === 'Save');
        const misses = shots.filter(e => e.action === 'Miss');
        const posts = shots.filter(e => e.action === 'Post');

        const totalShots = shots.length;
        const totalGoals = goals.length;
        const efficiency = totalShots > 0 ? (totalGoals / totalShots) * 100 : 0;

        // Calculate zone statistics
        const zoneStats = new Map<ZoneType | '7m', ZoneStatistics>();

        // Initialize all zones with zero values
        [...ZONE_CONFIG.sixMeter, ...ZONE_CONFIG.nineMeter, ZONE_CONFIG.penalty].forEach(({ zone }) => {
            zoneStats.set(zone, { shots: 0, goals: 0, efficiency: 0 });
        });

        // Count shots and goals per zone
        shots.forEach(shot => {
            if (!shot.zone) return;

            const stats = zoneStats.get(shot.zone);
            if (stats) {
                stats.shots++;
                if (shot.action === 'Goal') {
                    stats.goals++;
                }
            }
        });

        // Calculate efficiency for each zone
        zoneStats.forEach((stats) => {
            stats.efficiency = stats.shots > 0 ? (stats.goals / stats.shots) * 100 : 0;
        });

        // Calculate goal target statistics (1-9)
        const goalTargetStats = new Map<number, GoalTargetStatistics>();
        for (let target = 1; target <= 9; target++) {
            const targetShots = shots.filter(s => s.goalTarget === target);
            const targetGoals = targetShots.filter(s => s.action === 'Goal');

            goalTargetStats.set(target, {
                goals: targetGoals.length,
                shots: targetShots.length,
                efficiency: targetShots.length > 0 ? (targetGoals.length / targetShots.length) * 100 : 0,
            });
        }

        // Calculate player statistics
        const playerStats = new Map<string, PlayerStatistics>();

        // Group events by player
        const playerEvents = new Map<string, MatchEvent[]>();
        events.forEach(event => {
            if (!event.playerId) return;

            if (!playerEvents.has(event.playerId)) {
                playerEvents.set(event.playerId, []);
            }
            playerEvents.get(event.playerId)!.push(event);
        });

        // Calculate stats for each player
        playerEvents.forEach((playerEvs, playerId) => {
            const playerShots = playerEvs.filter(e => e.category === 'Shot');
            const playerGoals = playerShots.filter(e => e.action === 'Goal');
            const playerSaves = playerShots.filter(e => e.action === 'Save');
            const playerMisses = playerShots.filter(e => e.action === 'Miss');
            const playerPosts = playerShots.filter(e => e.action === 'Post');

            const playerEfficiency = playerShots.length > 0
                ? (playerGoals.length / playerShots.length) * 100
                : 0;

            const firstEvent = playerEvs[0];

            const stats: PlayerStatistics = {
                playerId,
                playerName: firstEvent.playerName,
                playerNumber: firstEvent.playerNumber,
                shots: playerShots.length,
                goals: playerGoals.length,
                saves: playerSaves.length,
                misses: playerMisses.length,
                posts: playerPosts.length,
                efficiency: playerEfficiency,
            };

            // Add comparison if baseline data is available
            if (comparison?.playerAverages) {
                const baselineEfficiency = comparison.playerAverages.get(playerId);
                if (baselineEfficiency !== undefined && playerShots.length > 0) {
                    stats.comparison = {
                        baselineEfficiency,
                        delta: playerEfficiency - baselineEfficiency,
                    };
                }
            }

            playerStats.set(playerId, stats);
        });

        return {
            totalShots,
            totalGoals,
            totalSaves: saves.length,
            totalMisses: misses.length,
            totalPosts: posts.length,
            efficiency,
            zoneStats,
            playerStats,
            goalTargetStats,
        };
    }, [events, comparison]);
}
