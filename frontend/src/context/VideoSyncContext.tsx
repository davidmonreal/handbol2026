import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { API_BASE_URL } from '../config/api';

interface VideoSyncState {
    videoUrl: string | null;
    videoId: string | null;
    isVideoLoaded: boolean;
    firstHalfStart: number | null;    // Video timestamp when 1st half starts
    secondHalfStart: number | null;   // Video timestamp when 2nd half starts
    currentVideoTime: number;         // Current video playback time
    isCalibrated: boolean;            // True when at least 1st half start is set
    isTimeout: boolean;               // True during a timeout
    timeoutVideoStart: number | null; // Video time when timeout started
}

interface VideoSyncContextType extends VideoSyncState {
    setVideoUrl: (url: string) => void;
    clearVideo: () => void;
    setFirstHalfStart: (time: number) => void;
    setSecondHalfStart: (time: number) => void;
    updateVideoTime: (time: number) => void;
    startTimeout: () => void;
    endTimeout: () => void;
    getMatchTimeFromVideo: (videoTime: number) => number;
    getVideoTimeFromMatch: (matchTime: number) => number | null;
    reset: () => void;
    savedVideoTime: number | null;
    seekToTime: (time: number) => void;
    registerSeekFunction: (fn: (time: number) => void) => void;
}

interface VideoSyncProviderProps {
    children: ReactNode;
    matchId: string;
}

const INITIAL_STATE: VideoSyncState = {
    videoUrl: null,
    videoId: null,
    isVideoLoaded: false,
    firstHalfStart: null,
    secondHalfStart: null,
    currentVideoTime: 0,
    isCalibrated: false,
    isTimeout: false,
    timeoutVideoStart: null,
};

const VideoSyncContext = createContext<VideoSyncContextType | undefined>(undefined);

/**
 * Extract YouTube video ID from various URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/live/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 */
