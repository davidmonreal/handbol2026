import { useEffect, useRef, useState } from 'react';
import { useVideoSync } from '../../context/VideoSyncContext';

// Declare YouTube IFrame API types
declare global {
    interface Window {
        YT: {
            Player: new (elementId: string, options: YTPlayerOptions) => YTPlayer;
            PlayerState: {
                PLAYING: number;
                PAUSED: number;
                ENDED: number;
                BUFFERING: number;
            };
        };
        onYouTubeIframeAPIReady: () => void;
    }
}

interface YTPlayerOptions {
    videoId: string;
    playerVars?: {
        autoplay?: number;
        controls?: number;
        modestbranding?: number;
        rel?: number;
    };
    events?: {
        onReady?: (event: YTPlayerEvent) => void;
        onStateChange?: (event: YTPlayerStateChangeEvent) => void;
    };
}

interface YTPlayer {
    getCurrentTime: () => number;
    seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
    playVideo: () => void;
    pauseVideo: () => void;
    destroy: () => void;
}

interface YTPlayerEvent {
    target: YTPlayer;
}

interface YTPlayerStateChangeEvent extends YTPlayerEvent {
    data: number;
}

export const YouTubePlayer = () => {
    const { videoId, updateVideoTime, currentVideoTime, savedVideoTime, registerSeekFunction } = useVideoSync();
    const playerRef = useRef<YTPlayer | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isApiLoaded, setIsApiLoaded] = useState(false);
    const timeUpdateInterval = useRef<number | null>(null);

    // Register seek function for external use
    useEffect(() => {
        registerSeekFunction((time: number) => {
            if (playerRef.current) {
                playerRef.current.seekTo(time, true);
            }
        });
    }, [registerSeekFunction]);

    // Load YouTube IFrame API
    useEffect(() => {
        if (window.YT) {
            setIsApiLoaded(true);
            return;
        }

        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        // In test environments there may be no script tag; guard the insertion
        if (firstScriptTag?.parentNode) {
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        } else {
            document.head.appendChild(tag);
        }

        window.onYouTubeIframeAPIReady = () => {
            setIsApiLoaded(true);
        };

        return () => {
            if (timeUpdateInterval.current) {
                clearInterval(timeUpdateInterval.current);
            }
        };
    }, []);

    // Initialize player when API is loaded and we have a videoId
    useEffect(() => {
        if (!isApiLoaded || !videoId) return;

        // Clean up previous player
        if (playerRef.current) {
            playerRef.current.destroy();
        }

        // Create new player
        playerRef.current = new window.YT.Player('youtube-player', {
            videoId,
            playerVars: {
                autoplay: 0,
                controls: 1,
                modestbranding: 1,
                rel: 0,
            },
            events: {
                onReady: () => {
                    // Seek to saved position if available
                    if (savedVideoTime && savedVideoTime > 0 && playerRef.current) {
                        playerRef.current.seekTo(savedVideoTime, true);
                    }
                    // Start time tracking
                    timeUpdateInterval.current = window.setInterval(() => {
                        if (playerRef.current) {
                            const time = playerRef.current.getCurrentTime();
                            updateVideoTime(Math.floor(time));
                        }
                    }, 500);
                },
                onStateChange: () => {
                    // Player state change handler - could track play/pause if needed
                },
            },
        });

        return () => {
            if (timeUpdateInterval.current) {
                clearInterval(timeUpdateInterval.current);
            }
            if (playerRef.current) {
                playerRef.current.destroy();
            }
        };
    }, [isApiLoaded, videoId, updateVideoTime]);

    const formatTime = (seconds: number): string => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!videoId) {
        return null;
    }

    return (
        <div ref={containerRef} className="bg-black rounded-xl overflow-hidden shadow-lg">
            {/* YouTube Player Container */}
            <div className="relative aspect-video">
                <div id="youtube-player" className="absolute inset-0 w-full h-full" />
            </div>

            {/* Video Time Display */}
            <div className="bg-gray-900 px-4 py-2 flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                    <span className="text-sm font-medium">Video Time</span>
                </div>
                <span className="font-mono text-lg">{formatTime(currentVideoTime)}</span>
            </div>
        </div>
    );
};
