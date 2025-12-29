import type {
    MatchEvent,
    ZoneType,
    ShotResult,
    TurnoverType,
    SanctionType,
} from '../../../types';
import {
    sanctionActionValues,
    shotActionValues,
    turnoverActionValues,
} from './actionCatalog';

export type EventCategory = 'Shot' | 'Sanction' | 'Turnover';

const SHOT_ACTIONS: ShotResult[] = [...shotActionValues];
const TURNOVER_ACTIONS: TurnoverType[] = [...turnoverActionValues];
const SANCTION_ACTIONS: SanctionType[] = [...sanctionActionValues];

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

const forceOppositionOnBlock: FormRule = (state) => {
    if (state.selectedCategory === 'Shot' && state.selectedAction === 'Block') {
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
    forceOppositionOnBlock,
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

type BuildInput = BaseEventState & {
    selectedCategory: EventCategory;
    selectedAction: ShotResult | TurnoverType | SanctionType | null;
};

const buildStateForCategory = (input: BuildInput): EventFormState => {
    const action = sanitizeAction(input.selectedCategory, input.selectedAction);
    const common = {
        selectedPlayerId: input.selectedPlayerId,
        selectedOpponentGkId: input.selectedOpponentGkId,
        selectedZone: input.selectedZone,
        selectedTarget: input.selectedTarget,
        isCollective: input.isCollective,
        hasOpposition: input.hasOpposition,
        isCounterAttack: input.isCounterAttack,
        showDeleteConfirmation: input.showDeleteConfirmation,
    };

    if (input.selectedCategory === 'Shot') {
        return { ...common, selectedCategory: 'Shot', selectedAction: action as ShotResult | null };
    }
    if (input.selectedCategory === 'Turnover') {
        return {
            ...common,
            selectedCategory: 'Turnover',
            selectedAction: action as TurnoverType | null,
        };
    }
    return {
        ...common,
        selectedCategory: 'Sanction',
        selectedAction: action as SanctionType | null,
    };
};

const mergeState = (state: EventFormState, patch: Partial<BuildInput>): EventFormState => {
    const category = patch.selectedCategory ?? state.selectedCategory;
    const merged: BuildInput = {
        selectedCategory: category,
        selectedAction:
            patch.selectedAction !== undefined ? patch.selectedAction : state.selectedAction,
        selectedPlayerId: patch.selectedPlayerId ?? state.selectedPlayerId,
        selectedOpponentGkId: patch.selectedOpponentGkId ?? state.selectedOpponentGkId,
        selectedZone: patch.selectedZone ?? state.selectedZone,
        selectedTarget: patch.selectedTarget !== undefined ? patch.selectedTarget : state.selectedTarget,
        isCollective: patch.isCollective ?? state.isCollective,
        hasOpposition: patch.hasOpposition ?? state.hasOpposition,
        isCounterAttack: patch.isCounterAttack ?? state.isCounterAttack,
        showDeleteConfirmation: patch.showDeleteConfirmation ?? state.showDeleteConfirmation,
    };
    return buildStateForCategory(merged);
};

export const initializeState = ({ event, initialState }: InitializeParams): EventFormState => {
    const category = (event?.category as EventCategory) || 'Shot';
    const baseInput: BuildInput = {
        selectedPlayerId: event?.playerId || initialState?.playerId || '',
        selectedOpponentGkId: initialState?.opponentGoalkeeperId || '',
        selectedCategory: category,
        selectedAction:
            (event?.action as ShotResult | TurnoverType | SanctionType | null) || null,
        selectedZone: event?.zone || null,
        selectedTarget: event?.goalTarget,
        isCollective: event?.isCollective ?? true,
        hasOpposition: event?.hasOpposition ?? false,
        isCounterAttack: event?.isCounterAttack ?? false,
        showDeleteConfirmation: false,
    };

    return applyFormRules(buildStateForCategory(baseInput));
};

export const eventFormReducer = (state: EventFormState, action: EventFormAction): EventFormState => {
    switch (action.type) {
        case 'selectPlayer':
            return { ...state, selectedPlayerId: action.playerId };
        case 'selectOpponentGk':
            return { ...state, selectedOpponentGkId: action.playerId };
        case 'selectCategory': {
            const next = mergeState(state, {
                selectedCategory: action.category,
                selectedAction: action.category === 'Sanction' ? 'Foul' : null,
                selectedTarget: undefined,
                hasOpposition: action.category === 'Sanction' ? true : state.hasOpposition,
            });
            return applyFormRules(next);
        }
        case 'selectAction':
            return applyFormRules(
                mergeState(state, {
                    selectedAction: sanitizeAction(state.selectedCategory, action.action),
                }),
            );
        case 'selectZone':
            return applyFormRules(mergeState(state, { selectedZone: action.zone }));
        case 'selectTarget':
            return { ...state, selectedTarget: action.target };
        case 'toggleCollective':
            return applyFormRules(mergeState(state, { isCollective: action.value }));
        case 'toggleOpposition':
            return applyFormRules(mergeState(state, { hasOpposition: action.value }));
        case 'toggleCounterAttack':
            return applyFormRules(mergeState(state, { isCounterAttack: action.value }));
        case 'resetAfterSave': {
            const resetState = mergeState(state, {
                selectedCategory: 'Shot',
                selectedAction: null,
                selectedZone: null,
                selectedTarget: undefined,
                isCollective: true,
                hasOpposition: false,
                isCounterAttack: false,
                showDeleteConfirmation: false,
                selectedPlayerId: action.resetPlayer ? '' : state.selectedPlayerId,
            });

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
