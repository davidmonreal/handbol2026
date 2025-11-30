import type { MatchEvent } from '../types';

/**
 * Helper function to convert goalZone to goalTarget (1-9)
 */
export const goalZoneToTarget = (zone: string | null): number | undefined => {
    if (!zone) return undefined;
    const zoneMap: Record<string, number> = {
        'TL': 1, 'TM': 2, 'TR': 3,
        'ML': 4, 'MM': 5, 'MR': 6,
        'BL': 7, 'BM': 8, 'BR': 9,
    };
    return zoneMap[zone];
};

/**
 * Helper function to convert position+distance to zone format
 */
export const positionDistanceToZone = (position: string | null, distance: string | null): any => {
    if (!position || !distance) return undefined;

    // Map backend position+distance to frontend zone format
    if (distance === '7M') return '7m';

    const distancePrefix = distance === '6M' ? '6m' : '9m';
    return `${distancePrefix}-${position.toUpperCase()}` as any;
};

/**
 * Transforms backend event data to frontend MatchEvent format
 */
export const transformBackendEvent = (e: any): MatchEvent => ({
    id: e.id,
    timestamp: e.timestamp,
    playerId: e.playerId,
    playerName: e.player?.name,
    playerNumber: e.player?.number,
    teamId: e.teamId,
    category: e.type, // 'Shot', 'Turnover', 'Sanction'
    action: (e.type === 'Sanction' && e.sanctionType) ? e.sanctionType : (e.subtype || e.type),
    zone: positionDistanceToZone(e.position, e.distance), // Convert position+distance to zone
    goalTarget: goalZoneToTarget(e.goalZone), // Convert goalZone to number 1-9
    context: {
        isCollective: e.isCollective,
        hasOpposition: e.hasOpposition,
        isCounterAttack: e.isCounterAttack,
    },
    defenseFormation: undefined,
});

/**
 * Transforms an array of backend events
 */
export const transformBackendEvents = (events: any[]): MatchEvent[] => {
    return events.map(transformBackendEvent);
};
