import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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
            { id: '1', name: 'test-2023-2024', startDate: '2023-09-01', endDate: '2024-06-30' },
            { id: '2', name: 'test-2024-2025', startDate: '2024-09-01', endDate: '2025-06-30' },
        ];

        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => mockSeasons,
        });

        render(<SeasonsManagement />);

        await waitFor(() => {
            expect(screen.getByText('test-2023-2024')).toBeInTheDocument();
            expect(screen.getByText('test-2024-2025')).toBeInTheDocument();
        });
    });

    it('creates a season via the modal form', async () => {
        mockFetch
            .mockResolvedValueOnce({ ok: true, json: async () => [] })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    id: 'season-1',
                    name: 'test-2024-2025',
                    startDate: '2024-09-01',
                    endDate: '2025-06-30',
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => [{
                    id: 'season-1',
                    name: 'test-2024-2025',
                    startDate: '2024-09-01',
                    endDate: '2025-06-30',
                }],
            });

        render(<SeasonsManagement />);

        await waitFor(() => {
            expect(screen.getByText('New Season')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('New Season'));

        fireEvent.change(screen.getByLabelText('Season Name'), { target: { value: 'test-2024-2025' } });
        fireEvent.change(screen.getByLabelText('Start Date'), { target: { value: '2024-09-01' } });
        fireEvent.change(screen.getByLabelText('End Date'), { target: { value: '2025-06-30' } });

        fireEvent.click(screen.getByRole('button', { name: 'Create' }));

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/seasons'),
                expect.objectContaining({ method: 'POST' }),
            );
        });
    });

    it('updates a season via the modal form', async () => {
        const mockSeasons = [
            { id: 'season-1', name: 'test-2023-2024', startDate: '2023-09-01', endDate: '2024-06-30' },
        ];
        mockFetch
            .mockResolvedValueOnce({ ok: true, json: async () => mockSeasons })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    id: 'season-1',
                    name: 'test-2023-2024 Updated',
                    startDate: '2023-09-01',
                    endDate: '2024-06-30',
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => [{
                    id: 'season-1',
                    name: 'test-2023-2024 Updated',
                    startDate: '2023-09-01',
                    endDate: '2024-06-30',
                }],
            });

        render(<SeasonsManagement />);

        await waitFor(() => {
            expect(screen.getByText('test-2023-2024')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: 'Edit Season' }));
        fireEvent.change(screen.getByLabelText('Season Name'), { target: { value: 'test-2023-2024 Updated' } });
        fireEvent.click(screen.getByRole('button', { name: 'Update' }));

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/seasons/season-1'),
                expect.objectContaining({ method: 'PUT' }),
            );
        });
    });

    it('deletes a season and refreshes the list', async () => {
        const mockSeasons = [
            { id: 'season-1', name: 'test-2023-2024', startDate: '2023-09-01', endDate: '2024-06-30' },
        ];
        mockFetch
            .mockResolvedValueOnce({ ok: true, json: async () => mockSeasons })
            .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
            .mockResolvedValueOnce({ ok: true, json: async () => [] });

        render(<SeasonsManagement />);

        await waitFor(() => {
            expect(screen.getByText('test-2023-2024')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: 'Delete Season' }));
        fireEvent.click(await screen.findByRole('button', { name: 'Delete' }));

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/seasons/season-1'),
                expect.objectContaining({ method: 'DELETE' }),
            );
        });
    });
});
