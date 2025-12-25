import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { usePlayWindow } from './usePlayWindow';
import type { MatchEvent } from '../../../types';

const buildEvent = (overrides: Partial<MatchEvent>): MatchEvent => ({
    id: overrides.id ?? 'event-1',
    timestamp: overrides.timestamp ?? 0,
    teamId: overrides.teamId ?? 'team-1',
    category: overrides.category ?? 'Shot',
    action: overrides.action ?? 'Goal',
    playerId: overrides.playerId ?? 'player-1',
    ...overrides,
});

describe('usePlayWindow', () => {
    it('filters by match when configured for match mode', () => {
        const events: MatchEvent[] = [
            buildEvent({ id: 'e1', matchId: 'match-1', timestamp: 10 }),
            buildEvent({ id: 'e2', matchId: 'match-1', timestamp: 20 }),
            buildEvent({ id: 'e3', matchId: 'match-2', timestamp: 30 }),
        ];

        const matchFilters = [
            { matchId: 'match-1', label: 'Club A • 01/01' },
            { matchId: 'match-2', label: 'Club B • 02/01' },
        ];

        const { result } = renderHook(() => usePlayWindow(events, { mode: 'matches', matchFilters }));

        expect(result.current.options.map((opt) => opt.label)).toEqual([
            'Club A • 01/01',
            'Club B • 02/01',
        ]);

        act(() => {
            result.current.setSelected({ kind: 'match', matchId: 'match-2' });
        });

        expect(result.current.filteredEvents.map((event) => event.id)).toEqual(['e3']);
    });

    it('clears non-match selections when in match mode', () => {
        const events: MatchEvent[] = [
            buildEvent({ id: 'e1', matchId: 'match-1', timestamp: 10 }),
        ];

        const matchFilters = [{ matchId: 'match-1', label: 'Club A • 01/01' }];

        const { result } = renderHook(() => usePlayWindow(events, { mode: 'matches', matchFilters }));

        act(() => {
            result.current.setSelected({ kind: 'half', half: 1 });
        });

        expect(result.current.selected).toBeNull();
        expect(result.current.filteredEvents).toHaveLength(1);
    });

    it('keeps half filtering in play mode', () => {
        const events: MatchEvent[] = [
            buildEvent({ id: 'e1', timestamp: 100 }),
            buildEvent({ id: 'e2', timestamp: 2000 }),
        ];

        const { result } = renderHook(() => usePlayWindow(events));

        act(() => {
            result.current.setSelected({ kind: 'half', half: 2 });
        });

        expect(result.current.filteredEvents.map((event) => event.id)).toEqual(['e2']);
    });
});
