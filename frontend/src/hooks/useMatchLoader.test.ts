import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMatchLoader } from './useMatchLoader';

// Mock fetch - use global from setup.ts
const mockFetch = globalThis.fetch as ReturnType<typeof vi.fn>;

describe('useMatchLoader', () => {
    const mockMatchData = {
        id: 'match-123',
        date: '2024-01-15T10:00:00Z',
        homeScore: 0,
        awayScore: 0,
        isFinished: false,
        videoUrl: 'https://www.youtube.com/watch?v=test123',
        firstHalfVideoStart: null,
        secondHalfVideoStart: null,
        homeTeam: {
            id: 'home-team-1',
            name: 'Home Team',
            category: 'Senior',
            club: { id: 'club-1', name: 'Club A' },
            players: [
                { player: { id: 'p1', number: 1, name: 'Player 1', isGoalkeeper: true }, role: 'GK' },
                { player: { id: 'p2', number: 7, name: 'Player 2', isGoalkeeper: false }, role: 'Player' },
            ],
        },
        awayTeam: {
            id: 'away-team-1',
            name: 'Away Team',
            category: 'Senior',
            club: { id: 'club-2', name: 'Club B' },
            players: [
                { player: { id: 'ap1', number: 1, name: 'Away GK', isGoalkeeper: true }, role: 'GK' },
            ],
        },
    };

    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe('Loading State', () => {
        it('should start with loading true', () => {
            mockFetch.mockImplementation(() => new Promise(() => { })); // Never resolves

            const { result } = renderHook(() => useMatchLoader('match-123'));

            expect(result.current.isLoading).toBe(true);
            expect(result.current.error).toBeNull();
        });

        it('should set loading false after data loads', async () => {
            mockFetch.mockImplementation(() => Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockMatchData),
            }));

            const { result } = renderHook(() => useMatchLoader('match-123'));

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });
        });
    });

    describe('Success State', () => {
        beforeEach(() => {
            mockFetch.mockImplementation(() => Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockMatchData),
            }));
        });

        it('should transform home team correctly', async () => {
            const { result } = renderHook(() => useMatchLoader('match-123'));

            await waitFor(() => {
                expect(result.current.homeTeam).toBeDefined();
                expect(result.current.homeTeam?.id).toBe('home-team-1');
                expect(result.current.homeTeam?.name).toBe('Home Team');
                expect(result.current.homeTeam?.players).toHaveLength(2);
            });
        });

        it('should transform visitor team correctly', async () => {
            const { result } = renderHook(() => useMatchLoader('match-123'));

            await waitFor(() => {
                expect(result.current.visitorTeam).toBeDefined();
                expect(result.current.visitorTeam?.id).toBe('away-team-1');
                expect(result.current.visitorTeam?.name).toBe('Away Team');
            });
        });

        it('should transform players with correct structure', async () => {
            const { result } = renderHook(() => useMatchLoader('match-123'));

            await waitFor(() => {
                expect(result.current.homeTeam?.players).toBeDefined();
                const playerEntry = result.current.homeTeam?.players?.[0];
                // Players are stored as { player: Player, role?: string }
                expect(playerEntry?.player?.id).toBe('p1');
                expect(playerEntry?.player?.number).toBe(1);
                expect(playerEntry?.player?.name).toBe('Player 1');
                expect(playerEntry?.player?.isGoalkeeper).toBe(true);
                expect(playerEntry?.role).toBe('GK');
            });
        });

        it('should return matchId', async () => {
            const { result } = renderHook(() => useMatchLoader('match-123'));

            await waitFor(() => {
                expect(result.current.matchId).toBe('match-123');
            });
        });
    });

    describe('Error State', () => {
        it('should set error when fetch fails', async () => {
            mockFetch.mockImplementation(() => Promise.resolve({
                ok: false,
                status: 404,
            }));

            const { result } = renderHook(() => useMatchLoader('match-123'));

            await waitFor(() => {
                expect(result.current.error).not.toBeNull();
            });

            expect(result.current.isLoading).toBe(false);
        });

        it('should set error when network error occurs', async () => {
            mockFetch.mockImplementation(() => Promise.reject(new Error('Network error')));

            const { result } = renderHook(() => useMatchLoader('match-123'));

            await waitFor(() => {
                expect(result.current.error).toBe('Network error');
            });
        });
    });

    describe('Refetch', () => {
        it('should provide refetch function', async () => {
            mockFetch.mockImplementation(() => Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockMatchData),
            }));

            const { result } = renderHook(() => useMatchLoader('match-123'));

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(typeof result.current.refetch).toBe('function');
        });
    });
});
