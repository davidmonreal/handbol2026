import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { TeamFormPage } from './TeamFormPage';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch as unknown as typeof fetch;

describe('TeamFormPage', () => {
    beforeEach(() => {
        mockFetch.mockReset();
    });

    const renderRoute = (path: string) => render(
        <MemoryRouter initialEntries={[path]}>
            <Routes>
                <Route path="/teams/new" element={<TeamFormPage />} />
                <Route path="/teams/:id/edit" element={<TeamFormPage />} />
            </Routes>
        </MemoryRouter>
    );

    it('creates a team with selected club, category, and season', async () => {
        mockFetch.mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
            const url = input.toString();
            const method = (init?.method ?? 'GET').toUpperCase();

            if (url.includes('/api/clubs')) {
                return Promise.resolve({ ok: true, json: async () => [{ id: 'club-1', name: 'test-Club A' }] });
            }
            if (url.includes('/api/seasons')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => [{ id: 'season-1', name: 'test-2024-2025', startDate: '2024-09-01', endDate: '2025-06-30' }],
                });
            }
            if (url.includes('/api/teams') && method === 'POST') {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        id: 'team-1',
                        name: 'test-Team A',
                        category: 'Cadet M',
                        club: { id: 'club-1', name: 'test-Club A' },
                        season: { id: 'season-1', name: 'test-2024-2025' },
                        isMyTeam: false,
                    }),
                });
            }
            return Promise.resolve({ ok: true, json: async () => ({}) });
        });

        renderRoute('/teams/new');

        await waitFor(() => {
            expect(screen.getByText('New Team')).toBeInTheDocument();
        });

        fireEvent.change(screen.getByPlaceholderText('e.g. Cadet A'), { target: { value: 'test-Team A' } });

        fireEvent.click(screen.getByRole('button', { name: /Select or create club/i }));
        fireEvent.click(screen.getByText('test-Club A'));

        fireEvent.click(screen.getByRole('button', { name: 'Senior M' }));
        fireEvent.click(screen.getByText('Cadet M'));

        fireEvent.click(screen.getByRole('button', { name: 'Create Team' }));

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/teams'),
                expect.objectContaining({ method: 'POST' }),
            );
        });
    });

    it('updates an existing team', async () => {
        mockFetch.mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
            const url = input.toString();
            const method = (init?.method ?? 'GET').toUpperCase();

            if (url.includes('/api/clubs')) {
                return Promise.resolve({ ok: true, json: async () => [{ id: 'club-1', name: 'test-Club A' }] });
            }
            if (url.includes('/api/seasons')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => [{ id: 'season-1', name: 'test-2024-2025', startDate: '2024-09-01', endDate: '2025-06-30' }],
                });
            }
            if (url.includes('/api/teams/team-1') && method === 'GET') {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        id: 'team-1',
                        name: 'test-Team A',
                        category: 'Cadet M',
                        club: { id: 'club-1', name: 'test-Club A' },
                        season: { id: 'season-1', name: 'test-2024-2025' },
                        isMyTeam: false,
                    }),
                });
            }
            if (url.includes('/api/teams/team-1') && method === 'PUT') {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        id: 'team-1',
                        name: 'test-Team A Updated',
                        category: 'Cadet M',
                        club: { id: 'club-1', name: 'test-Club A' },
                        season: { id: 'season-1', name: 'test-2024-2025' },
                        isMyTeam: false,
                    }),
                });
            }
            return Promise.resolve({ ok: true, json: async () => ({}) });
        });

        renderRoute('/teams/team-1/edit');

        await waitFor(() => {
            expect(screen.getByText('Edit Team')).toBeInTheDocument();
        });

        const nameInput = screen.getByPlaceholderText('e.g. Cadet A');
        fireEvent.change(nameInput, { target: { value: 'test-Team A Updated' } });
        fireEvent.click(screen.getByRole('button', { name: 'Update Team' }));

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/teams/team-1'),
                expect.objectContaining({ method: 'PUT' }),
            );
        });
    });
});
