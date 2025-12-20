import type {
    MatchEvent,
    ZoneType,
    ShotResult,
    TurnoverType,
    SanctionType,
} from '../../../types';

export type EventCategory = 'Shot' | 'Sanction' | 'Turnover';

const SHOT_ACTIONS: ShotResult[] = ['Goal', 'Save', 'Miss', 'Post', 'Block'];
const TURNOVER_ACTIONS: TurnoverType[] = [
    'Pass',
    'Catch',
    'Dribble',
    'Steps',
    'Area',
    'Offensive Foul',
];
const SANCTION_ACTIONS: SanctionType[] = ['Foul', 'Yellow', '2min', 'Red', 'Blue Card'];

type BaseEventState = {
    selectedPlayerId: string;
    selectedOpponentGkId: string;
    selectedZone: ZoneType | null;
    selectedTarget?: number;
    isCollective: boolean;
    hasOpposition: boolean;
    isCounterAttack: boolean;
    showDeleteConfirmation: boolean;
};

export type ShotEventState = BaseEventState & {
    selectedCategory: 'Shot';
    selectedAction: ShotResult | null;
};

export type TurnoverEventState = BaseEventState & {
    selectedCategory: 'Turnover';
    selectedAction: TurnoverType | null;
};

export type SanctionEventState = BaseEventState & {
    selectedCategory: 'Sanction';
    selectedAction: SanctionType | null;
};

export type EventFormState = ShotEventState | TurnoverEventState | SanctionEventState;

export type EventFormAction =
    | { type: 'selectPlayer'; playerId: string }
    | { type: 'selectOpponentGk'; playerId: string }
    | { type: 'selectCategory'; category: EventCategory }
    | { type: 'selectAction'; action: ShotResult | TurnoverType | SanctionType | null }
    | { type: 'selectZone'; zone: ZoneType | null }
    | { type: 'selectTarget'; target?: number }
    | { type: 'toggleCollective'; value: boolean }
    | { type: 'toggleOpposition'; value: boolean }
    | { type: 'toggleCounterAttack'; value: boolean }
    | { type: 'resetAfterSave'; resetPlayer: boolean }
    | { type: 'openDelete' }
    | { type: 'closeDelete' }
    | { type: 'replaceState'; state: EventFormState };

type InitializeParams = {
    event?: MatchEvent | null;
    initialState?: {
        playerId?: string;
        opponentGoalkeeperId?: string;
    };
};

type FormRule = (state: EventFormState) => EventFormState;

const forceOppositionOnFoul: FormRule = (state) => {
    if (
        (state.selectedCategory === 'Sanction' && state.selectedAction === 'Foul') ||
        (state.selectedCategory === 'Turnover' && state.selectedAction === 'Offensive Foul')
    ) {
        return { ...state, hasOpposition: true };
    }
    return state;
};

const forceCollectiveOnPass: FormRule = (state) => {
    if (state.selectedCategory === 'Turnover' && state.selectedAction === 'Pass') {
        return { ...state, isCollective: true };
    }
    return state;
};

const normalizePenaltyShot: FormRule = (state) => {
    if (state.selectedCategory === 'Shot' && state.selectedZone === '7m') {
        return {
            ...state,
            isCollective: false,
            hasOpposition: false,
            isCounterAttack: false,
        };
    }
    return state;
};

const clearTargetForNonShots: FormRule = (state) => {
    if (state.selectedCategory !== 'Shot') {
        return { ...state, selectedTarget: undefined };
    }
    return state;
};

const formRules: FormRule[] = [
    forceOppositionOnFoul,
    forceCollectiveOnPass,
    normalizePenaltyShot,
    clearTargetForNonShots,
];

export const applyFormRules = (state: EventFormState): EventFormState =>
    formRules.reduce((current, rule) => rule(current), state);

const sanitizeAction = (
    category: EventCategory,
    action: ShotResult | TurnoverType | SanctionType | null,
): ShotResult | TurnoverType | SanctionType | null => {
    if (category === 'Shot') {
        return SHOT_ACTIONS.includes(action as ShotResult) ? (action as ShotResult) : null;
    }
    if (category === 'Turnover') {
        return TURNOVER_ACTIONS.includes(action as TurnoverType) ? (action as TurnoverType) : null;
    }
    return SANCTION_ACTIONS.includes(action as SanctionType) ? (action as SanctionType) : null;
};

export const initializeState = ({ event, initialState }: InitializeParams): EventFormState => {
    const baseState: EventFormState = {
        selectedPlayerId: event?.playerId || initialState?.playerId || '',
        selectedOpponentGkId: initialState?.opponentGoalkeeperId || '',
        selectedCategory: (event?.category as EventCategory) || 'Shot',
        selectedAction: sanitizeAction(
            (event?.category as EventCategory) || 'Shot',
            (event?.action as ShotResult | TurnoverType | SanctionType | null) || null,
        ),
        selectedZone: event?.zone || null,
        selectedTarget: event?.goalTarget,
        isCollective: event?.isCollective ?? true,
        hasOpposition: event?.hasOpposition ?? false,
        isCounterAttack: event?.isCounterAttack ?? false,
        showDeleteConfirmation: false,
    };

    return applyFormRules(baseState);
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
            return applyFormRules(nextState);
        }
        case 'selectAction':
            return applyFormRules({
                ...state,
                selectedAction: sanitizeAction(state.selectedCategory, action.action),
            } as EventFormState);
        case 'selectZone':
            return applyFormRules({ ...state, selectedZone: action.zone } as EventFormState);
        case 'selectTarget':
            return { ...state, selectedTarget: action.target };
        case 'toggleCollective':
            return applyFormRules({ ...state, isCollective: action.value } as EventFormState);
        case 'toggleOpposition':
            return applyFormRules({ ...state, hasOpposition: action.value } as EventFormState);
        case 'toggleCounterAttack':
            return applyFormRules({ ...state, isCounterAttack: action.value } as EventFormState);
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

            return applyFormRules(resetState);
        }
        case 'openDelete':
            return { ...state, showDeleteConfirmation: true };
        case 'closeDelete':
            return { ...state, showDeleteConfirmation: false };
        case 'replaceState':
            return applyFormRules(action.state);
        default:
            return state;
    }
};

export const hasGoalTarget = (category: EventCategory, action: ShotResult | null) => {
    if (category !== 'Shot') return false;
    return !['Miss', 'Post', 'Block'].includes(action || '');
};
