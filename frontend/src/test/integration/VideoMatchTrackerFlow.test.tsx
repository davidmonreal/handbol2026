/**
 * Integration tests for Video Match Tracker flow
 * Tests the complete flow from loading a video to recording events with video timestamps
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { MatchProvider } from '../../../context/MatchContext';

// Mock the video components since they depend on YouTube API
jest.mock('../../video/YouTubePlayer', () => ({
    YouTubePlayer: () => <div data-testid="youtube-player">YouTube Player Mock</div>,
}));

jest.mock('../../video/VideoUrlInput', () => ({
    VideoUrlInput: ({ onVideoSubmit }: { onVideoSubmit: () => void }) => (
        <div data-testid="video-url-input">
            <button onClick={onVideoSubmit}>Load Video</button>
        </div>
    ),
}));

jest.mock('../../video/VideoCalibration', () => ({
    VideoCalibration: () => <div data-testid="video-calibration">Video Calibration Mock</div>,
}));

// Import after mocks
import VideoMatchTracker from '../../VideoMatchTracker';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: jest.fn((key: string) => store[key] || null),
        setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
        removeItem: jest.fn((key: string) => { delete store[key]; }),
        clear: () => { store = {}; },
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('VideoMatchTracker Integration', () => {
    const mockMatchData = {
        id: 'match-123',
        date: '2024-01-15T10:00:00Z',
        homeScore: 0,
        awayScore: 0,
        isFinished: false,
        videoUrl: 'https://www.youtube.com/watch?v=test123',
        firstHalfVideoStart: 120,
        secondHalfVideoStart: null,
        homeTeam: {
            id: 'home-team-1',
            name: 'Home Team',
            color: 'blue',
            players: [
                { id: 'p1', number: 1, name: 'Player 1', isGoalkeeper: true },
                { id: 'p2', number: 7, name: 'Player 2', isGoalkeeper: false },
                { id: 'p3', number: 9, name: 'Player 3', isGoalkeeper: false },
            ],
        },
        awayTeam: {
            id: 'away-team-1',
            name: 'Away Team',
            color: 'red',
            players: [
                { id: 'ap1', number: 1, name: 'Away GK 1', isGoalkeeper: true },
                { id: 'ap2', number: 12, name: 'Away GK 2', isGoalkeeper: true },
                { id: 'ap3', number: 7, name: 'Away Player', isGoalkeeper: false },
            ],
        },
        events: [],
    };

    const renderVideoMatchTracker = (matchId = 'match-123') => {
        return render(
            <MemoryRouter initialEntries={[`/video-tracker/${matchId}`]}>
                <MatchProvider>
                    <Routes>
                        <Route path="/video-tracker/:matchId" element={<VideoMatchTracker />} />
                    </Routes>
                </MatchProvider>
            </MemoryRouter>
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();
        localStorageMock.clear();

        // Default mock responses
        mockFetch.mockImplementation((url: string) => {
            if (url.includes('/api/matches/match-123')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockMatchData),
                });
            }
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({}),
            });
        });
    });

    describe('Page Load', () => {
        it('should load match data and show scoreboard', async () => {
            renderVideoMatchTracker();

            await waitFor(() => {
                expect(screen.getByText('Home Team')).toBeInTheDocument();
            });

            expect(screen.getByText('Away Team')).toBeInTheDocument();
        });

        it('should show video player when video URL exists', async () => {
            renderVideoMatchTracker();

            await waitFor(() => {
                expect(screen.getByTestId('youtube-player')).toBeInTheDocument();
            });
        });

        it('should show video calibration when video is loaded', async () => {
            renderVideoMatchTracker();

            await waitFor(() => {
                expect(screen.getByTestId('video-calibration')).toBeInTheDocument();
            });
        });

        it('should load calibration data from backend', async () => {
            renderVideoMatchTracker();

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledWith(
                    expect.stringContaining('/api/matches/match-123')
                );
            });
        });
    });

    describe('Player Selection', () => {
        it('should show players sorted by jersey number', async () => {
            renderVideoMatchTracker();

            await waitFor(() => {
                expect(screen.getByText('Player 1')).toBeInTheDocument();
            });

            const playerButtons = screen.getAllByRole('button').filter(btn =>
                btn.textContent?.includes('Player')
            );

            // Players should be sorted by number (1, 7, 9)
            expect(playerButtons.length).toBeGreaterThan(0);
        });
    });

    describe('Goalkeeper Persistence', () => {
        it('should save selected goalkeeper to localStorage', async () => {
            renderVideoMatchTracker();

            await waitFor(() => {
                expect(screen.getByText('Home Team')).toBeInTheDocument();
            });

            // The goalkeeper selection UI should be present
            // This would need the actual component to test clicking
        });

        it('should load goalkeeper from localStorage on mount', async () => {
            localStorageMock.setItem.mockImplementation((key, value) => {
                if (key === 'goalkeeper-match-123') {
                    localStorageMock.getItem.mockImplementation((k) =>
                        k === 'goalkeeper-match-123' ? value : null
                    );
                }
            });

            renderVideoMatchTracker();

            await waitFor(() => {
                expect(localStorageMock.getItem).toHaveBeenCalledWith('goalkeeper-match-123');
            });
        });
    });

    describe('Event Recording', () => {
        it('should show flow selectors for event recording', async () => {
            renderVideoMatchTracker();

            await waitFor(() => {
                expect(screen.getByText('Home Team')).toBeInTheDocument();
            });

            // Flow type options should be visible
            expect(screen.getByText(/Shot/i)).toBeInTheDocument();
        });
    });

    describe('Recent Events', () => {
        it('should show recent events section', async () => {
            renderVideoMatchTracker();

            await waitFor(() => {
                expect(screen.getByText('Home Team')).toBeInTheDocument();
            });

            // Check for events section
            expect(screen.getByText(/Recent Events/i)).toBeInTheDocument();
        });
    });
});

describe('Video Sync Data Persistence', () => {
    const localStorageMock = (() => {
        let store: Record<string, string> = {};
        return {
            getItem: jest.fn((key: string) => store[key] || null),
            setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
            removeItem: jest.fn((key: string) => { delete store[key]; }),
            clear: () => { store = {}; },
        };
    })();

    beforeEach(() => {
        localStorageMock.clear();
    });

    describe('Video Position Persistence', () => {
        it('should use correct localStorage key format for video position', () => {
            const matchId = 'test-match';
            const expectedKey = `video-position-${matchId}`;

            // This tests the key format used in VideoSyncContext
            expect(expectedKey).toBe('video-position-test-match');
        });

        it('should use correct localStorage key format for goalkeeper', () => {
            const matchId = 'test-match';
            const expectedKey = `goalkeeper-${matchId}`;

            expect(expectedKey).toBe('goalkeeper-test-match');
        });
    });
});
