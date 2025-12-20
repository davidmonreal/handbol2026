import { describe, expect, it } from 'vitest';
import {
    applyFormRules,
    eventFormReducer,
    hasGoalTarget,
    type EventFormState,
} from '../eventFormStateMachine';

const buildState = (overrides: Partial<EventFormState> = {}): EventFormState => ({
    selectedPlayerId: 'p1',
    selectedOpponentGkId: '',
    selectedCategory: 'Shot',
    selectedAction: 'Goal',
    selectedZone: '6m-LW',
    selectedTarget: 5,
    isCollective: false,
    hasOpposition: false,
    isCounterAttack: true,
    showDeleteConfirmation: false,
    ...overrides,
});

describe('eventFormStateMachine rules', () => {
    it('enforces opposition on fouls', () => {
        const sanctionState = applyFormRules(
            buildState({ selectedCategory: 'Sanction', selectedAction: 'Foul', hasOpposition: false }),
        );
        expect(sanctionState.hasOpposition).toBe(true);

        const turnoverState = applyFormRules(
            buildState({ selectedCategory: 'Turnover', selectedAction: 'Offensive Foul', hasOpposition: false }),
        );
        expect(turnoverState.hasOpposition).toBe(true);
    });

    it('forces collective on turnover pass', () => {
        const state = applyFormRules(
            buildState({ selectedCategory: 'Turnover', selectedAction: 'Pass', isCollective: false }),
        );
        expect(state.isCollective).toBe(true);
    });

    it('clears goal target for non-shots', () => {
        const state = applyFormRules(buildState({ selectedCategory: 'Turnover', selectedTarget: 9 }));
        expect(state.selectedTarget).toBeUndefined();
    });

    it('normalizes penalty shots', () => {
        const state = applyFormRules(
            buildState({
                selectedCategory: 'Shot',
                selectedZone: '7m',
                isCollective: true,
                hasOpposition: true,
                isCounterAttack: true,
            }),
        );
        expect(state.isCollective).toBe(false);
        expect(state.hasOpposition).toBe(false);
        expect(state.isCounterAttack).toBe(false);
    });

    it('hasGoalTarget only for valid shot outcomes', () => {
        expect(hasGoalTarget('Shot', 'Goal')).toBe(true);
        expect(hasGoalTarget('Shot', 'Save')).toBe(true);
        expect(hasGoalTarget('Shot', 'Miss')).toBe(false);
        expect(hasGoalTarget('Turnover', null)).toBe(false);
    });

    it('sanitizes invalid actions when dispatching', () => {
        const initial = buildState({ selectedCategory: 'Shot', selectedAction: 'Goal' });
        const state = eventFormReducer(initial, { type: 'selectAction', action: 'Pass' });
        expect(state.selectedAction).toBeNull();
    });
});
