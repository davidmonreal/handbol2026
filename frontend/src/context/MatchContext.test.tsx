import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MatchProvider, useMatch } from './MatchContext';
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
        category: 'CADET',
        club: { name: 'Club A' },
        players: [
            { player: { id: 'p1', name: 'Player 1', number: 10, isGoalkeeper: false }, role: 'CB' }
        ]
    },
    awayTeam: {
        id: 'team-away',
        name: 'Away Team',
        category: 'JUVENIL',
        club: { name: 'Club B' },
        players: [
            { player: { id: 'p2', name: 'Player 2', number: 12, isGoalkeeper: true }, role: 'GK' }
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
        mockFetch.mockClear();
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
                            position: p.role,
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
                            position: p.role,
                            isGoalkeeper: p.player.isGoalkeeper
                        }))
                    }
                );
            });

            await waitFor(() => {
                expect(result.current.activeTeamId).toBe(null);
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

        it('should fall back to event totals when finished match has no manual scores', async () => {
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
                    { isFinished: true }
                );
            });

            await waitFor(() => {
                expect(result.current.scoreMode).toBe('manual');
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
                );
            });

            mockFetch.mockResolvedValueOnce({
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

            mockFetch.mockResolvedValueOnce({
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
    });
});
