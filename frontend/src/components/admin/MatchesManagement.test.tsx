import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MatchesManagement } from './MatchesManagement';
import { BrowserRouter } from 'react-router-dom';

// Mock API
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock Navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('MatchesManagement', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => [],
        });
    });

    it('renders the component title', async () => {
        render(
            <BrowserRouter>
                <MatchesManagement />
            </BrowserRouter>
        );
        expect(screen.getByText('Matches Management')).toBeInTheDocument();
    });

    it('fetches teams on mount (dependency)', async () => {
        render(
            <BrowserRouter>
                <MatchesManagement />
            </BrowserRouter>
        );
        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/teams'));
    });

    it('displays matches in the table', async () => {
        const mockMatches = [
            {
                id: '1',
                date: '2024-12-01T12:00:00Z',
                homeTeam: { name: 'Home Team A', club: { name: 'Club A' } },
                awayTeam: { name: 'Away Team B', club: { name: 'Club B' } },
                isFinished: false,
            },
        ];

        mockFetch.mockImplementation((url) => {
            if (url.includes('/api/teams')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => [],
                });
            }
            if (url.includes('/api/matches')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => mockMatches,
                });
            }
            return Promise.resolve({ ok: true, json: async () => [] });
        });

        render(
            <BrowserRouter>
                <MatchesManagement />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Home Team A')).toBeInTheDocument();
            expect(screen.getByText('Away Team B')).toBeInTheDocument();
        });
    });
});
