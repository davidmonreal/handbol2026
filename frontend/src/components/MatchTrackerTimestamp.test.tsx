import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { MatchProvider, useMatch } from '../context/MatchContext';
import MatchTracker from './MatchTracker';

vi.mock('./match/useMatchClock', () => ({
    useMatchClock: () => undefined,
}));

vi.mock('./match/Scoreboard', () => ({
    Scoreboard: () => <div data-testid="scoreboard" />,
}));

vi.mock('./match/events/EventForm', () => ({
    EventForm: ({ onSave }: { onSave: (event: any) => void }) => (
        <button onClick={() => onSave({ teamId: 'home-1', playerId: 'p1', category: 'Shot', action: 'Goal' })}>
            Save Event
        </button>
    ),
}));

vi.mock('./match/events/EventList', () => ({
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

const TimeSetter = () => {
    const { matchId, homeTeam, setTime } = useMatch();
    useEffect(() => {
        if (matchId && homeTeam) {
            setTime(125);
        }
    }, [matchId, homeTeam, setTime]);
    return null;
};

describe('MatchTracker timestamp persistence', () => {
    beforeEach(() => {
        Object.defineProperty(window, 'localStorage', {
            value: localStorageMock,
            configurable: true,
        });
        localStorageMock.getItem.mockReturnValue(null);
        localStorageMock.setItem.mockClear();
        localStorageMock.removeItem.mockClear();
        localStorageMock.clear.mockClear();
        mockFetch.mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
            const url = input.toString();
            const method = (init?.method ?? 'GET').toUpperCase();
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
                            players: [{ player: { id: 'p1', number: 1, name: 'test-Player 1' }, position: 4 }],
                        },
                        awayTeam: {
                            id: 'away-1',
                            name: 'test-Away Team',
                            category: 'Cadet M',
                            club: { id: 'club-2', name: 'test-Club B' },
                            players: [{ player: { id: 'p2', number: 2, name: 'test-Player 2' }, position: 4 }],
                        },
                    }),
                });
            }

            if (url.includes('/api/game-events/match/')) {
                return Promise.resolve({ ok: true, json: async () => [] });
            }

            if (url.includes('/api/game-events') && method === 'POST') {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ id: 'event-1' }),
                });
            }

            return Promise.resolve({ ok: true, json: async () => ({}) });
        });
    });

    it('stores match timestamp from the live clock when no timestamp is provided', async () => {
        render(
            <MemoryRouter initialEntries={['/match/match-1']}>
                <MatchProvider>
                    <TimeSetter />
                    <Routes>
                        <Route path="/match/:matchId" element={<MatchTracker />} />
                    </Routes>
                </MatchProvider>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('test-Home Team vs test-Away Team')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Save Event'));

        await waitFor(() => {
            const postCall = mockFetch.mock.calls.find(([url, init]) => {
                if (typeof url !== 'string') return false;
                return url.includes('/api/game-events') && (init as RequestInit | undefined)?.method === 'POST';
            });
            expect(postCall).toBeDefined();
            const [, init] = postCall as [string, RequestInit];
            const body = JSON.parse(init.body as string);
            expect(body.timestamp).toBe(125);
        });
    });
});
