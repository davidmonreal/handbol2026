import type { MatchEvent, ZoneType } from '../../../types';

export type EventCategory = 'Shot' | 'Sanction' | 'Turnover';

export type EventFormState = {
    selectedPlayerId: string;
    selectedOpponentGkId: string;
    selectedCategory: EventCategory;
    selectedAction: string | null;
    selectedZone: ZoneType | null;
    selectedTarget?: number;
    isCollective: boolean;
    hasOpposition: boolean;
    isCounterAttack: boolean;
    showDeleteConfirmation: boolean;
};

export type EventFormAction =
    | { type: 'selectPlayer'; playerId: string }
    | { type: 'selectOpponentGk'; playerId: string }
    | { type: 'selectCategory'; category: EventCategory }
    | { type: 'selectAction'; action: string | null }
    | { type: 'selectZone'; zone: ZoneType | null }
    | { type: 'selectTarget'; target?: number }
    | { type: 'toggleCollective'; value: boolean }
    | { type: 'toggleOpposition'; value: boolean }
    | { type: 'toggleCounterAttack'; value: boolean }
    | { type: 'resetAfterSave'; resetPlayer: boolean }
    | { type: 'openDelete' }
    | { type: 'closeDelete' };

type InitializeParams = {
    event?: MatchEvent | null;
    initialState?: {
        playerId?: string;
        opponentGoalkeeperId?: string;
    };
};

const mustHaveOpposition = (state: EventFormState) =>
    (state.selectedCategory === 'Sanction' && state.selectedAction === 'Foul') ||
    (state.selectedCategory === 'Turnover' && state.selectedAction === 'Offensive Foul');

const mustBeCollective = (state: EventFormState) =>
    state.selectedCategory === 'Turnover' && state.selectedAction === 'Pass';

const applyBusinessRules = (state: EventFormState): EventFormState => {
    const next = { ...state };

    if (mustHaveOpposition(next)) {
        next.hasOpposition = true;
    }

    if (mustBeCollective(next)) {
        next.isCollective = true;
    }

    const isPenaltyShot = next.selectedCategory === 'Shot' && next.selectedZone === '7m';
    if (isPenaltyShot) {
        next.isCollective = false;
        next.hasOpposition = false;
        next.isCounterAttack = false;
    }

    if (next.selectedCategory !== 'Shot') {
        next.selectedTarget = undefined;
    }

    return next;
};

export const initializeState = ({ event, initialState }: InitializeParams): EventFormState => {
    const baseState: EventFormState = {
        selectedPlayerId: event?.playerId || initialState?.playerId || '',
        selectedOpponentGkId: initialState?.opponentGoalkeeperId || '',
        selectedCategory: (event?.category as EventCategory) || 'Shot',
        selectedAction: event?.action || null,
        selectedZone: event?.zone || null,
        selectedTarget: event?.goalTarget,
        isCollective: event?.isCollective ?? true,
        hasOpposition: event?.hasOpposition ?? false,
        isCounterAttack: event?.isCounterAttack ?? false,
        showDeleteConfirmation: false,
    };

    return applyBusinessRules(baseState);
};

export const eventFormReducer = (state: EventFormState, action: EventFormAction): EventFormState => {
    switch (action.type) {
        case 'selectPlayer':
            return { ...state, selectedPlayerId: action.playerId };
        case 'selectOpponentGk':
            return { ...state, selectedOpponentGkId: action.playerId };
        case 'selectCategory': {
            const nextState: EventFormState = {
                ...state,
                selectedCategory: action.category,
                selectedAction: action.category === 'Sanction' ? 'Foul' : null,
                selectedTarget: undefined,
            };
            if (action.category === 'Sanction') {
                nextState.hasOpposition = true;
            }
            return applyBusinessRules(nextState);
        }
        case 'selectAction':
            return applyBusinessRules({ ...state, selectedAction: action.action });
        case 'selectZone':
            return applyBusinessRules({ ...state, selectedZone: action.zone });
        case 'selectTarget':
            return { ...state, selectedTarget: action.target };
        case 'toggleCollective':
            return applyBusinessRules({ ...state, isCollective: action.value });
        case 'toggleOpposition':
            return applyBusinessRules({ ...state, hasOpposition: action.value });
        case 'toggleCounterAttack':
            return applyBusinessRules({ ...state, isCounterAttack: action.value });
        case 'resetAfterSave': {
            const resetState: EventFormState = {
                ...state,
                selectedCategory: 'Shot',
                selectedAction: null,
                selectedZone: null,
                selectedTarget: undefined,
                isCollective: true,
                hasOpposition: false,
                isCounterAttack: false,
                showDeleteConfirmation: false,
            };

            if (action.resetPlayer) {
                resetState.selectedPlayerId = '';
            }

            return applyBusinessRules(resetState);
        }
        case 'openDelete':
            return { ...state, showDeleteConfirmation: true };
        case 'closeDelete':
            return { ...state, showDeleteConfirmation: false };
        default:
            return state;
    }
};

export const hasGoalTarget = (category: EventCategory, action: string | null) => {
    if (category !== 'Shot') return false;
    return !['Miss', 'Post', 'Block'].includes(action || '');
};
