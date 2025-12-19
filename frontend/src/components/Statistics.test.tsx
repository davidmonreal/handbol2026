import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Statistics from './Statistics';
import { MatchProvider } from '../context/MatchContext';
import type { ReactNode } from 'react';

// Mock StatisticsView component
vi.mock('./stats/StatisticsView', () => ({
    StatisticsView: ({ title, teamId, onBack }: any) => (
        <div>
            <div data-testid="statistics-view">Statistics View</div>
            <div data-testid="title">{title}</div>
            <div data-testid="team-id">{teamId}</div>
            {onBack && <button onClick={onBack}>Back</button>}
        </div>
    )
}));

// Mock fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch as any;

const mockMatchData = {
    id: 'match-1',
    homeTeamId: 'team-home',
    awayTeamId: 'team-away',
    homeTeam: {
        id: 'team-home',
        name: 'Home Team',
        category: 'Cadet M',
        club: { name: 'Club A' },
        players: []
    },
    awayTeam: {
        id: 'team-away',
        name: 'Away Team',
        category: 'Juvenil M',
        club: { name: 'Club B' },
        players: []
    }
};

const TestWrapper = ({ children, initialUrl = '/statistics' }: { children: ReactNode, initialUrl?: string }) => (
    <MemoryRouter initialEntries={[initialUrl]}>
        <MatchProvider>
            <Routes>
                <Route path="/statistics" element={children} />
            </Routes>
        </MatchProvider>
    </MemoryRouter>
);

