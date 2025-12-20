import type {
    MatchEvent,
    SanctionType,
    ZoneType,
    ShotResult,
    TurnoverType,
} from '../../../types';

/**
 * Construïm l'objecte MatchEvent en un helper pur per aïllar la lògica
 * de mapping (zones, target, sancions) de la UI. Així podem testar-ho
 * sense React i reduïm risc de regressions visuals.
 */
export interface EventFormState {
    teamId: string;
    selectedPlayerId: string;
    selectedCategory: 'Shot' | 'Turnover' | 'Sanction';
    selectedAction: ShotResult | TurnoverType | SanctionType | null;
    selectedZone: ZoneType | null;
    selectedTarget?: number;
    isCollective: boolean;
    hasOpposition: boolean;
    isCounterAttack: boolean;
    opponentGoalkeeperId?: string;
}

export interface BuildEventOptions {
    baseEvent?: MatchEvent | null;
    idFactory?: () => string;
}

export function buildEventFromForm(state: EventFormState, options?: BuildEventOptions): MatchEvent {
    const baseEvent = options?.baseEvent;
    const id = baseEvent?.id ?? options?.idFactory?.() ?? crypto.randomUUID();

    const updatedEvent: MatchEvent = {
        ...(baseEvent || {} as MatchEvent),
        id,
        teamId: state.teamId,
        playerId: state.selectedPlayerId,
        category: state.selectedCategory,
        action: state.selectedAction || '',
        zone: state.selectedZone || undefined,
        isCollective: state.isCollective,
        hasOpposition: state.hasOpposition,
        isCounterAttack: state.isCounterAttack,
    };

    // Parse zone -> distance/position for backend
    if (state.selectedZone) {
        if (state.selectedZone === '7m') {
            updatedEvent.distance = '7M';
            updatedEvent.position = undefined;
        } else {
            const [distanceTag, position] = state.selectedZone.split('-');
            updatedEvent.distance = distanceTag === '6m' ? '6M' : '9M';
            updatedEvent.position = position;
        }
    } else {
        updatedEvent.distance = undefined;
        updatedEvent.position = undefined;
    }

    // Goal target -> goalZoneTag mapping
    if (state.selectedTarget && (state.selectedAction === 'Goal' || state.selectedAction === 'Save')) {
        updatedEvent.goalTarget = state.selectedTarget;
        const targetToZoneMap: Record<number, string> = {
            1: 'TL', 2: 'TM', 3: 'TR',
            4: 'ML', 5: 'MM', 6: 'MR',
            7: 'BL', 8: 'BM', 9: 'BR'
        };
        updatedEvent.goalZoneTag = targetToZoneMap[state.selectedTarget];
    } else {
        updatedEvent.goalTarget = undefined;
        updatedEvent.goalZoneTag = undefined;
    }

    // Sanction mapping
    updatedEvent.sanctionType = state.selectedCategory === 'Sanction'
        ? (state.selectedAction as SanctionType | null) ?? undefined
        : undefined;

    if (state.opponentGoalkeeperId) {
        updatedEvent.opponentGoalkeeperId = state.opponentGoalkeeperId;
    } else {
        updatedEvent.opponentGoalkeeperId = undefined;
    }

    return updatedEvent;
}
