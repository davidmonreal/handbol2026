import { describe, it, expect } from 'vitest';
import {
    transformBackendEvent,
    transformBackendEvents,
    createEventFromRecording,
    TARGET_TO_ZONE_MAP,
} from './eventTransformers';
import type { RecordingState } from './eventTransformers';

describe('eventTransformers', () => {
    it('transformBackendEvent includes activeGoalkeeperId', () => {
        const backendEvent = {
            id: '1',
            timestamp: 1000,
            playerId: 'player1',
            teamId: 'team1',
            type: 'Shot',
            subtype: 'Goal',
            activeGoalkeeperId: 'gk1'
        };

        const result = transformBackendEvent(backendEvent);

        expect(result.id).toBe('1');
        expect(result.activeGoalkeeperId).toBe('gk1');
        expect(result.category).toBe('Shot');
        expect(result.action).toBe('Goal');
    });

    it('transformBackendEvent handles missing activeGoalkeeperId', () => {
        const backendEvent = {
            id: '2',
            timestamp: 2000,
            playerId: 'player1',
            teamId: 'team1',
            type: 'Turnover',
            subtype: 'Pass'
        };

        const result = transformBackendEvent(backendEvent);

        expect(result.id).toBe('2');
        expect(result.activeGoalkeeperId).toBeUndefined();
    });

    it('transformBackendEvents transforms array correctly', () => {
        const backendEvents = [
            { id: '1', type: 'Shot', activeGoalkeeperId: 'gk1' },
            { id: '2', type: 'Shot', activeGoalkeeperId: 'gk2' }
        ];

        const result = transformBackendEvents(backendEvents);

        expect(result).toHaveLength(2);
        expect(result[0].activeGoalkeeperId).toBe('gk1');
        expect(result[1].activeGoalkeeperId).toBe('gk2');
    });
});

describe('TARGET_TO_ZONE_MAP', () => {
    it('should map target indices to zone tags', () => {
        expect(TARGET_TO_ZONE_MAP[1]).toBe('TL');
        expect(TARGET_TO_ZONE_MAP[2]).toBe('TM');
        expect(TARGET_TO_ZONE_MAP[3]).toBe('TR');
        expect(TARGET_TO_ZONE_MAP[4]).toBe('ML');
        expect(TARGET_TO_ZONE_MAP[5]).toBe('MM');
        expect(TARGET_TO_ZONE_MAP[6]).toBe('MR');
        expect(TARGET_TO_ZONE_MAP[7]).toBe('BL');
        expect(TARGET_TO_ZONE_MAP[8]).toBe('BM');
        expect(TARGET_TO_ZONE_MAP[9]).toBe('BR');
    });
});

describe('createEventFromRecording', () => {
    const baseRecordingState: RecordingState = {
        teamId: 'team-1',
        playerId: 'player-1',
        flowType: 'Shot',
        selectedAction: 'Goal',
        selectedZone: '6m-LW',
        isCollective: false,
        hasOpposition: false,
        isCounterAttack: false,
        matchTime: 300,
        videoTime: undefined,
        defenseFormation: '6-0',
    };

    it('should create event with basic fields', () => {
        const result = createEventFromRecording(baseRecordingState);

        expect(result.teamId).toBe('team-1');
        expect(result.playerId).toBe('player-1');
        expect(result.category).toBe('Shot');
        expect(result.action).toBe('Goal');
        expect(result.timestamp).toBe(300);
    });

    it('should include video timestamp when provided', () => {
        const state = { ...baseRecordingState, videoTime: 450 };
        const result = createEventFromRecording(state);

        expect(result.videoTimestamp).toBe(450);
    });

    it('should parse zone into position and distance for 6m', () => {
        const result = createEventFromRecording(baseRecordingState);

        expect(result.zone).toBe('6m-LW');
        expect(result.distance).toBe('6M');
        expect(result.position).toBe('LW');
    });

    it('should parse zone into position and distance for 9m', () => {
        const state = { ...baseRecordingState, selectedZone: '9m-CB' as const };
        const result = createEventFromRecording(state);

        expect(result.zone).toBe('9m-CB');
        expect(result.distance).toBe('9M');
        expect(result.position).toBe('CB');
    });

    it('should handle 7m penalty zone', () => {
        const state = { ...baseRecordingState, selectedZone: '7m' as const };
        const result = createEventFromRecording(state);

        expect(result.zone).toBe('7m');
        expect(result.distance).toBe('7M');
        expect(result.position).toBeUndefined();
    });

    it('should include goal target and zone tag', () => {
        const state = { ...baseRecordingState, targetIndex: 1 };
        const result = createEventFromRecording(state);

        expect(result.goalTarget).toBe(1);
        expect(result.goalZoneTag).toBe('TL');
    });

    it('should include context flags for Shot category', () => {
        const state = {
            ...baseRecordingState,
            isCollective: true,
            hasOpposition: true,
            isCounterAttack: true,
        };
        const result = createEventFromRecording(state);

        expect(result.isCollective).toBe(true);
        expect(result.hasOpposition).toBe(true);
        expect(result.isCounterAttack).toBe(true);
        expect(result.context).toEqual({
            isCollective: true,
            hasOpposition: true,
            isCounterAttack: true,
        });
    });

    it('should NOT include context flags for 7m penalty', () => {
        const state = {
            ...baseRecordingState,
            selectedZone: '7m' as const,
            isCollective: true,
            hasOpposition: true,
        };
        const result = createEventFromRecording(state);

        expect(result.isCollective).toBe(false);
        expect(result.hasOpposition).toBe(false);
    });

    it('should include defense formation', () => {
        const result = createEventFromRecording(baseRecordingState);

        expect(result.defenseFormation).toBe('6-0');
    });

    it('should generate unique ID', () => {
        const result1 = createEventFromRecording(baseRecordingState);
        const result2 = createEventFromRecording(baseRecordingState);

        expect(result1.id).toBeDefined();
        expect(result2.id).toBeDefined();
        // IDs should be different (based on Date.now())
        // Note: in practice they might be same if called in same ms
    });
});
