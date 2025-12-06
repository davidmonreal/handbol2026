import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useEventRecording } from './useEventRecording';
import type { ZoneType, FlowType } from '../../types';

describe('useEventRecording', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe('Initial State', () => {
        it('should initialize with null values', () => {
            const { result } = renderHook(() => useEventRecording());

            expect(result.current.flowType).toBeNull();
            expect(result.current.selectedAction).toBeNull();
            expect(result.current.selectedZone).toBeNull();
        });

        it('should initialize context toggles as false', () => {
            const { result } = renderHook(() => useEventRecording());

            expect(result.current.isCollective).toBe(false);
            expect(result.current.hasOpposition).toBe(false);
            expect(result.current.isCounterAttack).toBe(false);
        });
    });

    describe('Flow Selection', () => {
        it('should set flow type', () => {
            const { result } = renderHook(() => useEventRecording());

            act(() => {
                result.current.setFlowType('Shot');
            });

            expect(result.current.flowType).toBe('Shot');
        });

        it('should reset action and zone when flow changes', () => {
            const { result } = renderHook(() => useEventRecording());

            act(() => {
                result.current.setFlowType('Shot');
                result.current.setSelectedAction('Goal');
                result.current.setSelectedZone('6m-LW');
            });

            act(() => {
                result.current.setFlowType('Turnover');
            });

            expect(result.current.selectedAction).toBeNull();
            expect(result.current.selectedZone).toBeNull();
        });
    });

    describe('Zone Selection', () => {
        it('should set selected zone', () => {
            const { result } = renderHook(() => useEventRecording());

            act(() => {
                result.current.setSelectedZone('6m-LW');
            });

            expect(result.current.selectedZone).toBe('6m-LW');
        });
    });

    describe('Action Selection', () => {
        it('should set selected action', () => {
            const { result } = renderHook(() => useEventRecording());

            act(() => {
                result.current.setSelectedAction('Goal');
            });

            expect(result.current.selectedAction).toBe('Goal');
        });
    });

    describe('Context Toggles', () => {
        it('should toggle collective', () => {
            const { result } = renderHook(() => useEventRecording());

            act(() => {
                result.current.toggleCollective();
            });

            expect(result.current.isCollective).toBe(true);

            act(() => {
                result.current.toggleCollective();
            });

            expect(result.current.isCollective).toBe(false);
        });

        it('should toggle opposition', () => {
            const { result } = renderHook(() => useEventRecording());

            act(() => {
                result.current.toggleOpposition();
            });

            expect(result.current.hasOpposition).toBe(true);
        });

        it('should toggle counter attack', () => {
            const { result } = renderHook(() => useEventRecording());

            act(() => {
                result.current.toggleCounterAttack();
            });

            expect(result.current.isCounterAttack).toBe(true);
        });
    });

    describe('Reset', () => {
        it('should reset all state', () => {
            const { result } = renderHook(() => useEventRecording());

            act(() => {
                result.current.setFlowType('Shot');
                result.current.setSelectedAction('Goal');
                result.current.setSelectedZone('6m-LW');
                result.current.toggleCollective();
                result.current.toggleOpposition();
            });

            act(() => {
                result.current.resetPlayState();
            });

            expect(result.current.flowType).toBeNull();
            expect(result.current.selectedAction).toBeNull();
            expect(result.current.selectedZone).toBeNull();
            expect(result.current.isCollective).toBe(false);
            expect(result.current.hasOpposition).toBe(false);
            expect(result.current.isCounterAttack).toBe(false);
        });
    });

    describe('canFinalize', () => {
        it('should return false when flow type is not set', () => {
            const { result } = renderHook(() => useEventRecording());

            expect(result.current.canFinalize).toBe(false);
        });

        it('should return false when action is not set', () => {
            const { result } = renderHook(() => useEventRecording());

            act(() => {
                result.current.setFlowType('Shot');
            });

            expect(result.current.canFinalize).toBe(false);
        });

        it('should return true when flow and action are set', () => {
            const { result } = renderHook(() => useEventRecording());

            act(() => {
                result.current.setFlowType('Shot');
                result.current.setSelectedAction('Goal');
            });

            expect(result.current.canFinalize).toBe(true);
        });
    });
});
