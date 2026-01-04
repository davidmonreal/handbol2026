import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MatchTracker from '../../components/MatchTracker';
import { MatchProvider } from '../../context/MatchContext';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useParams: () => ({ matchId: 'match-1' }),
    };
});

vi.mock('../../components/match/useMatchClock', () => ({
    useMatchClock: () => undefined,
}));

vi.mock('../../components/match/Scoreboard', () => ({
    Scoreboard: () => <div data-testid="scoreboard" />,
}));

vi.mock('../../components/match/events/EventForm', () => ({
    EventForm: () => <div data-testid="event-form" />,
}));

vi.mock('../../components/match/events/EventList', () => ({
    EventList: () => <div data-testid="event-list" />,
}));

const mockFetch = vi.fn();
globalThis.fetch = mockFetch as unknown as typeof fetch;
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};

describe('MatchTracker -> Statistics navigation', () => {
    beforeEach(() => {
        mockNavigate.mockClear();
        Object.defineProperty(window, 'localStorage', {
            value: localStorageMock,
            configurable: true,
        });
        localStorageMock.getItem.mockReturnValue(null);
        localStorageMock.setItem.mockClear();
        localStorageMock.removeItem.mockClear();
        localStorageMock.clear.mockClear();
        mockFetch.mockImplementation((input: RequestInfo | URL) => {
            const url = input.toString();
            if (url.includes('/api/matches/')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        id: 'match-1',
                        date: new Date().toISOString(),
                        isFinished: false,
                        homeScore: 0,
                        awayScore: 0,
                        realTimeFirstHalfStart: Date.now() - 60000,
                        realTimeSecondHalfStart: null,
                        realTimeFirstHalfEnd: null,
                        realTimeSecondHalfEnd: null,
                        homeTeam: {
                            id: 'home-1',
                            name: 'test-Home Team',
                            category: 'Cadet M',
                            club: { id: 'club-1', name: 'test-Club A' },
                            players: [{ player: { id: 'p1', name: 'test-Player 1' }, number: 1, position: 4 }],
                        },
                        awayTeam: {
                            id: 'away-1',
                            name: 'test-Away Team',
                            category: 'Cadet M',
                            club: { id: 'club-2', name: 'test-Club B' },
                            players: [{ player: { id: 'p2', name: 'test-Player 2' }, number: 2, position: 4 }],
                        },
                    }),
                });
            }
            if (url.includes('/api/game-events/match/')) {
                return Promise.resolve({ ok: true, json: async () => [] });
            }
            return Promise.resolve({ ok: true, json: async () => ({}) });
        });
    });

    it('navigates to statistics with match and active team ids', async () => {
        render(
            <MatchProvider>
                <MatchTracker />
            </MatchProvider>
        );

        await waitFor(() => {
            expect(screen.getByText('test-Home Team vs test-Away Team')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: 'Statistics' }));

        expect(mockNavigate).toHaveBeenCalledWith('/statistics?matchId=match-1&activeTeamId=home-1');
    });
});
