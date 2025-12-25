import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import type { ReactNode } from 'react';
import { MatchProvider } from '../context/MatchContext';
import VideoMatchTracker from './VideoMatchTracker';

const videoSyncState = {
    isVideoLoaded: true,
    currentVideoTime: 130,
    getMatchTimeFromVideo: vi.fn(() => 30),
    getVideoTimeFromMatch: vi.fn(),
    isCalibrated: true,
    secondHalfStart: null,
    seekToTime: vi.fn(),
};

vi.mock('../context/VideoSyncContext', () => ({
    VideoSyncProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
    useVideoSync: () => videoSyncState,
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

vi.mock('./video/YouTubePlayer', () => ({
    YouTubePlayer: () => <div data-testid="youtube-player" />,
}));

vi.mock('./video/VideoUrlInput', () => ({
    VideoUrlInput: () => <div data-testid="video-url-input" />,
}));

vi.mock('./video/VideoCalibration', () => ({
    VideoCalibration: () => <div data-testid="video-calibration" />,
}));

const mockFetch = vi.fn();
globalThis.fetch = mockFetch as unknown as typeof fetch;
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};

describe('VideoMatchTracker timestamp persistence', () => {
    beforeEach(() => {
        Object.defineProperty(window, 'localStorage', {
            value: localStorageMock,
            configurable: true,
        });
        localStorageMock.getItem.mockReturnValue(null);
        localStorageMock.setItem.mockClear();
        localStorageMock.removeItem.mockClear();
        localStorageMock.clear.mockClear();
        videoSyncState.getMatchTimeFromVideo.mockClear();
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
                        firstHalfVideoStart: 100,
                        secondHalfVideoStart: null,
                        homeTeam: {
                            id: 'home-1',
                            name: 'test-Home Team',
                            category: 'Cadet M',
                            club: { name: 'test-Club A' },
                            players: [{ player: { id: 'p1', number: 1, name: 'test-Player 1' }, position: 4 }],
                        },
                        awayTeam: {
                            id: 'away-1',
                            name: 'test-Away Team',
                            category: 'Cadet M',
                            club: { name: 'test-Club B' },
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

    it('stores match timestamp derived from video calibration', async () => {
        const renderUi = () => (
            <MemoryRouter initialEntries={['/video-tracker/match-1']}>
                <MatchProvider>
                    <Routes>
                        <Route path="/video-tracker/:matchId" element={<VideoMatchTracker />} />
                    </Routes>
                </MatchProvider>
            </MemoryRouter>
        );
        const { rerender } = render(renderUi());

        await screen.findByRole('heading', { name: /test-Home Team vs test-Away Team/i });

        await waitFor(() => {
            expect(videoSyncState.getMatchTimeFromVideo).toHaveBeenCalledWith(130);
        });

        videoSyncState.getMatchTimeFromVideo.mockClear();
        videoSyncState.currentVideoTime = 131;
        videoSyncState.getMatchTimeFromVideo.mockReturnValue(31);
        rerender(renderUi());

        await waitFor(() => {
            expect(videoSyncState.getMatchTimeFromVideo).toHaveBeenCalledWith(131);
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
            expect(body.timestamp).toBe(31);
            expect(body.videoTimestamp).toBe(131);
        });
    });
});
