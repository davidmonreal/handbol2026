import { describe, it, expect } from 'vitest';
import type { MatchEvent } from '../../../../types';
import { buildEventFromForm, type EventFormState } from '../eventFormBuilder';

const buildState = (overrides: Partial<EventFormState> = {}): EventFormState => ({
    teamId: 'team-1',
    selectedPlayerId: 'player-1',
    selectedCategory: 'Shot',
    selectedAction: 'Goal',
    selectedZone: '6m-LW',
    selectedTarget: 5,
    isCollective: true,
    hasOpposition: false,
    isCounterAttack: false,
    ...overrides,
});

const baseEvent: MatchEvent = {
    id: 'existing',
    timestamp: 0,
    teamId: 'team-1',
    playerId: 'player-1',
    category: 'Shot',
    action: 'Goal',
};

describe('buildEventFromForm', () => {
    it('preserves id when editing and maps zone to distance/position', () => {
        const event = buildEventFromForm(buildState({ selectedZone: '9m-RB' }), { baseEvent });

        expect(event.id).toBe('existing');
        expect(event.distance).toBe('9M');
        expect(event.position).toBe('RB');
        expect(event.zone).toBe('9m-RB');
    });

    it('maps 7m zone to distance without position', () => {
        const event = buildEventFromForm(buildState({ selectedZone: '7m' }), { idFactory: () => 'new-id' });
        expect(event.distance).toBe('7M');
        expect(event.position).toBeUndefined();
    });

    it('assigns goal target and zone tag only for Goal/Save', () => {
        const goalEvent = buildEventFromForm(buildState({ selectedTarget: 9, selectedAction: 'Goal' }), { idFactory: () => 'goal-id' });
        expect(goalEvent.goalTarget).toBe(9);
        expect(goalEvent.goalZoneTag).toBe('BR');

        const missEvent = buildEventFromForm(buildState({ selectedAction: 'Miss', selectedTarget: 9 }), { idFactory: () => 'miss-id' });
        expect(missEvent.goalTarget).toBeUndefined();
        expect(missEvent.goalZoneTag).toBeUndefined();
    });

    it('sets sanction type only for sanctions', () => {
        const foulEvent = buildEventFromForm(buildState({ selectedCategory: 'Sanction', selectedAction: 'Yellow' }), { idFactory: () => 's1' });
        expect(foulEvent.sanctionType).toBe('Yellow');

        const shotEvent = buildEventFromForm(buildState({ selectedCategory: 'Shot', selectedAction: 'Goal' }), { idFactory: () => 's2' });
        expect(shotEvent.sanctionType).toBeUndefined();
    });

    it('copies opponent goalkeeper only when provided', () => {
        const withGk = buildEventFromForm(buildState({ opponentGoalkeeperId: 'gk-1' }), { idFactory: () => 'with' });
        expect(withGk.opponentGoalkeeperId).toBe('gk-1');

        const withoutGk = buildEventFromForm(buildState({ opponentGoalkeeperId: undefined }), { idFactory: () => 'without' });
        expect(withoutGk.opponentGoalkeeperId).toBeUndefined();
    });
});
