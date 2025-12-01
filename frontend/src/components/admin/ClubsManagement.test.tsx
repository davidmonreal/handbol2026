import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ClubsManagement } from './ClubsManagement';

// Mock API
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ClubsManagement', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => [],
        });
    });

    it('renders the component title', async () => {
        render(<ClubsManagement />);
        expect(screen.getByText('Clubs Management')).toBeInTheDocument();
    });

    it('fetches clubs on mount', async () => {
        render(<ClubsManagement />);
        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/clubs'));
    });

    it('displays clubs in the table', async () => {
        const mockClubs = [
            { id: '1', name: 'Club A' },
            { id: '2', name: 'Club B' },
        ];

        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => mockClubs,
        });

        render(<ClubsManagement />);

        await waitFor(() => {
            expect(screen.getByText('Club A')).toBeInTheDocument();
            expect(screen.getByText('Club B')).toBeInTheDocument();
        });
    });
});
