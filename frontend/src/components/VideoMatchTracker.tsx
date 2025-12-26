import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMatch } from '../context/MatchContext';
import { VideoSyncProvider, useVideoSync } from '../context/VideoSyncContext';
import type { MatchEvent } from '../types';
import { API_BASE_URL } from '../config/api';
import { Scoreboard } from './match/Scoreboard';
import { EventList } from './match/events/EventList';
import { YouTubePlayer } from './video/YouTubePlayer';
import { VideoUrlInput } from './video/VideoUrlInput';
import { VideoCalibration } from './video/VideoCalibration';
import { useSafeTranslation } from '../context/LanguageContext';
import {
    useMatchTrackerCore,
    MatchTrackerLayout,
    EventFormSection,
    type MatchDataOptions,
} from './match/shared';


const VideoMatchTrackerContent = () => {
    const { matchId } = useParams<{ matchId: string }>();
    const navigate = useNavigate();
    const { t } = useSafeTranslation();
    const [loadError, setLoadError] = useState<string | null>(null);

    // Video Sync Context
    const {
        isVideoLoaded,
        currentVideoTime,
        getMatchTimeFromVideo,
        getVideoTimeFromMatch,
        isCalibrated,
        secondHalfStart,
        seekToTime,
    } = useVideoSync();

    // Refs for scrolling
    const eventFormRef = useRef<HTMLDivElement>(null);
    const videoPlayerRef = useRef<HTMLDivElement>(null);

    // Video-mode specific: deleteEvent from context
    const { deleteEvent, setTime } = useMatch();

    // Shared core logic
    const {
        matchLoaded,
        editingEvent,
        saveBanner,
        activeTeam,
        opponentTeam,
        eventFormInitialState,
        homeTeam,
        visitorTeam,
        homeScore,
        visitorScore,
        time,
        activeTeamId,
        handleTeamSelect,
        handleEditEvent: baseHandleEditEvent,
        handleCancelEdit,
        handleSaveEvent,
        setSaveBanner,
        setHomeScore,
        setVisitorScore,
        bannerTimeoutRef,
    } = useMatchTrackerCore({
        matchId,
        getMatchDataOptions: (data): MatchDataOptions => ({
            isFinished: data.isFinished as boolean,
            homeScore: data.homeScore as number,
            awayScore: data.awayScore as number,
            homeEventsLocked: data.homeEventsLocked as boolean,
            awayEventsLocked: data.awayEventsLocked as boolean,
            firstHalfVideoStart: (data.firstHalfVideoStart as number) ?? null,
            secondHalfVideoStart: (data.secondHalfVideoStart as number) ?? null,
            realTimeFirstHalfStart: data.realTimeFirstHalfStart as number | null,
            realTimeSecondHalfStart: data.realTimeSecondHalfStart as number | null,
            realTimeFirstHalfEnd: data.realTimeFirstHalfEnd as number | null,
            realTimeSecondHalfEnd: data.realTimeSecondHalfEnd as number | null,
        }),
        getEventTimestamp: () => time,
        getVideoTimestamp: () => (isVideoLoaded ? currentVideoTime : undefined),
        onEventSaved: () => {
            if (videoPlayerRef.current) {
                videoPlayerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        },
        onLoadError: (error) => {
            setLoadError(error.message);
        },
    });

    // Video-mode specific: Sync match time with video time
    useEffect(() => {
        if (isCalibrated && isVideoLoaded) {
            const matchTime = getMatchTimeFromVideo(currentVideoTime);
            setTime(matchTime);
        }
    }, [currentVideoTime, isCalibrated, isVideoLoaded, getMatchTimeFromVideo, setTime]);

    // Video-mode specific: Extended edit handler with scroll
    const handleEditEvent = useCallback(
        (event: MatchEvent) => {
            baseHandleEditEvent(event);
            if (eventFormRef.current) {
                eventFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        },
        [baseHandleEditEvent]
    );

    // Video-mode specific: Seek to video timestamp
    const handleSeekToVideo = useCallback(
        (videoTime: number) => {
            seekToTime(videoTime);
            if (videoPlayerRef.current) {
                videoPlayerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        },
        [seekToTime]
    );

    // Navigate handlers
    const handleBack = useCallback(() => navigate('/'), [navigate]);
    const handleStatistics = useCallback(() => {
        navigate(`/statistics?matchId=${matchId}${activeTeamId ? `&activeTeamId=${activeTeamId}` : ''}`);
    }, [navigate, matchId, activeTeamId]);

    // Error state
    if (loadError) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="max-w-lg w-full bg-white border border-red-200 rounded-xl shadow-sm p-6 space-y-3">
                    <div className="text-red-600 font-semibold text-lg">
                        {t('dashboard.errorLoadMatches')}
                    </div>
                    <p className="text-gray-700">{loadError}</p>
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => navigate('/matches')}
                            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200"
                        >
                            {t('matchTracker.backToDashboard')}
                        </button>
                        <button
                            onClick={() => {
                                setLoadError(null);
                                window.location.reload();
                            }}
                            className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                        >
                            {t('common.retry')}
                        </button>
                    </div>
                    <p className="text-xs text-gray-500">API: {API_BASE_URL}</p>
                </div>
            </div>
        );
    }

    // Loading state
    if (!homeTeam || !visitorTeam || !matchLoaded) {
        return <div className="p-8 text-center">Loading match data...</div>;
    }

    return (
        <MatchTrackerLayout
            homeTeamName={homeTeam.name}
            visitorTeamName={visitorTeam.name}
            matchId={matchId!}
            activeTeamId={activeTeamId}
            backLabel={t('video.back')}
            onBack={handleBack}
            onStatistics={handleStatistics}
            showVideoPrefix={true}
        >
            {/* 1. SCOREBOARD */}
            <Scoreboard
                homeTeam={homeTeam}
                visitorTeam={visitorTeam}
                homeScore={homeScore}
                visitorScore={visitorScore}
                time={time}
                activeTeamId={activeTeamId}
                onHomeScoreChange={setHomeScore}
                onVisitorScoreChange={setVisitorScore}
                onTeamSelect={handleTeamSelect}
                showCalibration={false}
            />

            {/* 2. VIDEO SECTION */}
            {!isVideoLoaded ? (
                <VideoUrlInput matchId={matchId!} />
            ) : (
                <div className="space-y-4" ref={videoPlayerRef}>
                    <YouTubePlayer />
                    <VideoCalibration />
                </div>
            )}

            {/* 3. EVENT FORM */}
            <EventFormSection
                editingEvent={editingEvent}
                activeTeam={activeTeam}
                opponentTeam={opponentTeam}
                activeTeamId={activeTeamId}
                eventFormInitialState={eventFormInitialState}
                saveBanner={saveBanner}
                onSave={handleSaveEvent}
                onSaveMessage={(message, variant) => {
                    setSaveBanner({ message, variant });
                    if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);
                    bannerTimeoutRef.current = setTimeout(() => setSaveBanner(null), 3000);
                }}
                onSaved={() => {
                    if (videoPlayerRef.current) {
                        videoPlayerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }}
                onCancel={handleCancelEdit}
                onDelete={(eventId) => deleteEvent(eventId, true)}
                translationPrefix="video"
                formRef={eventFormRef as React.RefObject<HTMLDivElement>}
            />

            {/* 4. RECENT EVENTS */}
            <EventList
                initialEventsToShow={10}
                onEditEvent={handleEditEvent}
                onSeekToVideo={handleSeekToVideo}
                isVideoLoaded={isVideoLoaded}
                getVideoTimeFromMatch={getVideoTimeFromMatch}
                filterTeamId={activeTeamId}
                secondHalfStart={secondHalfStart}
            />
        </MatchTrackerLayout>
    );
};

// Wrap with VideoSyncProvider
const VideoMatchTracker = () => {
    const { matchId } = useParams<{ matchId: string }>();

    if (!matchId) {
        return <div className="p-8 text-center">Match ID is required</div>;
    }

    return (
        <VideoSyncProvider matchId={matchId}>
            <VideoMatchTrackerContent />
        </VideoSyncProvider>
    );
};

export default VideoMatchTracker;
