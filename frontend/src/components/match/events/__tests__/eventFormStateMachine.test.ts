import { describe, expect, it } from 'vitest';
import {
    eventFormReducer,
    hasGoalTarget,
    initializeState,
    type EventFormState,
} from '../eventFormStateMachine';

const baseState = (overrides?: Partial<EventFormState>) =>
    ({
        ...initializeState({ event: null, initialState: { playerId: 'player-1' } }),
        ...overrides,
    }) as EventFormState;

describe('eventFormStateMachine', () => {
    it('initializes with defaults and applies mandatory opposition for sanctions', () => {
        const state = baseState();

        const sanctionState = eventFormReducer(state, {
            type: 'selectCategory',
            category: 'Sanction',
        });

        expect(sanctionState.selectedAction).toBe('Foul');
        expect(sanctionState.hasOpposition).toBe(true);
    });

    it('forces collective plays on turnover pass and prevents toggling it off', () => {
        const turnoverState = eventFormReducer(
            baseState(),
            { type: 'selectCategory', category: 'Turnover' },
        );
        const passState = eventFormReducer(turnoverState, {
            type: 'selectAction',
            action: 'Pass',
        });
        expect(passState.isCollective).toBe(true);

        const toggledOff = eventFormReducer(passState, {
            type: 'toggleCollective',
            value: false,
        });
        expect(toggledOff.isCollective).toBe(true);
    });

    it('applies penalty shot rules when zone is 7m', () => {
        const penaltyState = eventFormReducer(baseState(), {
            type: 'selectZone',
            zone: '7m',
        });

        expect(penaltyState.isCollective).toBe(false);
        expect(penaltyState.hasOpposition).toBe(false);
        expect(penaltyState.isCounterAttack).toBe(false);
    });

    it('resets to defaults after save and can clear player when creating', () => {
        const withCustom = baseState({
            selectedCategory: 'Turnover',
            selectedAction: 'Pass',
            selectedZone: '6m-LW',
            hasOpposition: true,
            isCollective: true,
            isCounterAttack: true,
        });

        const resetState = eventFormReducer(withCustom, {
            type: 'resetAfterSave',
            resetPlayer: true,
        });

        expect(resetState.selectedCategory).toBe('Shot');
        expect(resetState.selectedAction).toBeNull();
        expect(resetState.selectedZone).toBeNull();
        expect(resetState.isCounterAttack).toBe(false);
        expect(resetState.selectedPlayerId).toBe('');
    });

    it('guards goal target visibility for shot actions only', () => {
        expect(hasGoalTarget('Shot', 'Goal')).toBe(true);
        expect(hasGoalTarget('Shot', 'Post')).toBe(false);
        expect(hasGoalTarget('Turnover', 'Pass')).toBe(false);
    });
});
