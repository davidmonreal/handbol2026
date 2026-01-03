import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MatchProvider, useMatch } from './MatchContext';
import { PLAYER_POSITION_ABBR } from '../constants/playerPositions';
import type { ReactNode } from 'react';

// Mock fetch globally
const mockFetch = vi.fn();
globalThis.fetch = mockFetch as any;

const wrapper = ({ children }: { children: ReactNode }) => (
    <MatchProvider>{children}</MatchProvider>
);

const mockMatchData = {
    id: 'match-1',
    homeTeam: {
        id: 'team-home',
        name: 'Home Team',
        category: 'Cadet M',
        club: { name: 'Club A' },
        players: [
            { player: { id: 'p1', name: 'Player 1', number: 10, isGoalkeeper: false }, position: 4 }
        ]
    },
    awayTeam: {
        id: 'team-away',
        name: 'Away Team',
        category: 'Juvenil M',
        club: { name: 'Club B' },
        players: [
            { player: { id: 'p2', name: 'Player 2', number: 12, isGoalkeeper: true }, position: 1 }
        ]
    }
};

const mockEvents = [
    {
        id: 'e1',
        timestamp: 100,
        playerId: 'p1',
        teamId: 'team-home',
        type: 'Shot',
        subtype: 'Goal',
        player: { name: 'Player 1', number: 10 }
    },
    {
        id: 'e2',
        timestamp: 200,
        playerId: 'p2',
        teamId: 'team-away',
        type: 'Shot',
        subtype: 'Save',
        player: { name: 'Player 2', number: 12 }
    }
];

const mockMatchDetailsResponse = () => ({
    ok: true,
    json: async () => ({ realTimeFirstHalfStart: null, realTimeSecondHalfStart: null })
});

