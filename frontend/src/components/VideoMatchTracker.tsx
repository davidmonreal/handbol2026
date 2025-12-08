import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMatch } from '../context/MatchContext';
import { VideoSyncProvider, useVideoSync } from '../context/VideoSyncContext';
import type { MatchEvent } from '../types';
import { API_BASE_URL } from '../config/api';
import { Scoreboard } from './match/Scoreboard';
import { EventList } from './match/events/EventList';
import { EventForm } from './match/events/EventForm';
import { YouTubePlayer } from './video/YouTubePlayer';
import { VideoUrlInput } from './video/VideoUrlInput';
import { VideoCalibration } from './video/VideoCalibration';

const VideoMatchTrackerContent = () => {
    const { matchId } = useParams<{ matchId: string }>();
    const navigate = useNavigate();

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

    // Use Match Context
    const {
        homeScore, setHomeScore,
        visitorScore, setVisitorScore,
        time, setTime,
        activeTeamId, setActiveTeamId,
        defenseFormation,
        addEvent,
        updateEvent,
        deleteEvent,
        homeTeam, visitorTeam, setMatchData,
        selectedOpponentGoalkeeper, setSelectedOpponentGoalkeeper,
        matchId: contextMatchId
    } = useMatch();

    // Refs for scrolling
    const eventFormRef = useRef<HTMLDivElement>(null);
    const videoPlayerRef = useRef<HTMLDivElement>(null);

    // Ref to track context match ID without triggering effect re-runs
    const contextMatchIdRef = useRef(contextMatchId);
    useEffect(() => {
        contextMatchIdRef.current = contextMatchId;
    }, [contextMatchId]);

    // Sync match time with video time when calibrated
    useEffect(() => {
        if (isCalibrated && isVideoLoaded) {
            const matchTime = getMatchTimeFromVideo(currentVideoTime);
            setTime(matchTime);
        }
    }, [currentVideoTime, isCalibrated, isVideoLoaded, getMatchTimeFromVideo, setTime]);

    // Fetch Match Data
    useEffect(() => {
        if (!matchId) return;

        if (contextMatchIdRef.current === matchId && homeTeam && visitorTeam) {
            return;
        }

        const loadMatchData = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/matches/${matchId}`);
                if (!response.ok) throw new Error('Failed to load match');

                const data = await response.json();

                if (!data.homeTeam || !data.awayTeam) {
                    throw new Error('Invalid match data: Missing team information');
                }

                const transformTeam = (teamData: any, color: string) => ({
                    id: teamData.id,
                    name: teamData.name,
                    category: teamData.category,
                    club: teamData.club,
                    color: color,
                    players: (teamData.players || []).map((p: any) => ({
                        id: p.player.id,
                        number: p.player.number,
                        name: p.player.name,
                        position: p.role || 'Player',
                        isGoalkeeper: p.player.isGoalkeeper
                    }))
                });

                const home = transformTeam(data.homeTeam, 'bg-yellow-400');
                const visitor = transformTeam(data.awayTeam, 'bg-white');

                const shouldPreserveState = contextMatchIdRef.current === data.id;
                setMatchData(data.id, home, visitor, shouldPreserveState, {
                    isFinished: data.isFinished,
                    homeScore: data.homeScore,
                    awayScore: data.awayScore,
                });
            } catch (error) {
                console.error('Error loading match:', error);
            }
        };

        loadMatchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [matchId]);

    // Load goalkeeper from localStorage on mount
    useEffect(() => {
        if (!matchId || !visitorTeam?.players) return;
        // Logic handled by unified effect below or EventForm, but we need to ensure global state is hydrated
        // We defer to active team logic below
    }, [matchId, visitorTeam?.players]);

    // Editing State
    const [editingEvent, setEditingEvent] = useState<MatchEvent | null>(null);

    const handleTeamSelect = (teamId: string) => {
        setActiveTeamId(teamId);
        setEditingEvent(null);
    };

    const handleEditEvent = (event: MatchEvent) => {
        // Switch active team to event's team if different, to ensure correct context
        if (event.teamId !== activeTeamId) {
            setActiveTeamId(event.teamId);
        }
        setEditingEvent(event);
        // Scroll to Event Form instead of top
        if (eventFormRef.current) {
            eventFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const handleSeekToVideo = (time: number) => {
        seekToTime(time);
        // Scroll to Video Player
        if (videoPlayerRef.current) {
            videoPlayerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const getActiveTeam = () => {
        if (activeTeamId === homeTeam?.id) return homeTeam;
        if (activeTeamId === visitorTeam?.id) return visitorTeam;
        return null;
    };

    const getOpponentTeam = () => {
        if (activeTeamId === homeTeam?.id) return visitorTeam;
        if (activeTeamId === visitorTeam?.id) return homeTeam;
        return null;
    };

    const activeTeam = getActiveTeam();
    const opponentTeam = getOpponentTeam();

    const handleSaveEvent = async (event: MatchEvent, opponentGkId?: string) => {
        // 1. Handle Goalkeeper Persistence/Update
        if (opponentGkId && opponentTeam && matchId) { // Check matchId is defined
            const gk = opponentTeam.players.find(p => p.id === opponentGkId);
            if (gk) {
                setSelectedOpponentGoalkeeper(gk);
                // Save specific to match AND active team perspective
                localStorage.setItem(`goalkeeper-${matchId}-${activeTeamId}`, gk.id);
            }
        }

        // 2. Add or Update Event
        if (editingEvent) {
            // Update
            await updateEvent(editingEvent.id, event);
            setEditingEvent(null);
        } else {
            // Create
            const newEvent: MatchEvent = {
                ...event,
                timestamp: time,
                videoTimestamp: isVideoLoaded ? currentVideoTime : undefined,
                defenseFormation,
            };
            addEvent(newEvent);
        }
    };

    const handleCancelEdit = () => {
        setEditingEvent(null);
    };

    // Resume GK from localStorage whenever active/opponent team changes
    useEffect(() => {
        if (!opponentTeam || !matchId || !activeTeamId) return;
        const savedGkId = localStorage.getItem(`goalkeeper-${matchId}-${activeTeamId}`);
        if (savedGkId) {
            const gk = opponentTeam.players.find(p => p.id === savedGkId);
            if (gk) setSelectedOpponentGoalkeeper(gk);
        } else {
            setSelectedOpponentGoalkeeper(null);
        }
    }, [activeTeamId, opponentTeam, matchId, setSelectedOpponentGoalkeeper]);

    if (!homeTeam || !visitorTeam) {
        return <div className="p-8 text-center">Loading match data...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Navigation */}
            <nav className="bg-white shadow-sm border-b border-gray-200 mb-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center text-gray-600 hover:text-indigo-600 font-medium"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Dashboard
                        </button>
                        <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <span className="hidden md:inline">Video Tracker:</span> {homeTeam.name} vs {visitorTeam.name}
                        </h1>
                        <button
                            onClick={() => navigate(`/statistics?matchId=${matchId}${activeTeamId ? `&activeTeamId=${activeTeamId}` : ''}`)}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Statistics
                        </button>
                    </div>
                </div>
            </nav>

            <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
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
                <div className="animate-fade-in" ref={eventFormRef}>
                    {activeTeam ? (
                        <div className="mb-8">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                    {editingEvent ? (
                                        <>
                                            <span className="text-indigo-600">Edit Event</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-green-600">New Event</span>
                                            <span className="text-sm font-normal text-gray-500 ml-2">
                                                (Click an event below to edit)
                                            </span>
                                        </>
                                    )}
                                </h2>
                            </div>

                            <EventForm
                                key={editingEvent ? editingEvent.id : `new-event-${activeTeamId}`}
                                event={editingEvent}
                                team={activeTeam}
                                opponentTeam={opponentTeam || undefined}
                                initialState={{
                                    opponentGoalkeeperId: selectedOpponentGoalkeeper?.id
                                }}
                                onSave={handleSaveEvent}
                                onCancel={handleCancelEdit}
                                onDelete={(eventId) => deleteEvent(eventId, true)}
                            />
                        </div>
                    ) : (
                        <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500 border-2 border-dashed mb-8">
                            Select a team above to start tracking
                        </div>
                    )}
                </div>

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
            </div>
        </div>
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
