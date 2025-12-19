import type { MatchEvent } from '../../types';

/**
 * Data-only builder for GoalFlowChart. Pulled out of the component so we can unit-test
 * the clustering/normalization logic without touching SVG/React.
 */
export type SeriesPoint = { position: number; value: number };
export type ClusterPoint = { position: number; count: number };

export interface GoalFlowData {
    teamSeries: SeriesPoint[];
    opponentSeries: SeriesPoint[];
    foulsByPosition: { position: number }[];
    turnoversByPosition: ClusterPoint[];
    savesByPosition: ClusterPoint[];
    maxGoals: number;
}

export const VIEWBOX_WIDTH = 1300;
export const VIEWBOX_HEIGHT = 520;
export const PADDING_LEFT = 5;
export const PADDING_RIGHT = 5;
export const PADDING_TOP = 40;
export const PADDING_BOTTOM = 44;
export const CLUSTER_WINDOW_SECONDS = 120;
export const HALF_BOUNDARY_POSITION = 0.5;
export const HALF_GAP = 0.04;
export const FIRST_SEGMENT: [number, number] = [0, HALF_BOUNDARY_POSITION - HALF_GAP / 2];
export const SECOND_SEGMENT: [number, number] = [HALF_BOUNDARY_POSITION + HALF_GAP / 2, 1];

const buildSmoothProgressMap = (values: number[]) => {
    const unique = Array.from(new Set(values)).sort((a, b) => a - b);
    const denom = unique.length + 1;
    const map = new Map<number, number>();
    unique.forEach((value, idx) => map.set(value, (idx + 1) / denom));
    return { map, hasEntries: unique.length > 0 };
};

const buildSeries = (
    timestamps: number[],
    halfSplit: number,
    toFirstHalfPosition: (timestamp: number) => number,
    toSecondHalfPosition: (timestamp: number) => number
): SeriesPoint[] => {
    const sorted = [...timestamps].sort((a, b) => a - b);
    const series: SeriesPoint[] = [{ position: FIRST_SEGMENT[0], value: 0 }];
    let value = 0;

    sorted.filter(t => t < halfSplit).forEach(time => {
        value += 1;
        series.push({ position: toFirstHalfPosition(time), value });
    });

    // Ensure we draw through halftime even if no goals land exactly there
    series.push({ position: HALF_BOUNDARY_POSITION, value });
    series.push({ position: SECOND_SEGMENT[0], value });

    sorted.filter(t => t >= halfSplit).forEach(time => {
        value += 1;
        series.push({ position: toSecondHalfPosition(time), value });
    });

    series.push({ position: 1, value });
    return series;
};

const clusterCounts = (
    timestamps: number[],
    toNormalizedPosition: (timestamp: number) => number
): ClusterPoint[] => {
    if (timestamps.length === 0) return [];
    const sorted = [...timestamps].sort((a, b) => a - b);
    const clusters: { time: number; count: number }[] = [];

    let currentTimeSum = sorted[0];
    let currentCount = 1;
    let lastTime = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
        const t = sorted[i];
        if (t - lastTime < CLUSTER_WINDOW_SECONDS) {
            currentTimeSum += t;
            currentCount += 1;
        } else {
            clusters.push({ time: currentTimeSum / currentCount, count: currentCount });
            currentTimeSum = t;
            currentCount = 1;
        }
        lastTime = t;
    }
    clusters.push({ time: currentTimeSum / currentCount, count: currentCount });

    return clusters.map(cluster => ({
        position: toNormalizedPosition(cluster.time),
        count: cluster.count,
    }));
};

export function buildGoalFlowData(
    events: MatchEvent[],
    selectedTeamId: string,
    opponentTeamId: string | null,
    secondHalfMarkSeconds?: number | null
): GoalFlowData {
    const halfSplit = typeof secondHalfMarkSeconds === 'number'
        ? secondHalfMarkSeconds
        : Number.POSITIVE_INFINITY;

    const ownGoals = events
        .filter(e => e.teamId === selectedTeamId && e.category === 'Shot' && e.action === 'Goal')
        .map(e => e.timestamp);

    const oppGoals = events
        .filter(e => opponentTeamId && e.teamId === opponentTeamId && e.category === 'Shot' && e.action === 'Goal')
        .map(e => e.timestamp);

    const firstHalfTimes = events.filter(e => e.timestamp < halfSplit).map(e => e.timestamp);
    const secondHalfTimes = events.filter(e => e.timestamp >= halfSplit).map(e => e.timestamp);

    const firstHalfProgress = buildSmoothProgressMap(firstHalfTimes);
    const secondHalfProgress = buildSmoothProgressMap(secondHalfTimes);

    const mapToRange = (timestamp: number, progress: ReturnType<typeof buildSmoothProgressMap>, [start, end]: [number, number]) => {
        if (!progress.hasEntries) return start;
        const normalized = progress.map.get(timestamp) ?? 1;
        return start + normalized * (end - start);
    };

    const toFirstHalfPosition = (timestamp: number) => mapToRange(timestamp, firstHalfProgress, FIRST_SEGMENT);
    const toSecondHalfPosition = (timestamp: number) => mapToRange(timestamp, secondHalfProgress, SECOND_SEGMENT);
    const toNormalizedPosition = (timestamp: number) => (
        timestamp >= halfSplit ? toSecondHalfPosition(timestamp) : toFirstHalfPosition(timestamp)
    );

    const teamSeries = buildSeries(ownGoals, halfSplit, toFirstHalfPosition, toSecondHalfPosition);
    const opponentSeries = buildSeries(oppGoals, halfSplit, toFirstHalfPosition, toSecondHalfPosition);

    const maxGoalValue = Math.max(
        teamSeries[teamSeries.length - 1]?.value || 0,
        opponentSeries[opponentSeries.length - 1]?.value || 0,
        1
    );

    return {
        teamSeries,
        opponentSeries,
        foulsByPosition: events
            .filter(e => e.teamId === selectedTeamId && e.category === 'Sanction')
            .map(e => ({
                position: toNormalizedPosition(e.timestamp)
            })),
        turnoversByPosition: clusterCounts(
            events.filter(e => e.teamId === selectedTeamId && e.category === 'Turnover').map(e => e.timestamp),
            toNormalizedPosition
        ),
        savesByPosition: clusterCounts(
            events
                .filter(e => e.teamId === selectedTeamId && e.category === 'Shot' && e.action === 'Save')
                .map(e => e.timestamp),
            toNormalizedPosition
        ),
        maxGoals: maxGoalValue,
    };
}
