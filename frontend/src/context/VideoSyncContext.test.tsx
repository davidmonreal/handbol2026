import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { ReactNode } from 'react';
import { VideoSyncProvider, useVideoSync } from './VideoSyncContext';

// Mock fetch - use the global mock from setup.ts
const mockFetch = globalThis.fetch as ReturnType<typeof vi.fn>;

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
        removeItem: vi.fn((key: string) => { delete store[key]; }),
        clear: () => { store = {}; },
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('VideoSyncContext', () => {
    const testMatchId = 'test-match-123';

    const wrapper = ({ children }: { children: ReactNode }) => (
        <VideoSyncProvider matchId={testMatchId}>
            {children}
        </VideoSyncProvider>
    );

    // Default mock response for any fetch call
    const defaultMockResponse = () => ({
        ok: true,
        json: () => Promise.resolve({ videoUrl: null }),
    });

    beforeEach(() => {
        vi.resetAllMocks();
        localStorageMock.clear();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Initial State', () => {
        it('should initialize with default values', async () => {
            mockFetch.mockImplementation(() => Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ videoUrl: null }),
            }));

            const { result } = renderHook(() => useVideoSync(), { wrapper });

            expect(result.current.isVideoLoaded).toBe(false);
            expect(result.current.videoUrl).toBeNull();
            expect(result.current.videoId).toBeNull();
            expect(result.current.firstHalfStart).toBeNull();
            expect(result.current.secondHalfStart).toBeNull();
            expect(result.current.isCalibrated).toBe(false);
            expect(result.current.currentVideoTime).toBe(0);
        });

        it('should load video URL from backend on mount', async () => {
            const mockVideoUrl = 'https://www.youtube.com/watch?v=test123';
            mockFetch.mockImplementation(() => Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    videoUrl: mockVideoUrl,
                    firstHalfVideoStart: null,
                    secondHalfVideoStart: null,
                }),
            }));

            const { result } = renderHook(() => useVideoSync(), { wrapper });

            await waitFor(() => {
                expect(result.current.isVideoLoaded).toBe(true);
            });

            expect(result.current.videoUrl).toBe(mockVideoUrl);
            expect(result.current.videoId).toBe('test123');
        });

        it('should load calibration from backend on mount', async () => {
            mockFetch.mockImplementation(() => Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    videoUrl: 'https://www.youtube.com/watch?v=abc',
                    firstHalfVideoStart: 120,
                    secondHalfVideoStart: 2000,
                }),
            }));

            const { result } = renderHook(() => useVideoSync(), { wrapper });

            await waitFor(() => {
                expect(result.current.isCalibrated).toBe(true);
            });

            expect(result.current.firstHalfStart).toBe(120);
            expect(result.current.secondHalfStart).toBe(2000);
        });
    });

    describe('Video URL Management', () => {
        it('should set video URL and extract video ID', async () => {
            mockFetch.mockImplementation(() => Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ videoUrl: null }),
            }));

            const { result } = renderHook(() => useVideoSync(), { wrapper });

            act(() => {
                result.current.setVideoUrl('https://www.youtube.com/watch?v=newvideo123');
            });

            expect(result.current.videoUrl).toBe('https://www.youtube.com/watch?v=newvideo123');
            expect(result.current.videoId).toBe('newvideo123');
            expect(result.current.isVideoLoaded).toBe(true);
        });

        it('should extract video ID from various YouTube URL formats', async () => {
            mockFetch.mockImplementation(() => Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ videoUrl: null }),
            }));

            const { result } = renderHook(() => useVideoSync(), { wrapper });

            // Standard watch URL
            act(() => {
                result.current.setVideoUrl('https://www.youtube.com/watch?v=abc123');
            });
            expect(result.current.videoId).toBe('abc123');

            // Short URL
            act(() => {
                result.current.setVideoUrl('https://youtu.be/def456');
            });
            expect(result.current.videoId).toBe('def456');

            // Embed URL
            act(() => {
                result.current.setVideoUrl('https://www.youtube.com/embed/ghi789');
            });
            expect(result.current.videoId).toBe('ghi789');
        });

        it('should clear video state', async () => {
            mockFetch.mockImplementation(() => Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    videoUrl: 'https://www.youtube.com/watch?v=test',
                    firstHalfVideoStart: 100,
                }),
            }));

            const { result } = renderHook(() => useVideoSync(), { wrapper });

            await waitFor(() => {
                expect(result.current.isVideoLoaded).toBe(true);
            });

            act(() => {
                result.current.clearVideo();
            });

            expect(result.current.isVideoLoaded).toBe(false);
            expect(result.current.videoUrl).toBeNull();
            expect(result.current.videoId).toBeNull();
        });
    });

    describe('Calibration', () => {
        beforeEach(() => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ videoUrl: null }),
            });
        });

        it('should set first half start time', async () => {
            const { result } = renderHook(() => useVideoSync(), { wrapper });

            act(() => {
                result.current.setFirstHalfStart(150);
            });

            expect(result.current.firstHalfStart).toBe(150);
            expect(result.current.isCalibrated).toBe(true);
        });

        it('should set second half start time', async () => {
            const { result } = renderHook(() => useVideoSync(), { wrapper });

            act(() => {
                result.current.setFirstHalfStart(100);
                result.current.setSecondHalfStart(2100);
            });

            expect(result.current.secondHalfStart).toBe(2100);
        });

        it('should save calibration to database when set', async () => {
            const { result } = renderHook(() => useVideoSync(), { wrapper });

            act(() => {
                result.current.setFirstHalfStart(200);
            });

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledWith(
                    expect.stringContaining(`/api/matches/${testMatchId}`),
                    expect.objectContaining({
                        method: 'PATCH',
                        body: expect.stringContaining('"firstHalfVideoStart":200'),
                    })
                );
            });
        });
    });

    describe('Match Time Calculation', () => {
        beforeEach(() => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ videoUrl: null }),
            });
        });

        it('should return 0 when not calibrated', async () => {
            const { result } = renderHook(() => useVideoSync(), { wrapper });

            const matchTime = result.current.getMatchTimeFromVideo(500);
            expect(matchTime).toBe(0);
        });

        it('should calculate first half match time correctly', async () => {
            const { result } = renderHook(() => useVideoSync(), { wrapper });

            act(() => {
                result.current.setFirstHalfStart(100); // First half starts at video second 100
            });

            // Video at 160 seconds = 60 seconds into the match
            expect(result.current.getMatchTimeFromVideo(160)).toBe(60);

            // Video at 400 seconds = 300 seconds (5 min) into the match
            expect(result.current.getMatchTimeFromVideo(400)).toBe(300);
        });

        it('should calculate second half match time correctly', async () => {
            const { result } = renderHook(() => useVideoSync(), { wrapper });

            act(() => {
                result.current.setFirstHalfStart(100);
                result.current.setSecondHalfStart(2000); // Second half starts at video second 2000
            });

            // Video at 2060 seconds = 30 min (first half) + 60 seconds = 1860 seconds
            const HALF_DURATION = 30 * 60; // 30 minutes
            expect(result.current.getMatchTimeFromVideo(2060)).toBe(HALF_DURATION + 60);
        });

        it('should not return negative match time', async () => {
            const { result } = renderHook(() => useVideoSync(), { wrapper });

            act(() => {
                result.current.setFirstHalfStart(100);
            });

            // Video at 50 seconds (before first half starts)
            expect(result.current.getMatchTimeFromVideo(50)).toBe(0);
        });
    });

    describe('Video Time Updates', () => {
        it('should update current video time', async () => {
            mockFetch.mockImplementation(() => Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ videoUrl: null }),
            }));

            const { result } = renderHook(() => useVideoSync(), { wrapper });

            act(() => {
                result.current.updateVideoTime(300);
            });

            expect(result.current.currentVideoTime).toBe(300);
        });
    });

    describe('Seek Functionality', () => {
        it('should register and call seek function', async () => {
            mockFetch.mockImplementation(() => Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ videoUrl: null }),
            }));

            const { result } = renderHook(() => useVideoSync(), { wrapper });
            const mockSeekFn = vi.fn();

            act(() => {
                result.current.registerSeekFunction(mockSeekFn);
            });

            act(() => {
                result.current.seekToTime(300);
            });

            expect(mockSeekFn).toHaveBeenCalledWith(300);
        });
    });

    describe('Reset', () => {
        it('should reset all state to initial values', async () => {
            mockFetch.mockImplementation(() => Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    videoUrl: 'https://www.youtube.com/watch?v=test',
                    firstHalfVideoStart: 100,
                }),
            }));

            const { result } = renderHook(() => useVideoSync(), { wrapper });

            await waitFor(() => {
                expect(result.current.isVideoLoaded).toBe(true);
            });

            act(() => {
                result.current.reset();
            });

            expect(result.current.isVideoLoaded).toBe(false);
            expect(result.current.videoUrl).toBeNull();
            expect(result.current.firstHalfStart).toBeNull();
            expect(result.current.isCalibrated).toBe(false);
        });

        it('should remove localStorage data on reset', async () => {
            mockFetch.mockImplementation(() => Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ videoUrl: null }),
            }));

            const { result } = renderHook(() => useVideoSync(), { wrapper });

            act(() => {
                result.current.reset();
            });

            expect(localStorageMock.removeItem).toHaveBeenCalledWith(`video-position-${testMatchId}`);
        });
    });
});
