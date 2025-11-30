import { describe, it, expect } from 'vitest';
import { FLOW_CONFIG } from './flows';
import { ZONE_CONFIG } from './zones';
import type { ZoneType } from '../types';

describe('FLOW_CONFIG', () => {
    describe('Shot Flow', () => {
        it('should have correct steps', () => {
            expect(FLOW_CONFIG.Shot.steps).toEqual(['ZONE', 'CONTEXT', 'RESULT']);
        });

        describe('getAvailableActions', () => {
            it('should return all actions including Block for non-penalty zones', () => {
                const actions = FLOW_CONFIG.Shot.getAvailableActions('6m-center' as ZoneType);
                expect(actions).toContain('Block');
                expect(actions).toContain('Goal');
                expect(actions).toContain('Save');
                expect(actions).toContain('Miss');
                expect(actions).toContain('Post');
            });

            it('should exclude Block for penalty zone (7m)', () => {
                const actions = FLOW_CONFIG.Shot.getAvailableActions(ZONE_CONFIG.penalty.zone);
                expect(actions).not.toContain('Block');
                expect(actions).toContain('Goal');
            });
        });

        describe('showContext', () => {
            it('should return true for non-penalty zones', () => {
                expect(FLOW_CONFIG.Shot.showContext('6m-center' as ZoneType)).toBe(true);
                expect(FLOW_CONFIG.Shot.showContext('9m-center' as ZoneType)).toBe(true);
            });

            it('should return false for penalty zone', () => {
                expect(FLOW_CONFIG.Shot.showContext(ZONE_CONFIG.penalty.zone)).toBe(false);
            });
        });
    });

    describe('Turnover Flow', () => {
        it('should have correct actions', () => {
            expect(FLOW_CONFIG.Turnover.actions).toEqual([
                'Pass', 'Catch', 'Dribble', 'Steps', 'Area', 'Offensive Foul'
            ]);
        });
    });

    describe('Sanction Flow', () => {
        it('should have correct actions', () => {
            expect(FLOW_CONFIG.Sanction.actions).toEqual([
                'Foul', 'Yellow', '2min', 'Red', 'Blue Card'
            ]);
        });

        it('should hide 7m zone', () => {
            expect(FLOW_CONFIG.Sanction.hideZone(ZONE_CONFIG.penalty.zone)).toBe(true);
            expect(FLOW_CONFIG.Sanction.hideZone('6m-center')).toBe(false);
        });
    });
});
