import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ClubsManagement } from './ClubsManagement';

// Mock API
const mockFetch = vi.fn();
global.fetch = mockFetch;
const mockConfirm = vi.spyOn(window, 'confirm');

describe('ClubsManagement', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => [],
        });
        mockConfirm.mockReturnValue(false);
    });

    const renderWithRouter = () => render(
        <MemoryRouter>
            <ClubsManagement />
        </MemoryRouter>
    );

    it('renders the component title', async () => {
        renderWithRouter();
        expect(screen.getByText('Clubs Management')).toBeInTheDocument();
    });

    it('fetches clubs on mount', async () => {
        renderWithRouter();
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

        renderWithRouter();

        await waitFor(() => {
            expect(screen.getByText('Club A')).toBeInTheDocument();
            expect(screen.getByText('Club B')).toBeInTheDocument();
        });
    });
});
