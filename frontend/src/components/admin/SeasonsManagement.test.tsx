import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { SeasonsManagement } from './SeasonsManagement';

// Mock API
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('SeasonsManagement', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => [],
        });
    });

    it('renders the component title', async () => {
        render(<SeasonsManagement />);
        expect(screen.getByText('Seasons Management')).toBeInTheDocument();
    });

    it('fetches seasons on mount', async () => {
        render(<SeasonsManagement />);
        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/seasons'));
    });

    it('displays seasons in the table', async () => {
        const mockSeasons = [
            { id: '1', name: '2023-2024', startDate: '2023-09-01', endDate: '2024-06-30' },
            { id: '2', name: '2024-2025', startDate: '2024-09-01', endDate: '2025-06-30' },
        ];

        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => mockSeasons,
        });

        render(<SeasonsManagement />);

        await waitFor(() => {
            expect(screen.getByText('2023-2024')).toBeInTheDocument();
            expect(screen.getByText('2024-2025')).toBeInTheDocument();
        });
    });
});