describe('MatchContext', () => {
    beforeEach(() => {
        mockFetch.mockReset();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('setMatchData', () => {
        it('should load match data and reset state when preserveState is false (default)', async () => {
            mockFetch
                .mockResolvedValueOnce(mockMatchDetailsResponse() as any)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockEvents
                });

            const { result } = renderHook(() => useMatch(), { wrapper });

            // Set some initial state
            act(() => {
                result.current.setActiveTeamId('team-home');
                result.current.setDefenseFormation('5-1');
            });

            expect(result.current.activeTeamId).toBe('team-home');
            expect(result.current.defenseFormation).toBe('5-1');

            // Call setMatchData without preserveState (default false)
            await act(async () => {
                await result.current.setMatchData(
                    mockMatchData.id,
                    {
                        id: mockMatchData.homeTeam.id,
                        name: mockMatchData.homeTeam.name,
                        category: mockMatchData.homeTeam.category,
                        club: mockMatchData.homeTeam.club,
                        color: 'yellow',
                        players: mockMatchData.homeTeam.players.map(p => ({
                            id: p.player.id,
                            name: p.player.name,
                            number: p.player.number,
                            position: PLAYER_POSITION_ABBR[p.position as keyof typeof PLAYER_POSITION_ABBR],
                            isGoalkeeper: p.player.isGoalkeeper
                        }))
                    },
                    {
                        id: mockMatchData.awayTeam.id,
                        name: mockMatchData.awayTeam.name,
                        category: mockMatchData.awayTeam.category,
                        club: mockMatchData.awayTeam.club,
                        color: 'white',
                        players: mockMatchData.awayTeam.players.map(p => ({
                            id: p.player.id,
                            name: p.player.name,
                            number: p.player.number,
                            position: PLAYER_POSITION_ABBR[p.position as keyof typeof PLAYER_POSITION_ABBR],
                            isGoalkeeper: p.player.isGoalkeeper
                        }))
                    }
                );
            });

            await waitFor(() => {
                expect(result.current.activeTeamId).toBe('team-home');
                expect(result.current.defenseFormation).toBe('6-0');
                expect(result.current.homeTeam?.id).toBe('team-home');
                expect(result.current.visitorTeam?.id).toBe('team-away');
            });
        });

        it('should preserve state when preserveState is true', async () => {
            mockFetch
                .mockResolvedValueOnce(mockMatchDetailsResponse() as any)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockEvents
                });

            const { result } = renderHook(() => useMatch(), { wrapper });

            // Set initial state
            act(() => {
                result.current.setActiveTeamId('team-home');
                result.current.setDefenseFormation('5-1');
                result.current.setSelectedOpponentGoalkeeper({
                    id: 'p2',
                    name: 'Player 2',
                    number: 12,
                    position: 'GK',
                    isGoalkeeper: true
                });
            });

            // Call setMatchData WITH preserveState=true
            await act(async () => {
                await result.current.setMatchData(
                    mockMatchData.id,
                    {
                        id: mockMatchData.homeTeam.id,
                        name: mockMatchData.homeTeam.name,
                        category: mockMatchData.homeTeam.category,
                        club: mockMatchData.homeTeam.club,
                        color: 'yellow',
                        players: []
                    },
                    {
                        id: mockMatchData.awayTeam.id,
                        name: mockMatchData.awayTeam.name,
                        category: mockMatchData.awayTeam.category,
                        club: mockMatchData.awayTeam.club,
                        color: 'white',
                        players: []
                    },
                    true // preserveState
                );
            });

            await waitFor(() => {
                // State should be preserved
                expect(result.current.activeTeamId).toBe('team-home');
                expect(result.current.defenseFormation).toBe('5-1');
                expect(result.current.selectedOpponentGoalkeeper?.id).toBe('p2');

                // Teams should still be updated
                expect(result.current.homeTeam?.id).toBe('team-home');
                expect(result.current.visitorTeam?.id).toBe('team-away');
            });
        });

        it('should load events from backend and calculate scores', async () => {
            mockFetch
                .mockResolvedValueOnce(mockMatchDetailsResponse() as any)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockEvents
                });

            const { result } = renderHook(() => useMatch(), { wrapper });

            await act(async () => {
                await result.current.setMatchData(
                    mockMatchData.id,
                    {
                        id: mockMatchData.homeTeam.id,
                        name: mockMatchData.homeTeam.name,
                        color: 'yellow',
                        players: []
                    },
                    {
                        id: mockMatchData.awayTeam.id,
                        name: mockMatchData.awayTeam.name,
                        color: 'white',
                        players: []
                    }
                );
            });

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledWith(
                    expect.stringContaining('/api/game-events/match/match-1')
                );
                expect(result.current.events).toHaveLength(2);
                expect(result.current.homeScore).toBe(1); // One goal for home team
                expect(result.current.visitorScore).toBe(0); // Save is not a goal
            });
        });

        it('should lock to manual scores when match is finished', async () => {
            mockFetch
                .mockResolvedValueOnce(mockMatchDetailsResponse() as any)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockEvents
                });

            const { result } = renderHook(() => useMatch(), { wrapper });

            await act(async () => {
                await result.current.setMatchData(
                    mockMatchData.id,
                    {
                        id: mockMatchData.homeTeam.id,
                        name: mockMatchData.homeTeam.name,
                        color: 'yellow',
                        players: []
                    },
                    {
                        id: mockMatchData.awayTeam.id,
                        name: mockMatchData.awayTeam.name,
                        color: 'white',
                        players: []
                    },
                    false,
                    { isFinished: true, homeScore: 25, awayScore: 23 }
                );
            });

            await waitFor(() => {
                expect(result.current.scoreMode).toBe('manual');
                expect(result.current.homeScore).toBe(25);
                expect(result.current.visitorScore).toBe(23);
            });
        });

        it('should stay live and use event totals when finished match has no manual scores', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockEvents
            });

            const { result } = renderHook(() => useMatch(), { wrapper });

            await act(async () => {
                await result.current.setMatchData(
                    mockMatchData.id,
                    {
                        id: mockMatchData.homeTeam.id,
                        name: mockMatchData.homeTeam.name,
                        color: 'yellow',
                        players: []
                    },
                    {
                        id: mockMatchData.awayTeam.id,
                        name: mockMatchData.awayTeam.name,
                        color: 'white',
                        players: []
                    },
                    false,
                    { isFinished: true }
                );
            });

            await waitFor(() => {
                expect(result.current.scoreMode).toBe('live');
                expect(result.current.homeScore).toBe(1);
                expect(result.current.visitorScore).toBe(0);
            });
        });

        it('should handle empty events gracefully', async () => {
            mockFetch
                .mockResolvedValueOnce(mockMatchDetailsResponse() as any)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => []
                });

            const { result } = renderHook(() => useMatch(), { wrapper });

            await act(async () => {
                await result.current.setMatchData(
                    mockMatchData.id,
                    {
                        id: mockMatchData.homeTeam.id,
                        name: mockMatchData.homeTeam.name,
                        color: 'yellow',
                        players: []
                    },
                    {
                        id: mockMatchData.awayTeam.id,
                        name: mockMatchData.awayTeam.name,
                        color: 'white',
                        players: []
                    }
                );
            });

            await waitFor(() => {
                expect(result.current.events).toHaveLength(0);
                expect(result.current.homeScore).toBe(0);
                expect(result.current.visitorScore).toBe(0);
            });
        });

        it('should handle backend errors and reset scores', async () => {
            mockFetch
                .mockResolvedValueOnce(mockMatchDetailsResponse() as any)
                .mockRejectedValueOnce(new Error('Network error'));

            const { result } = renderHook(() => useMatch(), { wrapper });

            await act(async () => {
                await result.current.setMatchData(
                    mockMatchData.id,
                    {
                        id: mockMatchData.homeTeam.id,
                        name: mockMatchData.homeTeam.name,
                        color: 'yellow',
                        players: []
                    },
                    {
                        id: mockMatchData.awayTeam.id,
                        name: mockMatchData.awayTeam.name,
                        color: 'white',
                        players: []
                    }
                );
            });

            await waitFor(() => {
                expect(result.current.events).toHaveLength(0);
                expect(result.current.homeScore).toBe(0);
                expect(result.current.visitorScore).toBe(0);
            });
        });

        it('should reset time and isPlaying regardless of preserveState', async () => {
            mockFetch
                .mockResolvedValueOnce(mockMatchDetailsResponse() as any)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => []
                });

            const { result } = renderHook(() => useMatch(), { wrapper });

            act(() => {
                result.current.setTime(300);
                result.current.setIsPlaying(true);
            });

            await act(async () => {
                await result.current.setMatchData(
                    mockMatchData.id,
                    { id: 'team1', name: 'Team 1', color: 'red', players: [] },
                    { id: 'team2', name: 'Team 2', color: 'blue', players: [] },
                    true // preserveState
                );
            });

            await waitFor(() => {
                expect(result.current.time).toBe(0);
                expect(result.current.isPlaying).toBe(false);
            });
        });
    });

    describe('setVideoCalibration', () => {
        it('should persist video calibration when a match is loaded', async () => {
            mockFetch
                .mockResolvedValueOnce(mockMatchDetailsResponse() as any)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => []
                });

            const { result } = renderHook(() => useMatch(), { wrapper });

            await act(async () => {
                await result.current.setMatchData(
                    'match-1',
                    { id: 'team1', name: 'Team 1', color: 'red', players: [] },
                    { id: 'team2', name: 'Team 2', color: 'blue', players: [] }
                );
            });

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({})
            });

            act(() => {
                result.current.setVideoCalibration(1, 42);
            });

            await waitFor(() => {
                const patchCall = mockFetch.mock.calls.find(([url, init]) => {
                    if (typeof url !== 'string') return false;
                    if (!url.includes('/api/matches/match-1')) return false;
                    const method = (init as RequestInit | undefined)?.method;
                    return method === 'PATCH';
                });
                expect(patchCall).toBeDefined();
                const [, init] = patchCall as [string, RequestInit];
                const body = JSON.parse(init.body as string);
                expect(body).toEqual({ firstHalfVideoStart: 42, secondHalfVideoStart: null });
            });
        });
    });

    describe('addEvent', () => {
        it('should update score when adding goal event', async () => {
            mockFetch
                .mockResolvedValueOnce(mockMatchDetailsResponse() as any)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => []
                });

            const { result } = renderHook(() => useMatch(), { wrapper });

            await act(async () => {
                await result.current.setMatchData(
                    'match-1',
                    { id: 'team1', name: 'Team 1', color: 'red', players: [] },
                    { id: 'team2', name: 'Team 2', color: 'blue', players: [] }
                , false, { firstHalfVideoStart: 1 });
            });
            await waitFor(() => {
                expect(result.current.firstHalfVideoStart).toBe(1);
            });

            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({})
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ id: 'new-event' })
                });

            act(() => {
                result.current.setVideoCalibration(1, 1);
            });

            await act(async () => {
                await result.current.addEvent({
                    id: 'e1',
                    timestamp: 100,
                    playerId: 'p1',
                    teamId: 'team1',
                    category: 'Shot',
                    action: 'Goal'
                });
            });

            await waitFor(() => {
                expect(result.current.homeScore).toBe(1);
                expect(result.current.events).toHaveLength(1);
            });
        });

        it('should not change locked manual score when adding events', async () => {
            mockFetch
                .mockResolvedValueOnce(mockMatchDetailsResponse() as any)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => []
                });

            const { result } = renderHook(() => useMatch(), { wrapper });

            await act(async () => {
                await result.current.setMatchData(
                    'match-1',
                    { id: 'team1', name: 'Team 1', color: 'red', players: [] },
                    { id: 'team2', name: 'Team 2', color: 'blue', players: [] },
                    false,
                    { isFinished: true, homeScore: 5, awayScore: 6 }
                );
            });

            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({})
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ id: 'new-event' })
                });

            await act(async () => {
                await result.current.addEvent({
                    id: 'e1',
                    timestamp: 100,
                    playerId: 'p1',
                    teamId: 'team1',
                    category: 'Shot',
                    action: 'Goal'
                });
            });

            await waitFor(() => {
                expect(result.current.scoreMode).toBe('manual');
                expect(result.current.homeScore).toBe(5);
                expect(result.current.visitorScore).toBe(6);
            });
        });

        it('should stamp events with the current clock time when timestamp is missing', async () => {
            mockFetch
                .mockResolvedValueOnce(mockMatchDetailsResponse() as any)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => []
                });

            const { result } = renderHook(() => useMatch(), { wrapper });

            await act(async () => {
                await result.current.setMatchData(
                    'match-1',
                    { id: 'team1', name: 'Team 1', color: 'red', players: [] },
                    { id: 'team2', name: 'Team 2', color: 'blue', players: [] }
                , false, { firstHalfVideoStart: 1 });
            });
            await waitFor(() => {
                expect(result.current.firstHalfVideoStart).toBe(1);
            });

            act(() => {
                result.current.setTime(123); // Clock is running at 02:03
            });

            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({})
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ id: 'new-event' })
                });

            act(() => {
                result.current.setVideoCalibration(1, 1);
            });

            await act(async () => {
                await result.current.addEvent({
                    // Intentionally omit timestamp to rely on clock
                    id: 'e1',
                    timestamp: undefined as unknown as number,
                    playerId: 'p1',
                    teamId: 'team1',
                    category: 'Shot',
                    action: 'Goal'
                });
            });

            await waitFor(() => {
                expect(result.current.events[0]?.timestamp).toBe(123);
            });
        });

        it('should wait for pending video calibration before saving an event', async () => {
            mockFetch
                .mockResolvedValueOnce(mockMatchDetailsResponse() as any)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => []
                });

            const { result } = renderHook(() => useMatch(), { wrapper });

            await act(async () => {
                await result.current.setMatchData(
                    'match-1',
                    { id: 'team1', name: 'Team 1', color: 'red', players: [] },
                    { id: 'team2', name: 'Team 2', color: 'blue', players: [] }
                , false, { firstHalfVideoStart: 1 });
            });

            let resolveCalibration: ((value: { ok: boolean; text: () => Promise<string> }) => void) | null = null;
            const calibrationPromise = new Promise<{ ok: boolean; text: () => Promise<string> }>((resolve) => {
                resolveCalibration = resolve;
            });

            mockFetch
                .mockImplementationOnce(() => calibrationPromise as any)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ id: 'new-event' })
                });

            act(() => {
                result.current.setVideoCalibration(1, 1);
            });

            await act(async () => {
                const addPromise = result.current.addEvent({
                    id: 'e1',
                    timestamp: 100,
                    playerId: 'p1',
                    teamId: 'team1',
                    category: 'Shot',
                    action: 'Goal'
                });

                await Promise.resolve();
                const postCallsBefore = mockFetch.mock.calls.filter(([url, init]) => {
                    if (typeof url !== 'string') return false;
                    return url.includes('/api/game-events') && (init as RequestInit | undefined)?.method === 'POST';
                });
                expect(postCallsBefore).toHaveLength(0);

                resolveCalibration?.({ ok: true, text: async () => '' });
                await addPromise;
            });

            const postCallsAfter = mockFetch.mock.calls.filter(([url, init]) => {
                if (typeof url !== 'string') return false;
                return url.includes('/api/game-events') && (init as RequestInit | undefined)?.method === 'POST';
            });
            expect(postCallsAfter).toHaveLength(1);
        });
    });

    describe('deleteEvent', () => {
        it('should decrement score when deleting a goal in live mode', async () => {
            mockFetch
                .mockResolvedValueOnce(mockMatchDetailsResponse() as any)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => [
                        {
                            id: 'e1',
                            timestamp: 100,
                            playerId: 'p1',
                            teamId: 'team-home',
                            type: 'Shot',
                            subtype: 'Goal',
                            player: { name: 'Player 1', number: 10 }
                        },
                        {
                            id: 'e2',
                            timestamp: 200,
                            playerId: 'p2',
                            teamId: 'team-away',
                            type: 'Shot',
                            subtype: 'Save',
                            player: { name: 'Player 2', number: 12 }
                        }
                    ]
                });

            const { result } = renderHook(() => useMatch(), { wrapper });

            await act(async () => {
                await result.current.setMatchData(
                    mockMatchData.id,
                    {
                        id: mockMatchData.homeTeam.id,
                        name: mockMatchData.homeTeam.name,
                        color: 'yellow',
                        players: []
                    },
                    {
                        id: mockMatchData.awayTeam.id,
                        name: mockMatchData.awayTeam.name,
                        color: 'white',
                        players: []
                    }
                );
            });

            await waitFor(() => {
                expect(result.current.homeScore).toBe(1);
                expect(result.current.events).toHaveLength(2);
            });

            mockFetch.mockResolvedValueOnce({ ok: true });

            await act(async () => {
                await result.current.deleteEvent('e1', true);
            });

            await waitFor(() => {
                expect(result.current.homeScore).toBe(0);
                expect(result.current.events).toHaveLength(1);
                expect(result.current.events.find(e => e.id === 'e1')).toBeUndefined();
            });
        });

        it('should keep manual score locked when deleting a goal in a finished match', async () => {
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        realTimeFirstHalfStart: null,
                        realTimeSecondHalfStart: null,
                        isFinished: true,
                        homeScore: 5,
                        awayScore: 6
                    })
                } as any)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => [
                        {
                            id: 'e1',
                            timestamp: 100,
                            playerId: 'p1',
                            teamId: 'team-home',
                            type: 'Shot',
                            subtype: 'Goal',
                            player: { name: 'Player 1', number: 10 }
                        }
                    ]
                });

            const { result } = renderHook(() => useMatch(), { wrapper });

            await act(async () => {
                await result.current.setMatchData(
                    mockMatchData.id,
                    {
                        id: mockMatchData.homeTeam.id,
                        name: mockMatchData.homeTeam.name,
                        color: 'yellow',
                        players: []
                    },
                    {
                        id: mockMatchData.awayTeam.id,
                        name: mockMatchData.awayTeam.name,
                        color: 'white',
                        players: []
                    }
                );
            });

            await waitFor(() => {
                expect(result.current.scoreMode).toBe('manual');
                expect(result.current.homeScore).toBe(5);
                expect(result.current.visitorScore).toBe(6);
                expect(result.current.events).toHaveLength(1);
            });

            mockFetch.mockResolvedValueOnce({ ok: true });

            await act(async () => {
                await result.current.deleteEvent('e1', true);
            });

            await waitFor(() => {
                expect(result.current.scoreMode).toBe('manual');
                expect(result.current.homeScore).toBe(5);
                expect(result.current.visitorScore).toBe(6);
                expect(result.current.events).toHaveLength(0);
            });
        });
    });

    it('should store real time calibration boundaries and update the clock accordingly', async () => {
        const { result } = renderHook(() => useMatch(), { wrapper });
        const firstHalfStart = Date.now();
        const firstHalfEnd = firstHalfStart + 60000;
        const secondHalfStart = firstHalfStart + 90000;
        const secondHalfEnd = secondHalfStart + 60000;
        const firstHalfDuration = Math.floor((firstHalfEnd - firstHalfStart) / 1000);
        const secondHalfDuration = Math.floor((secondHalfEnd - secondHalfStart) / 1000);

        act(() => {
            result.current.setRealTimeCalibration(1, firstHalfStart);
        });

        expect(result.current.realTimeFirstHalfStart).toBe(firstHalfStart);
        expect(result.current.time).toBe(0);

        act(() => {
            result.current.setRealTimeCalibration(1, firstHalfEnd, 'end');
        });

        expect(result.current.realTimeFirstHalfEnd).toBe(firstHalfEnd);
        expect(result.current.time).toBe(firstHalfDuration);

        act(() => {
            result.current.setRealTimeCalibration(2, secondHalfStart);
        });

        expect(result.current.realTimeSecondHalfStart).toBe(secondHalfStart);
        expect(result.current.time).toBe(firstHalfDuration);

        act(() => {
            result.current.setRealTimeCalibration(2, secondHalfEnd, 'end');
        });

        expect(result.current.realTimeSecondHalfEnd).toBe(secondHalfEnd);
        expect(result.current.time).toBe(firstHalfDuration + secondHalfDuration);
    });
});
