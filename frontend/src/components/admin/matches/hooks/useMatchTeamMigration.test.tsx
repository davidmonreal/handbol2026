import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { useMatchTeamMigration } from './useMatchTeamMigration';

vi.mock('../../../../config/api', () => ({
    API_BASE_URL: 'http://localhost:3000',
}));

const mockFetch = vi.fn();

beforeAll(() => {
    vi.stubGlobal('fetch', mockFetch);
});

describe('useMatchTeamMigration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('marks when a finished match needs migration', () => {
        const { result, rerender } = renderHook((props) => useMatchTeamMigration(props), {
            initialProps: {
                matchId: 'match-1',
                isEditMode: true,
                status: 'FINISHED' as const,
                initialHomeTeamId: 'home-1',
                initialAwayTeamId: 'away-1',
                selectedHomeTeamId: 'home-1',
                selectedAwayTeamId: 'away-2',
            },
        });

        expect(result.current.shouldMigrateTeams).toBe(true);

        rerender({
            matchId: 'match-1',
            isEditMode: true,
            status: 'SCHEDULED' as const,
            initialHomeTeamId: 'home-1',
            initialAwayTeamId: 'away-1',
            selectedHomeTeamId: 'home-1',
            selectedAwayTeamId: 'away-2',
        });

        expect(result.current.shouldMigrateTeams).toBe(false);
    });

    it('loads migration preview and opens modal', async () => {
        const preview = {
            matchId: 'match-1',
            changes: [
                {
                    side: 'away',
                    fromTeam: { id: 'away-1', name: 'Away 1' },
                    toTeam: { id: 'away-2', name: 'Away 2' },
                    eventCount: 5,
                    players: [{ id: 'player-1', name: 'Player One', number: 7 }],
                    requiresGoalkeeper: false,
                    goalkeeperEventCount: 0,
                },
            ],
        };

        mockFetch.mockImplementation((url: string) => {
            if (url.includes('/team-migration/preview')) {
                return Promise.resolve({ ok: true, json: async () => preview });
            }
            return Promise.resolve({ ok: true, json: async () => ({}) });
        });

        const { result } = renderHook(() =>
            useMatchTeamMigration({
                matchId: 'match-1',
                isEditMode: true,
                status: 'FINISHED',
                initialHomeTeamId: 'home-1',
                initialAwayTeamId: 'away-1',
                selectedHomeTeamId: 'home-1',
                selectedAwayTeamId: 'away-2',
            }),
        );

        await act(async () => {
            await result.current.prepareMigrationPreview();
        });

        expect(result.current.isMigrationModalOpen).toBe(true);
        expect(result.current.migrationPreview?.matchId).toBe('match-1');

        const previewCall = mockFetch.mock.calls.find(([callUrl]) =>
            String(callUrl).includes('/team-migration/preview'),
        );
        expect(previewCall).toBeTruthy();
        const body = JSON.parse(previewCall?.[1]?.body as string);
        expect(body).toEqual({ awayTeamId: 'away-2' });
    });

    it('requires goalkeeper selection when needed', async () => {
        const preview = {
            matchId: 'match-2',
            changes: [
                {
                    side: 'home',
                    fromTeam: { id: 'home-1', name: 'Home 1' },
                    toTeam: { id: 'home-2', name: 'Home 2' },
                    eventCount: 3,
                    players: [],
                    requiresGoalkeeper: true,
                    goalkeeperEventCount: 4,
                },
            ],
        };

        mockFetch.mockImplementation((url: string) => {
            if (url.includes('/team-migration/preview')) {
                return Promise.resolve({ ok: true, json: async () => preview });
            }
            if (url.includes('/api/teams/home-2')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        id: 'home-2',
                        players: [
                            {
                                player: { id: 'gk-1', name: 'Goalkeeper', isGoalkeeper: true },
                                number: 1,
                                position: 1,
                            },
                        ],
                    }),
                });
            }
            if (url.includes('/team-migration/apply')) {
                return Promise.resolve({ ok: true, json: async () => ({}) });
            }
            return Promise.resolve({ ok: true, json: async () => ({}) });
        });

        const { result } = renderHook(() =>
            useMatchTeamMigration({
                matchId: 'match-2',
                isEditMode: true,
                status: 'FINISHED',
                initialHomeTeamId: 'home-1',
                initialAwayTeamId: 'away-1',
                selectedHomeTeamId: 'home-2',
                selectedAwayTeamId: 'away-1',
            }),
        );

        await act(async () => {
            await result.current.prepareMigrationPreview();
        });

        let applyResult: { ok: boolean } | undefined;
        await act(async () => {
            applyResult = await result.current.applyMigration();
        });
        expect(applyResult?.ok).toBe(false);
        expect(result.current.migrationError).toBe('Select a goalkeeper to continue.');
    });

    it('posts migration payload and closes modal on success', async () => {
        const preview = {
            matchId: 'match-3',
            changes: [
                {
                    side: 'home',
                    fromTeam: { id: 'home-1', name: 'Home 1' },
                    toTeam: { id: 'home-2', name: 'Home 2' },
                    eventCount: 3,
                    players: [],
                    requiresGoalkeeper: true,
                    goalkeeperEventCount: 2,
                },
            ],
        };

        mockFetch.mockImplementation((url: string) => {
            if (url.includes('/team-migration/preview')) {
                return Promise.resolve({ ok: true, json: async () => preview });
            }
            if (url.includes('/api/teams/home-2')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        id: 'home-2',
                        players: [
                            {
                                player: { id: 'gk-2', name: 'Keeper', isGoalkeeper: true },
                                number: 16,
                                position: 1,
                            },
                        ],
                    }),
                });
            }
            if (url.includes('/team-migration/apply')) {
                return Promise.resolve({ ok: true, json: async () => ({}) });
            }
            return Promise.resolve({ ok: true, json: async () => ({}) });
        });

        const { result } = renderHook(() =>
            useMatchTeamMigration({
                matchId: 'match-3',
                isEditMode: true,
                status: 'FINISHED',
                initialHomeTeamId: 'home-1',
                initialAwayTeamId: 'away-1',
                selectedHomeTeamId: 'home-2',
                selectedAwayTeamId: 'away-1',
            }),
        );

        await act(async () => {
            await result.current.prepareMigrationPreview();
        });

        act(() => {
            result.current.setGoalkeeperSelection('home', 'gk-2');
        });

        let applyResult: { ok: boolean } | undefined;
        await act(async () => {
            applyResult = await result.current.applyMigration();
        });
        expect(applyResult?.ok).toBe(true);
        expect(result.current.isMigrationModalOpen).toBe(false);

        const applyCall = mockFetch.mock.calls.find(([callUrl]) =>
            String(callUrl).includes('/team-migration/apply'),
        );
        const body = JSON.parse(applyCall?.[1]?.body as string);
        expect(body).toEqual({
            homeTeamId: 'home-2',
            homeGoalkeeperId: 'gk-2',
        });
    });
});