const extractVideoId = (url: string): string | null => {
    const patterns = [
        /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
        /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
};

const HALF_DURATION_SECONDS = 30 * 60; // 30 minutes default

// LocalStorage key for video position data
const getCalibrationKey = (matchId: string) => `video-position-${matchId}`;

export const VideoSyncProvider = ({ children, matchId }: VideoSyncProviderProps) => {
    const [state, setState] = useState<VideoSyncState>(INITIAL_STATE);

    // Load video URL and calibration from backend on mount
    useEffect(() => {
        const loadState = async () => {
            // Load local video time from localStorage (for resume position only)
            const calibrationKey = getCalibrationKey(matchId);
            const savedLocal = localStorage.getItem(calibrationKey);
            let lastVideoTime: number | null = null;
            if (savedLocal) {
                try {
                    const parsed = JSON.parse(savedLocal);
                    lastVideoTime = parsed.lastVideoTime || null;
                } catch {
                    // Invalid JSON, ignore
                }
            }

            // Load match data from backend - includes videoUrl and calibration
            try {
                const response = await fetch(`${API_BASE_URL}/api/matches/${matchId}`);
                if (response.ok) {
                    const matchData = await response.json();

                    // Get calibration from database
                    const dbFirstHalf = matchData.firstHalfVideoStart ?? null;
                    const dbSecondHalf = matchData.secondHalfVideoStart ?? null;

                    if (matchData.videoUrl) {
                        const videoId = extractVideoId(matchData.videoUrl);
                        if (videoId) {
                            setState({
                                ...INITIAL_STATE,
                                videoUrl: matchData.videoUrl,
                                videoId,
                                isVideoLoaded: true,
                                firstHalfStart: dbFirstHalf,
                                secondHalfStart: dbSecondHalf,
                                isCalibrated: dbFirstHalf !== null,
                                currentVideoTime: lastVideoTime || 0,
                            });
                            return;
                        }
                    }

                    // No video but has calibration data
                    if (dbFirstHalf !== null) {
                        setState(prev => ({
                            ...prev,
                            firstHalfStart: dbFirstHalf,
                            secondHalfStart: dbSecondHalf,
                            isCalibrated: true,
                        }));
                    }
                }
            } catch (error) {
                console.error('Error loading match data:', error);
            }
        };

        loadState();
    }, [matchId]);

    // Save calibration to database when it changes
    useEffect(() => {
        if (state.firstHalfStart !== null) {
            // Save to localStorage for video time position
            const calibrationKey = getCalibrationKey(matchId);
            localStorage.setItem(calibrationKey, JSON.stringify({
                lastVideoTime: state.currentVideoTime,
            }));

            // Save calibration to database
            fetch(`${API_BASE_URL}/api/matches/${matchId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstHalfVideoStart: state.firstHalfStart,
                    secondHalfVideoStart: state.secondHalfStart,
                }),
            }).catch(err => console.error('Error saving calibration:', err));
        }
    }, [matchId, state.firstHalfStart, state.secondHalfStart]);

    // Save video time position to localStorage (debounced - not every update)
    useEffect(() => {
        const calibrationKey = getCalibrationKey(matchId);
        const savedLocal = localStorage.getItem(calibrationKey);
        let current: { lastVideoTime?: number } = {};
        if (savedLocal) {
            try { current = JSON.parse(savedLocal); } catch { /* ignore */ }
        }
        current.lastVideoTime = state.currentVideoTime;
        localStorage.setItem(calibrationKey, JSON.stringify(current));
    }, [matchId, state.currentVideoTime]);

    const setVideoUrl = useCallback((url: string) => {
        const videoId = extractVideoId(url);
        if (videoId) {
            setState(prev => ({
                ...prev,
                videoUrl: url,
                videoId,
                isVideoLoaded: true,
            }));
        }
    }, []);

    const clearVideo = useCallback(() => {
        setState(INITIAL_STATE);
        localStorage.removeItem(getCalibrationKey(matchId));
    }, [matchId]);

    const setFirstHalfStart = useCallback((time: number) => {
        setState(prev => ({
            ...prev,
            firstHalfStart: time,
            isCalibrated: true,
        }));
    }, []);

    const setSecondHalfStart = useCallback((time: number) => {
        setState(prev => ({
            ...prev,
            secondHalfStart: time,
        }));
    }, []);

    const updateVideoTime = useCallback((time: number) => {
        setState(prev => ({
            ...prev,
            currentVideoTime: time,
        }));
    }, []);

    const startTimeout = useCallback(() => {
        setState(prev => ({
            ...prev,
            isTimeout: true,
            timeoutVideoStart: prev.currentVideoTime,
        }));
    }, []);

    const endTimeout = useCallback(() => {
        setState(prev => ({
            ...prev,
            isTimeout: false,
            timeoutVideoStart: null,
        }));
    }, []);

    /**
     * Convert video timestamp to match time.
     * Takes into account first/second half starts.
     */
    const getMatchTimeFromVideo = useCallback((videoTime: number): number => {
        if (state.firstHalfStart === null) return 0;

        // If second half has started and we're past it
        if (state.secondHalfStart !== null && videoTime >= state.secondHalfStart) {
            return HALF_DURATION_SECONDS + (videoTime - state.secondHalfStart);
        }

        // First half
        const matchTime = videoTime - state.firstHalfStart;
        return Math.max(0, matchTime);
    }, [state.firstHalfStart, state.secondHalfStart]);

    /**
     * Convert match time to video timestamp.
     * Inverse of getMatchTimeFromVideo.
     * Returns null if not calibrated.
     */
    const getVideoTimeFromMatch = useCallback((matchTime: number): number | null => {
        if (state.firstHalfStart === null) return null;

        // Second half (matchTime >= 30 minutes)
        if (matchTime >= HALF_DURATION_SECONDS && state.secondHalfStart !== null) {
            return state.secondHalfStart + (matchTime - HALF_DURATION_SECONDS);
        }

        // First half
        return state.firstHalfStart + matchTime;
    }, [state.firstHalfStart, state.secondHalfStart]);

    const reset = useCallback(() => {
        setState(INITIAL_STATE);
        localStorage.removeItem(getCalibrationKey(matchId));
    }, [matchId]);

    // Get saved video time for player to seek to
    const savedVideoTime = state.currentVideoTime > 0 ? state.currentVideoTime : null;

    // Ref to store the seek function from YouTubePlayer
    const seekFnRef = useRef<((time: number) => void) | null>(null);

    const registerSeekFunction = useCallback((fn: (time: number) => void) => {
        seekFnRef.current = fn;
    }, []);

    const seekToTime = useCallback((time: number) => {
        if (seekFnRef.current) {
            seekFnRef.current(time);
        }
    }, []);

    const value: VideoSyncContextType = {
        ...state,
        setVideoUrl,
        clearVideo,
        setFirstHalfStart,
        setSecondHalfStart,
        updateVideoTime,
        startTimeout,
        endTimeout,
        getMatchTimeFromVideo,
        getVideoTimeFromMatch,
        reset,
        savedVideoTime,
        seekToTime,
        registerSeekFunction,
    };

    return (
        <VideoSyncContext.Provider value={value}>
            {children}
        </VideoSyncContext.Provider>
    );
};

export const useVideoSync = () => {
    const context = useContext(VideoSyncContext);
    if (context === undefined) {
        throw new Error('useVideoSync must be used within a VideoSyncProvider');
    }
    return context;
};
