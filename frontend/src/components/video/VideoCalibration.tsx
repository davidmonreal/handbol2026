import { useState } from 'react';
import { useVideoSync } from '../../context/VideoSyncContext';
import { useMatch } from '../../context/MatchContext';

export const VideoCalibration = () => {
    const {
        currentVideoTime,
        firstHalfStart,
        secondHalfStart,
        isCalibrated,
        setFirstHalfStart,
        setSecondHalfStart,
    } = useVideoSync();
    const { setVideoCalibration } = useMatch();

    const [isExpanded, setIsExpanded] = useState(false);

    const formatTime = (seconds: number): string => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };


    // When calibrated, show only a compact bar unless expanded
    if (isCalibrated && !isExpanded) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-600">Calibrated</span>
                    </div>
                </div>

                {/* Edit button */}
                <button
                    onClick={() => setIsExpanded(true)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Edit calibration"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </button>
            </div>
        );
    }

    // Full calibration UI (when not calibrated or when expanded)
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Time Calibration
                </h3>
                {isCalibrated && (
                    <button
                        onClick={() => setIsExpanded(false)}
                        className="text-gray-400 hover:text-gray-600 p-1"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Calibration Buttons - Horizontal layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* First Half Start */}
                <button
                    onClick={() => {
                        setFirstHalfStart(currentVideoTime);
                        setVideoCalibration(1, currentVideoTime);
                    }}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${firstHalfStart !== null
                            ? 'bg-green-50 border-green-500 text-green-800'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700'
                        }`}
                >
                    <span className="font-medium text-sm">1st Half Start</span>
                    {firstHalfStart !== null ? (
                        <span className="font-mono text-sm bg-green-200 px-2 py-0.5 rounded">
                            {formatTime(firstHalfStart)}
                        </span>
                    ) : (
                        <span className="text-xs text-gray-400">Click to set</span>
                    )}
                </button>

                {/* Second Half Start */}
                <button
                    onClick={() => {
                        setSecondHalfStart(currentVideoTime);
                        setVideoCalibration(2, currentVideoTime);
                    }}
                    disabled={firstHalfStart === null}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${secondHalfStart !== null
                            ? 'bg-green-50 border-green-500 text-green-800'
                            : firstHalfStart === null
                                ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700'
                        }`}
                >
                    <span className="font-medium text-sm">2nd Half Start</span>
                    {secondHalfStart !== null ? (
                        <span className="font-mono text-sm bg-green-200 px-2 py-0.5 rounded">
                            {formatTime(secondHalfStart)}
                        </span>
                    ) : (
                        <span className="text-xs text-gray-400">
                            {firstHalfStart === null ? 'Set 1st first' : 'Click to set'}
                        </span>
                    )}
                </button>
            </div>
            {/* Help Text - Only when not calibrated */}
            {!isCalibrated && (
                <div className="p-2 bg-blue-50 rounded-lg text-xs text-blue-700">
                    Play video to the first whistle, then click "1st Half Start"
                </div>
            )}
        </div>
    );
};
