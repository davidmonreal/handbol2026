import { useMemo } from 'react';
import { type MatchEvent } from '../../../types';
import type {
    CalculatedStats,
    ComparisonData,
} from '../types';
import { StatisticsEngine } from '../../../engines/stats/StatisticsEngine';

/**
 * React Hook Adapter for StatisticsEngine.
 * 
 * ROLE:
 * Acts as the "Controller" or "Adapter" between the React view layer and the 
 * pure logic `StatisticsEngine`.
 * 
 * PERFORMANCE:
 * Uses `useMemo` to ensure the heavy calculation in `StatisticsEngine` 
 * is only performed when relevant dependencies (events, configuration) change.
 */
export function useStatisticsCalculator(
    events: MatchEvent[],
    comparison?: ComparisonData,
    isGoalkeeper: boolean = false,
    foulEvents?: MatchEvent[],
    playerResolver?: (playerId: string) => { name: string; number: number; isGoalkeeper?: boolean },
    gkEvents?: MatchEvent[]
): CalculatedStats {
    // 1. Instantiate the engine. 
    // We memoize the engine instance itself based on inputs that affect configuration.
    // Note: 'events' are part of the engine state, so if events change, we recreate the engine.
    // In a more advanced generic cache system, we might keep the engine alive and just update events,
    // but recreating a lightweight JS class is very cheap compared to the calculations.
    const engine = useMemo(() => {
        return new StatisticsEngine(
            events,
            isGoalkeeper,
            comparison,
            playerResolver
        );
    }, [events, isGoalkeeper, comparison, playerResolver]);

    // 2. Calculate statistics.
    // We update the calculation whenever dependencies change.
    // The engine handles internal caching if we were to call calculate() multiple times, 
    // but here we just call it once per memo dependency change.
    const stats = useMemo(() => {
        return engine.calculate(foulEvents, gkEvents);
    }, [engine, foulEvents, gkEvents]);

    return stats;
}
