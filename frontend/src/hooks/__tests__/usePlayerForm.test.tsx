import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { usePlayerForm } from '../usePlayerForm';
import { playerImportService } from '../../services/playerImportService';
import { MemoryRouter } from 'react-router-dom';
import { DEFAULT_FIELD_POSITION } from '../../constants/playerPositions';

// Mock Dependencies
vi.mock('../../services/playerImportService', () => ({
    playerImportService: {
        checkDuplicates: vi.fn()
    }
}));

vi.mock('../../config/api', () => ({
    API_BASE_URL: 'http://localhost:3000'
}));

// Mock Fetch
const mockFetch = vi.fn();
beforeAll(() => {
    vi.stubGlobal('fetch', mockFetch);
});

describe('usePlayerForm Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(playerImportService.checkDuplicates).mockResolvedValue({ duplicates: [] } as any);
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => []
        });
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <MemoryRouter>{children}</MemoryRouter>
    );

    it('should initialize with default values', async () => {
        const { result } = renderHook(() => usePlayerForm(), { wrapper });

        expect(result.current.isLoading).toBe(true); // Should load initial data
        expect(result.current.formData.name).toBe('');
        expect(result.current.formData.isGoalkeeper).toBe(false);
    });

    it('should load initial data', async () => {
        const mockClubs = [{ id: '1', name: 'Club A' }];
        const mockTeams = [{ id: 't1', name: 'Team A' }];

        mockFetch.mockImplementation((url) => {
            if (url.includes('/clubs')) return Promise.resolve({ ok: true, json: async () => mockClubs });
            if (url.includes('/teams')) return Promise.resolve({ ok: true, json: async () => mockTeams });
            if (url.includes('/seasons')) return Promise.resolve({ ok: true, json: async () => [] });
            return Promise.resolve({ ok: true, json: async () => [] });
        });

        const { result } = renderHook(() => usePlayerForm(), { wrapper });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.data.clubs).toEqual(mockClubs);
        expect(result.current.data.teams).toEqual(mockTeams);
    });

    it('should update form fields', async () => {
        const { result } = renderHook(() => usePlayerForm(), { wrapper });

        // Wait for initial load
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        act(() => {
            result.current.handlers.setName('New Name');
            result.current.handlers.setNumber(10);
        });

        expect(result.current.formData.name).toBe('New Name');
        expect(result.current.formData.number).toBe(10);
    });

    it('creates a player and assigns to a team when provided', async () => {
        const mockPlayer = {
            id: 'player-1',
            name: 'test-Player',
            number: 7,
            handedness: 'RIGHT',
            isGoalkeeper: false,
        };

        mockFetch.mockImplementation((url, init) => {
            if (url.includes('/clubs')) return Promise.resolve({ ok: true, json: async () => [] });
            if (url.includes('/teams') && !url.includes('/players')) {
                return Promise.resolve({ ok: true, json: async () => [] });
            }
            if (url.includes('/seasons')) return Promise.resolve({ ok: true, json: async () => [] });
            if (url.includes('/api/players') && init?.method === 'POST') {
                return Promise.resolve({ ok: true, json: async () => mockPlayer });
            }
            if (url.includes('/api/teams/team-1/players') && init?.method === 'POST') {
                return Promise.resolve({ ok: true, json: async () => ({}) });
            }
            return Promise.resolve({ ok: true, json: async () => [] });
        });

        const { result } = renderHook(() => usePlayerForm(), { wrapper });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        act(() => {
            result.current.handlers.setName('test-Player');
            result.current.handlers.setNumber(7);
        });

        await act(async () => {
            await result.current.handlers.savePlayer('team-1', DEFAULT_FIELD_POSITION);
        });

        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/players'),
            expect.objectContaining({ method: 'POST' }),
        );
        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/teams/team-1/players'),
            expect.objectContaining({ method: 'POST' }),
        );
    });

    it('updates a player when in edit mode', async () => {
        mockFetch.mockImplementation((url, init) => {
            if (url.includes('/clubs')) return Promise.resolve({ ok: true, json: async () => [] });
            if (url.includes('/teams') && !url.includes('/players')) {
                return Promise.resolve({ ok: true, json: async () => [] });
            }
            if (url.includes('/seasons')) return Promise.resolve({ ok: true, json: async () => [] });
            if (url.includes('/api/players/player-1') && init?.method === 'PUT') {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        id: 'player-1',
                        name: 'test-Updated Player',
                        number: 9,
                        handedness: 'LEFT',
                        isGoalkeeper: false,
                    }),
                });
            }
            if (url.includes('/api/players/player-1') && (!init || init.method === 'GET')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        id: 'player-1',
                        name: 'test-Existing Player',
                        number: 4,
                        handedness: 'RIGHT',
                        isGoalkeeper: false,
                        teams: [],
                    }),
                });
            }
            return Promise.resolve({ ok: true, json: async () => [] });
        });

        const { result } = renderHook(() => usePlayerForm('player-1'), { wrapper });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        act(() => {
            result.current.handlers.setName('test-Updated Player');
            result.current.handlers.setNumber(9);
        });

        await act(async () => {
            await result.current.handlers.savePlayer();
        });

        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/players/player-1'),
            expect.objectContaining({ method: 'PUT' }),
        );
    });
});
