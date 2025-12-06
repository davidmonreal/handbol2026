import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { usePlayerForm } from '../usePlayerForm';
import { playerImportService } from '../../services/playerImportService';
import { MemoryRouter } from 'react-router-dom';

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
});
