import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { useMatchFormData } from './useMatchFormData';

vi.mock('../../../../config/api', () => ({
    API_BASE_URL: 'http://localhost:3000',
}));

const mockFetch = vi.fn();

beforeAll(() => {
    vi.stubGlobal('fetch', mockFetch);
});

describe('useMatchFormData', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('loads teams when creating a new match', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => [{ id: 'team-1', name: 'Team 1', color: '#000000' }],
        });

        const { result } = renderHook(() => useMatchFormData({ isEditMode: false }));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.teams).toEqual([{ id: 'team-1', name: 'Team 1', color: '#000000' }]);
        expect(result.current.selectedHomeTeamId).toBeNull();
    });

    it('loads match data and events for edit mode', async () => {
        const matchDate = '2024-01-01T12:30:00.000Z';
        const expectedDate = new Date(matchDate).toISOString().split('T')[0];
        const expectedTime = new Date(matchDate).toLocaleTimeString('ca-ES', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });

        mockFetch.mockImplementation((url: string) => {
            if (url.includes('/api/teams')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => [{ id: 'team-1', name: 'Team 1', color: '#000000' }],
                });
            }
            if (url.includes('/api/matches/match-1')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        id: 'match-1',
                        date: matchDate,
                        homeTeamId: 'home-1',
                        awayTeamId: 'away-1',
                        homeTeam: { id: 'home-1', name: 'Home' },
                        awayTeam: { id: 'away-1', name: 'Away' },
                        isFinished: true,
                        homeScore: 30,
                        awayScore: 28,
                        videoUrl: 'http://video.example',
                    }),
                });
            }
            if (url.includes('/api/game-events/match/match-1')) {
                return Promise.resolve({ ok: true, json: async () => [{ id: 'event-1' }] });
            }
            return Promise.resolve({ ok: true, json: async () => [] });
        });

        const { result } = renderHook(() => useMatchFormData({ matchId: 'match-1', isEditMode: true }));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.dateValue).toBe(expectedDate);
        expect(result.current.timeValue).toBe(expectedTime);
        expect(result.current.selectedHomeTeamId).toBe('home-1');
        expect(result.current.selectedAwayTeamId).toBe('away-1');
        expect(result.current.status).toBe('FINISHED');
        expect(result.current.homeScore).toBe('30');
        expect(result.current.awayScore).toBe('28');
        expect(result.current.hasEvents).toBe(true);
        expect(result.current.hasVideo).toBe(true);
    });
});
