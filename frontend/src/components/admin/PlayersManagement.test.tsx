import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PlayersManagement } from './PlayersManagement';
import type { Player } from '../../types';

const createMockResponse = <T,>(data: T) => ({
    ok: true,
    json: async () => data,
});

describe('PlayersManagement UI flows', () => {
    type PlayerListResponse = { data: Player[]; total: number };

    const playerRow: Player = {
        id: 'player-1',
        name: 'test-player',
        number: 18,
        handedness: 'RIGHT',
        isGoalkeeper: false,
        teams: [],
    };

    type FetchMock = ReturnType<typeof vi.fn> & { playersQueue?: PlayerListResponse[] };

    let fetchMock: FetchMock;

    beforeEach(() => {
        fetchMock = vi.fn((url: string, init?: RequestInit) => {
            if (url.includes('/api/clubs')) {
                return Promise.resolve(createMockResponse([]));
            }

            if (url.includes('/api/players?')) {
                const payload =
                    fetchMock.playersQueue && fetchMock.playersQueue.length > 0
                        ? fetchMock.playersQueue.shift()!
                        : { data: [], total: 0 };
                return Promise.resolve(createMockResponse(payload));
            }

            if (url.includes(`/api/players/${playerRow.id}`) && init?.method === 'DELETE') {
                return Promise.resolve(createMockResponse({}));
            }

            return Promise.resolve(createMockResponse([]));
        }) as FetchMock;

        fetchMock.playersQueue = [
            { data: [playerRow], total: 1 },
            { data: [], total: 0 },
        ];

        globalThis.fetch = fetchMock as unknown as typeof fetch;
    });

    afterEach(() => {
        vi.clearAllMocks();
        vi.useRealTimers();
    });

    it('waits for search results before showing empty state and enabling actions', async () => {
        const pendingPlayers: { resolve: (value: ReturnType<typeof createMockResponse>) => void } = {
            resolve: () => undefined,
        };

        fetchMock = vi.fn((url: string, init?: RequestInit) => {
            if (url.includes('/api/clubs')) {
                return Promise.resolve(createMockResponse([]));
            }

            if (url.includes('/api/players?')) {
                return new Promise((resolve) => {
                    pendingPlayers.resolve = resolve;
                });
            }

            if (url.includes(`/api/players/${playerRow.id}`) && init?.method === 'DELETE') {
                return Promise.resolve(createMockResponse({}));
            }

            return Promise.resolve(createMockResponse([]));
        }) as FetchMock;

        globalThis.fetch = fetchMock as unknown as typeof fetch;

        render(
            <MemoryRouter>
                <PlayersManagement />
            </MemoryRouter>,
        );

        await waitFor(() => expect(screen.getByText('Players Management')).toBeInTheDocument());

        const searchInput = screen.getByPlaceholderText('Search players...');
        fireEvent.change(searchInput, { target: { value: 'test' } });

        await waitFor(() =>
            expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/players?')),
        );

        expect(
            screen.queryByText('No players found. Create your first player!'),
        ).not.toBeInTheDocument();

        const importButton = screen.getByRole('button', { name: 'Import Players' });
        const createButton = screen.getByRole('button', { name: 'New Player' });
        expect(importButton).toBeDisabled();
        expect(createButton).toBeDisabled();

        pendingPlayers.resolve(createMockResponse({ data: [], total: 0 }));

        await waitFor(() => expect(importButton).toBeEnabled());
        expect(createButton).toBeEnabled();
        expect(screen.getByText('No players found. Create your first player!')).toBeInTheDocument();
    });

    it('deletes a player from the table and refreshes the list', async () => {
        render(
            <MemoryRouter>
                <PlayersManagement />
            </MemoryRouter>,
        );

        await waitFor(() => expect(screen.getByText('Players Management')).toBeInTheDocument());

        const searchInput = screen.getByPlaceholderText('Search players...');
        fireEvent.change(searchInput, { target: { value: playerRow.name } });

        await waitFor(() =>
            expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/players?')),
        );
        await waitFor(() => expect(screen.getByText(playerRow.name)).toBeInTheDocument());

        const deleteButton = screen.getByRole('button', { name: 'Delete Player' });
        fireEvent.click(deleteButton);

        fireEvent.click(await screen.findByRole('button', { name: 'Delete' }));

        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledWith(
                expect.stringContaining(`/api/players/${playerRow.id}`),
                expect.objectContaining({ method: 'DELETE' }),
            );
        });

        await waitFor(() => {
            expect(screen.queryByText(playerRow.name)).not.toBeInTheDocument();
        });

        expect(screen.getByText('No players found. Create your first player!')).toBeInTheDocument();
    });
});
