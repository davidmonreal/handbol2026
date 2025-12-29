import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { useMatchFormActions } from './useMatchFormActions';

vi.mock('../../../../config/api', () => ({
    API_BASE_URL: 'http://localhost:3000',
}));

const mockFetch = vi.fn();

beforeAll(() => {
    vi.stubGlobal('fetch', mockFetch);
});

describe('useMatchFormActions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const buildHook = (overrides: Partial<Parameters<typeof useMatchFormActions>[0]> = {}) => {
        const setError = vi.fn();
        const setInfoMessage = vi.fn();
        const navigate = vi.fn();

        const hook = renderHook(() =>
            useMatchFormActions({
                matchId: 'match-1',
                isEditMode: false,
                fromPath: undefined,
                navigate,
                teams: [{ id: 'team-1', name: 'Home', color: '#000000' }],
                status: 'SCHEDULED',
                dateValue: '2024-01-01',
                timeValue: '12:00',
                selectedHomeTeamId: 'team-1',
                selectedAwayTeamId: 'team-2',
                homeScore: '0',
                awayScore: '0',
                shouldMigrateTeams: false,
                prepareMigrationPreview: vi.fn(async () => ({ ok: true })),
                applyMigration: vi.fn(async () => ({ ok: true })),
                setError,
                setInfoMessage,
                ...overrides,
            }),
        );

        return { ...hook, setError, setInfoMessage, navigate };
    };

    it('validates required fields before saving', async () => {
        const { result, setError } = buildHook({
            selectedHomeTeamId: null,
        });

        await act(async () => {
            await result.current.handleSave();
        });

        expect(setError).toHaveBeenCalledWith('All fields are required');
    });

    it('uses migration preview when teams changed', async () => {
        const prepareMigrationPreview = vi.fn(async () => ({ ok: false, error: 'Preview failed' }));
        const { result, setError } = buildHook({
            isEditMode: true,
            shouldMigrateTeams: true,
            prepareMigrationPreview,
        });

        await act(async () => {
            await result.current.handleSave();
        });

        expect(prepareMigrationPreview).toHaveBeenCalled();
        expect(setError).toHaveBeenCalledWith('Preview failed');
    });

    it('posts match data and navigates on success', async () => {
        mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
        const { result, navigate } = buildHook({
            teams: [
                { id: 'team-1', name: 'Home', color: '#000000' },
                { id: 'team-2', name: 'Away', color: '#000000' },
            ],
        });

        await act(async () => {
            await result.current.handleSave();
        });

        const saveCall = mockFetch.mock.calls.find(([url]) =>
            String(url).includes('/api/matches'),
        );
        expect(saveCall?.[1]?.method).toBe('POST');
        const body = JSON.parse(saveCall?.[1]?.body as string);
        expect(body.homeTeamId).toBe('team-1');
        expect(body.awayTeamId).toBe('team-2');
        expect(body.isFinished).toBe(false);
        expect(typeof body.date).toBe('string');
        expect(navigate).toHaveBeenCalled();
    });
});
