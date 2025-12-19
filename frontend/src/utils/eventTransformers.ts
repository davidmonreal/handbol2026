import type { MatchEvent, ZoneType, FlowType } from '../types';
import { ZONE_CONFIG } from '../config/zones';

/**
 * Map target index (1-9) to goal zone tag
 */
export const TARGET_TO_ZONE_MAP: Record<number, string> = {
    1: 'TL', 2: 'TM', 3: 'TR',
    4: 'ML', 5: 'MM', 6: 'MR',
    7: 'BL', 8: 'BM', 9: 'BR',
};

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
 * (Fallback only — backend now provides canonical `zone` on all GameEvents)
 */
export const positionDistanceToZone = (position: string | null, distance: string | null): ZoneType | undefined => {
    if (!position || !distance) return undefined;

    // Map backend position+distance to frontend zone format
    if (distance === '7M') return '7m';

    const distancePrefix = distance === '6M' ? '6m' : '9m';
    return `${distancePrefix}-${position.toUpperCase()}` as ZoneType;
};

export interface BackendEvent {
    id: string;
    timestamp: number;
    matchId?: string;
    playerId?: string | null;
    player?: {
        name: string;
        number: number;
    };
    teamId: string;
    type: string;
    subtype?: string | null;
    sanctionType?: string;
    position?: string;
    distance?: string;
    zone?: string; // Canonical zone derived by backend (e.g. '7m' or '6m-LW')
    goalZone?: string;
    isCollective?: boolean;
    hasOpposition?: boolean;
    isCounterAttack?: boolean;
    activeGoalkeeperId?: string;
}

/**
 * Transforms backend event data to frontend MatchEvent format
 */
export const transformBackendEvent = (e: BackendEvent): MatchEvent => ({
    id: e.id,
    timestamp: e.timestamp,
    playerId: e.playerId ?? null,
    playerName: e.player?.name,
    playerNumber: e.player?.number,
    teamId: e.teamId,
    matchId: e.matchId,
    category: e.type,
    action: (e.type === 'Sanction' && e.sanctionType) ? e.sanctionType : (e.subtype || e.type),
    zone: e.zone as ZoneType | undefined, // Use canonical zone from backend
    goalTarget: goalZoneToTarget(e.goalZone || null), // Convert goalZone to number 1-9
    isCollective: e.isCollective,
    hasOpposition: e.hasOpposition,
    isCounterAttack: e.isCounterAttack,
    context: {
        isCollective: e.isCollective,
        hasOpposition: e.hasOpposition,
        isCounterAttack: e.isCounterAttack,
    },
    defenseFormation: undefined,
    activeGoalkeeperId: e.activeGoalkeeperId, // Add goalkeeper ID from backend
});

/**
 * Transforms an array of backend events
 */
export const transformBackendEvents = (events: BackendEvent[]): MatchEvent[] => {
    return events.map(transformBackendEvent);
};

/**
 * State for recording a new event
 */
export interface RecordingState {
    teamId: string;
    playerId: string;
    flowType: FlowType;
    selectedAction: string;
    selectedZone: ZoneType | null;
    isCollective: boolean;
    hasOpposition: boolean;
    isCounterAttack: boolean;
    matchTime: number;
    videoTime?: number;
    defenseFormation?: string;
    targetIndex?: number;
}

/**
 * Parse zone string into position and distance
 */
const parseZone = (zone: ZoneType | null): { position?: string; distance?: string } => {
    if (!zone) return {};

    if (zone === '7m') {
        return { distance: '7M', position: undefined };
    }

    const parts = zone.split('-');
    if (parts.length === 2) {
        const distance = parts[0] === '6m' ? '6M' : '9M';
        const position = parts[1];
        return { distance, position };
    }

    return {};
};

/**
 * Create a MatchEvent from recording state
 * Extracts logic from VideoMatchTracker.handleFinalizeEvent
 */
export const createEventFromRecording = (state: RecordingState): MatchEvent => {
    const { position, distance } = parseZone(state.selectedZone);
    const isPenalty = state.selectedZone === ZONE_CONFIG.penalty.zone;

    // Context flags are disabled for 7m penalty
    const isCollective = isPenalty ? false : state.isCollective;
    const hasOpposition = isPenalty ? false : state.hasOpposition;
    const isCounterAttack = isPenalty ? false : state.isCounterAttack;

    const goalZoneTag = state.targetIndex ? TARGET_TO_ZONE_MAP[state.targetIndex] : undefined;

    return {
        id: Date.now().toString(),
        timestamp: state.matchTime,
        videoTimestamp: state.videoTime,
        teamId: state.teamId,
        playerId: state.playerId,
        category: state.flowType!,
        action: state.selectedAction,
        zone: state.selectedZone || undefined,
        position,
        distance,
        goalTarget: state.targetIndex,
        goalZoneTag,
        isCollective: state.flowType === 'Shot' ? isCollective : undefined,
        hasOpposition: state.flowType === 'Shot' ? hasOpposition : undefined,
        isCounterAttack: state.flowType === 'Shot' ? isCounterAttack : undefined,
        context: state.flowType === 'Shot' ? {
            isCollective,
            hasOpposition,
            isCounterAttack,
        } : undefined,
        defenseFormation: state.defenseFormation,
    };
};
