import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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
            { id: '1', name: 'test-Club A' },
            { id: '2', name: 'test-Club B' },
        ];

        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => mockClubs,
        });

        renderWithRouter();

        await waitFor(() => {
            expect(screen.getByText('test-Club A')).toBeInTheDocument();
            expect(screen.getByText('test-Club B')).toBeInTheDocument();
        });
    });

    it('creates a club via the modal form', async () => {
        mockFetch
            .mockResolvedValueOnce({ ok: true, json: async () => [] })
            .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'club-1', name: 'test-New Club' }) })
            .mockResolvedValueOnce({ ok: true, json: async () => [{ id: 'club-1', name: 'test-New Club' }] });

        renderWithRouter();

        await waitFor(() => {
            expect(screen.getByText('New Club')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('New Club'));

        const nameInput = screen.getByLabelText('Club Name');
        fireEvent.change(nameInput, { target: { value: 'test-New Club' } });

        fireEvent.click(screen.getByRole('button', { name: 'Create' }));

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/clubs'),
                expect.objectContaining({ method: 'POST' }),
            );
        });
    });

    it('updates a club via the modal form', async () => {
        const mockClubs = [{ id: 'club-1', name: 'test-Club A' }];
        mockFetch
            .mockResolvedValueOnce({ ok: true, json: async () => mockClubs })
            .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'club-1', name: 'test-Club A Updated' }) })
            .mockResolvedValueOnce({ ok: true, json: async () => [{ id: 'club-1', name: 'test-Club A Updated' }] });

        renderWithRouter();

        await waitFor(() => {
            expect(screen.getByText('test-Club A')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: 'Edit Club' }));
        const nameInput = screen.getByLabelText('Club Name');
        fireEvent.change(nameInput, { target: { value: 'test-Club A Updated' } });
        fireEvent.click(screen.getByRole('button', { name: 'Update' }));

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/clubs/club-1'),
                expect.objectContaining({ method: 'PUT' }),
            );
        });
    });

    it('deletes a club and refreshes the list', async () => {
        const mockClubs = [{ id: 'club-1', name: 'test-Club A' }];
        mockFetch
            .mockResolvedValueOnce({ ok: true, json: async () => mockClubs })
            .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
            .mockResolvedValueOnce({ ok: true, json: async () => [] });

        renderWithRouter();

        await waitFor(() => {
            expect(screen.getByText('test-Club A')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: 'Delete Club' }));
        fireEvent.click(await screen.findByRole('button', { name: 'Delete' }));

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/clubs/club-1'),
                expect.objectContaining({ method: 'DELETE' }),
            );
        });
    });
});
