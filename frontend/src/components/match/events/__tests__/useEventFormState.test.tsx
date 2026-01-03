import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useEventFormState } from '../useEventFormState';

const t = (key: string) => key;

afterEach(() => {
    vi.restoreAllMocks();
});

describe('useEventFormState', () => {
    it('injects adapters for timing, storage and logging', async () => {
        const clock = { now: vi.fn().mockReturnValueOnce(100).mockReturnValueOnce(150) };
        const storage = {
            getItem: vi.fn().mockReturnValue('[]'),
            setItem: vi.fn(),
        };
        const logger = { log: vi.fn() };
        const onSave = vi.fn().mockResolvedValue(undefined);
        const onSaveMessage = vi.fn();
        const onSaved = vi.fn();
        const onCancel = vi.fn();

        const { result } = renderHook(() =>
            useEventFormState({
                teamId: 'team-1',
                requireOpponentGoalkeeper: true,
                onSave,
                onSaved,
                onSaveMessage,
                onCancel,
                t,
                deps: { clock, storage, logger },
            }),
        );

        act(() => {
            result.current.dispatchers.selectPlayer('player-1');
            result.current.dispatchers.selectOpponentGk('gk-1');
            result.current.dispatchers.selectAction('Goal');
            result.current.dispatchers.selectZone('6m-LW');
            result.current.dispatchers.selectTarget(1);
        });

        await act(async () => {
            await result.current.dispatchers.save();
        });

        expect(onSave).toHaveBeenCalledWith(
            expect.objectContaining({
                playerId: 'player-1',
                action: 'Goal',
                zone: '6m-LW',
                goalTarget: 1,
            }),
            'gk-1',
        );
        expect(onSaveMessage).toHaveBeenCalled();
        expect(onSaved).toHaveBeenCalled();
        expect(clock.now).toHaveBeenCalledTimes(2);
        expect(storage.setItem).toHaveBeenCalledWith(
            'eventFormDebugDurations',
            expect.stringContaining('"durationMs":50'),
        );
        expect(logger.log).toHaveBeenCalled();
    });

    it('works without localStorage available', async () => {
        vi.stubGlobal('localStorage', undefined);
        const onSave = vi.fn();
        const { result } = renderHook(() =>
            useEventFormState({
                teamId: 'team-1',
                requireOpponentGoalkeeper: true,
                onSave,
                onCancel: vi.fn(),
                t,
            }),
        );

        act(() => result.current.dispatchers.selectPlayer('player-1'));
        act(() => result.current.dispatchers.selectOpponentGk('gk-1'));
        act(() => result.current.dispatchers.selectAction('Goal'));
        act(() => result.current.dispatchers.selectZone('6m-LB'));
        await act(async () => {
            await result.current.dispatchers.save();
        });

        expect(onSave).toHaveBeenCalledWith(
            expect.objectContaining({ playerId: 'player-1', action: 'Goal', zone: '6m-LB' }),
            'gk-1',
        );
    });

    it('blocks save when opponent goalkeeper is required', async () => {
        const onSave = vi.fn();
        const onSaveMessage = vi.fn();

        const { result } = renderHook(() =>
            useEventFormState({
                teamId: 'team-1',
                requireOpponentGoalkeeper: true,
                onSave,
                onSaveMessage,
                onCancel: vi.fn(),
                t,
            }),
        );

        act(() => result.current.dispatchers.selectPlayer('player-1'));
        act(() => result.current.dispatchers.selectAction('Goal'));

        await act(async () => {
            await result.current.dispatchers.save();
        });

        expect(onSave).not.toHaveBeenCalled();
        expect(onSaveMessage).toHaveBeenCalledWith('eventForm.goalkeeperRequired', 'error');
    });

    it('resetFormPreservingOpponentGk keeps selected GK while resetting other fields', () => {
        const { result } = renderHook(() =>
            useEventFormState({
                teamId: 'team-1',
                onSave: vi.fn(),
                onCancel: vi.fn(),
                t,
            }),
        );

        act(() => {
            result.current.dispatchers.selectOpponentGk('gk-1');
            result.current.dispatchers.selectCategory('Turnover');
            result.current.dispatchers.selectAction('Pass');
        });

        act(() => result.current.dispatchers.resetFormPreservingOpponentGk());

        expect(result.current.state.selectedOpponentGkId).toBe('gk-1');
        expect(result.current.state.selectedCategory).toBe('Shot');
        expect(result.current.state.selectedAction).toBe('Goal');
    });

    it('prefers event opponent GK over initial state when editing', () => {
        const event = {
            id: 'event-1',
            timestamp: 10,
            playerId: 'player-1',
            teamId: 'team-1',
            category: 'Shot',
            action: 'Goal',
            opponentGoalkeeperId: 'gk-event',
        };

        const { result } = renderHook(() =>
            useEventFormState({
                teamId: 'team-1',
                event,
                initialState: { opponentGoalkeeperId: 'gk-initial' },
                onSave: vi.fn(),
                onCancel: vi.fn(),
                t,
            }),
        );

        expect(result.current.state.selectedOpponentGkId).toBe('gk-event');
    });
});