describe('Statistics', () => {
    beforeEach(() => {
        mockFetch.mockClear();
    });

    describe('URL parameter reading', () => {
        it('should read matchId from URL params', async () => {
            mockFetch
                .mockResolvedValueOnce({ ok: true, json: async () => mockMatchData })
                .mockResolvedValueOnce({ ok: true, json: async () => [] });

            render(<Statistics />, {
                wrapper: ({ children }) => (
                    <TestWrapper initialUrl="/statistics?matchId=match-1">{children}</TestWrapper>
                )
            });

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledWith(
                    expect.stringContaining('/api/matches/match-1')
                );
            });
        });

        it('should read activeTeamId from URL params', async () => {
            mockFetch
                .mockResolvedValueOnce({ ok: true, json: async () => mockMatchData })
                .mockResolvedValueOnce({ ok: true, json: async () => [] });

            render(<Statistics />, {
                wrapper: ({ children }) => (
                    <TestWrapper initialUrl="/statistics?matchId=match-1&activeTeamId=team-away">
                        {children}
                    </TestWrapper>
                )
            });

            await waitFor(() => {
                const teamId = screen.getByTestId('team-id');
                expect(teamId.textContent).toBe('team-away');
            });
        });

        it('should read playerId from URL params', async () => {
            const mockPlayerData = {
                id: 'player-1',
                name: 'Test Player',
                number: 10,
                isGoalkeeper: false
            };

            mockFetch
                .mockResolvedValueOnce({ ok: true, json: async () => mockPlayerData })
                .mockResolvedValueOnce({ ok: true, json: async () => [] });

            render(<Statistics />, {
                wrapper: ({ children }) => (
                    <TestWrapper initialUrl="/statistics?playerId=player-1">{children}</TestWrapper>
                )
            });

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledWith(
                    expect.stringContaining('/api/players/player-1')
                );
            });
        });

        it('should read teamId from URL params', async () => {
            const mockTeamData = {
                id: 'team-1',
                name: 'Test Team',
                category: 'Cadet M',
                club: { name: 'Test Club' },
                players: []
            };

            mockFetch
                .mockResolvedValueOnce({ ok: true, json: async () => mockTeamData })
                .mockResolvedValueOnce({ ok: true, json: async () => [] });

            render(<Statistics />, {
                wrapper: ({ children }) => (
                    <TestWrapper initialUrl="/statistics?teamId=team-1">{children}</TestWrapper>
                )
            });

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledWith(
                    expect.stringContaining('/api/teams/team-1')
                );
            });
        });
    });

    describe('Default team selection priority', () => {
        it('should use urlActiveTeamId as first priority', async () => {
            mockFetch
                .mockResolvedValueOnce({ ok: true, json: async () => mockMatchData })
                .mockResolvedValueOnce({ ok: true, json: async () => [] });

            render(<Statistics />, {
                wrapper: ({ children }) => (
                    <TestWrapper initialUrl="/statistics?matchId=match-1&activeTeamId=team-away">
                        {children}
                    </TestWrapper>
                )
            });

            await waitFor(() => {
                const teamId = screen.getByTestId('team-id');
                expect(teamId.textContent).toBe('team-away');
            });
        });

        it('should fall back to homeTeamId when no activeTeamId in URL', async () => {
            mockFetch
                .mockResolvedValueOnce({ ok: true, json: async () => mockMatchData })
                .mockResolvedValueOnce({ ok: true, json: async () => [] });

            render(<Statistics />, {
                wrapper: ({ children }) => (
                    <TestWrapper initialUrl="/statistics?matchId=match-1">{children}</TestWrapper>
                )
            });

            await waitFor(() => {
                const teamId = screen.getByTestId('team-id');
                // Should default to homeTeamId when no activeTeamId
                expect(teamId.textContent).toBe('team-home');
            });
        });
    });

    describe('Match data loading', () => {
        it('should load match data when matchId is present', async () => {
            mockFetch
                .mockResolvedValueOnce({ ok: true, json: async () => mockMatchData })
                .mockResolvedValueOnce({ ok: true, json: async () => [] });

            render(<Statistics />, {
                wrapper: ({ children }) => (
                    <TestWrapper initialUrl="/statistics?matchId=match-1">{children}</TestWrapper>
                )
            });

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledWith(
                    expect.stringContaining('/api/matches/match-1')
                );
                expect(mockFetch).toHaveBeenCalledWith(
                    expect.stringContaining('/api/game-events/match/match-1')
                );
            });
        });

        it('should display loading state initially', () => {
            mockFetch
                .mockImplementation(() => new Promise(() => { })); // Never resolve

            render(<Statistics />, {
                wrapper: ({ children }) => (
                    <TestWrapper initialUrl="/statistics?matchId=match-1">{children}</TestWrapper>
                )
            });

            expect(screen.getByText('Loading statistics...')).toBeInTheDocument();
        });

        it('should show message when no context is available', () => {
            render(<Statistics />, {
                wrapper: ({ children }) => (
                    <TestWrapper initialUrl="/statistics">{children}</TestWrapper>
                )
            });

            expect(screen.getByText(/Please select a team in the Match tab first/)).toBeInTheDocument();
        });
    });

    describe('Title formatting', () => {
        it('should format match title with selected team name', async () => {
            mockFetch
                .mockResolvedValueOnce({ ok: true, json: async () => mockMatchData })
                .mockResolvedValueOnce({ ok: true, json: async () => [] });

            render(<Statistics />, {
                wrapper: ({ children }) => (
                    <TestWrapper initialUrl="/statistics?matchId=match-1&activeTeamId=team-home">
                        {children}
                    </TestWrapper>
                )
            });

            await waitFor(() => {
                const title = screen.getByTestId('title');
                expect(title.textContent).toContain('Home Team');
            });
        });

        it('should show away team name when away team is selected', async () => {
            mockFetch
                .mockResolvedValueOnce({ ok: true, json: async () => mockMatchData })
                .mockResolvedValueOnce({ ok: true, json: async () => [] });

            render(<Statistics />, {
                wrapper: ({ children }) => (
                    <TestWrapper initialUrl="/statistics?matchId=match-1&activeTeamId=team-away">
                        {children}
                    </TestWrapper>
                )
            });

            await waitFor(() => {
                const title = screen.getByTestId('title');
                expect(title.textContent).toContain('Away Team');
            });
        });
    });

    describe('Error handling', () => {
        it('should handle match loading errors gracefully', async () => {
            const consoleError = vi.spyOn(console, 'error').mockImplementation(() => { });
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            render(<Statistics />, {
                wrapper: ({ children }) => (
                    <TestWrapper initialUrl="/statistics?matchId=match-1">{children}</TestWrapper>
                )
            });

            await waitFor(() => {
                expect(consoleError).toHaveBeenCalledWith(
                    'Error loading statistics:',
                    expect.any(Error)
                );
            });

            consoleError.mockRestore();
        });
    });
});
