import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMatch } from '../context/MatchContext';
import { VideoSyncProvider, useVideoSync } from '../context/VideoSyncContext';
import type { FlowType, ZoneType, MatchEvent } from '../types';
import { API_BASE_URL } from '../config/api';
import { createEventFromRecording } from '../utils/eventTransformers';
import { useEventRecording } from '../hooks/useEventRecording';
import { Scoreboard } from './match/Scoreboard';
import { PlayerSelector } from './match/PlayerSelector';
import { FlowSelector } from './match/FlowSelector';
import { ShotFlow } from './match/flows/ShotFlow';
import { SanctionFlow } from './match/flows/SanctionFlow';
import { TurnoverFlow } from './match/flows/TurnoverFlow';
import { EventList } from './match/events/EventList';
import { EventEditResult } from './match/events/EventEditResult';
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
        seekToTime,
    } = useVideoSync();

    // Use Match Context
    const {
        homeScore, setHomeScore,
        visitorScore, setVisitorScore,
        isPlaying, setIsPlaying,
        time, setTime,
        setEvents,
        activeTeamId, setActiveTeamId,
        defenseFormation,
        addEvent,
        updateEvent,
        deleteEvent,
        homeTeam, visitorTeam, setMatchData,
        selectedOpponentGoalkeeper, setSelectedOpponentGoalkeeper,
        matchId: contextMatchId
    } = useMatch();

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
                setMatchData(data.id, home, visitor, shouldPreserveState);
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
        const savedGkId = localStorage.getItem(`goalkeeper-${matchId}`);
        if (savedGkId) {
            const gk = visitorTeam.players.find(p => p.id === savedGkId);
            if (gk) {
                setSelectedOpponentGoalkeeper(gk);
            }
        }
    }, [matchId, visitorTeam?.players, setSelectedOpponentGoalkeeper]);

    // Save goalkeeper to localStorage when changed
    useEffect(() => {
        if (!matchId || !selectedOpponentGoalkeeper) return;
        localStorage.setItem(`goalkeeper-${matchId}`, selectedOpponentGoalkeeper.id);
    }, [matchId, selectedOpponentGoalkeeper]);

    // Local Selection State (Transient)
    const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

    // Editing State
    const [editingEvent, setEditingEvent] = useState<MatchEvent | null>(null);

    // Flow State - Use custom hook for cleaner state management
    const {
        flowType,
        selectedAction,
        selectedZone,
        isCollective,
        hasOpposition,
        isCounterAttack,
        setFlowType,
        setSelectedAction,
        setSelectedZone,
        toggleCollective,
        toggleOpposition,
        toggleCounterAttack,
        resetPlayState,
    } = useEventRecording();

    const handleTeamSelect = (teamId: string) => {
        setActiveTeamId(teamId);
        setSelectedPlayerId(null);
        setEditingEvent(null);
        resetPlayState();
    };

    const handleFlowSelect = (type: FlowType) => {
        setFlowType(type);
    };

    const handleEditEvent = (event: MatchEvent) => {
        setEditingEvent(event);
        setSelectedPlayerId(null);
        resetPlayState();
    };

    const handleSaveEdit = async (updatedEvent: MatchEvent) => {
        if (!editingEvent) return;
        await updateEvent(editingEvent.id, updatedEvent);
        setEditingEvent(null);
    };

    const handleCancelEdit = () => {
        setEditingEvent(null);
    };

    const handleFinalizeEvent = (targetIndex?: number, zoneOverride?: ZoneType) => {
        if (!activeTeamId || !selectedPlayerId || !flowType || !selectedAction) return;

        const finalZone = zoneOverride || selectedZone || null;

        // Use utility function for creating event from recording state
        const newEvent = createEventFromRecording({
            teamId: activeTeamId,
            playerId: selectedPlayerId,
            flowType,
            selectedAction,
            selectedZone: finalZone,
            isCollective,
            hasOpposition,
            isCounterAttack,
            matchTime: time,
            videoTime: isVideoLoaded ? currentVideoTime : undefined,
            defenseFormation,
            targetIndex,
        });

        addEvent(newEvent);

        setSelectedPlayerId(null);
        resetPlayState();
    };

    const getActiveTeam = () => {
        if (activeTeamId === homeTeam?.id) return homeTeam;
        if (activeTeamId === visitorTeam?.id) return visitorTeam;
        return null;
    };

    const activeTeam = getActiveTeam();

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
                            <svg className="w-5 h-5 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                            </svg>
                            Video Tracker: {homeTeam.name} vs {visitorTeam.name}
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
                {/* 1. SCOREBOARD - Always at top */}
                <Scoreboard
                    homeTeam={homeTeam}
                    visitorTeam={visitorTeam}
                    homeScore={homeScore}
                    visitorScore={visitorScore}
                    time={time}
                    isPlaying={isPlaying}
                    activeTeamId={activeTeamId}
                    onHomeScoreChange={setHomeScore}
                    onVisitorScoreChange={setVisitorScore}
                    onTogglePlay={() => setIsPlaying(!isPlaying)}
                    onReset={() => {
                        setIsPlaying(false);
                        setTime(0);
                        setHomeScore(0);
                        setVisitorScore(0);
                        setActiveTeamId(null);
                        setEvents([]);
                    }}
                    onTeamSelect={handleTeamSelect}
                />

                {/* 2. VIDEO SECTION - URL Input OR Video Player + Calibration */}
                {!isVideoLoaded ? (
                    <VideoUrlInput matchId={matchId!} />
                ) : (
                    <div className="space-y-4">
                        {/* Video Player - Full width */}
                        <YouTubePlayer />
                        {/* Calibration Controls - Below video */}
                        <VideoCalibration />
                    </div>
                )}

                {/* 3. TRACKING TOOLS - Player Selection + Flow Recording */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column: Player Selection & Opponent GK */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Player Selection */}
                        {activeTeam ? (
                            <PlayerSelector
                                team={activeTeam}
                                selectedPlayerId={selectedPlayerId}
                                onPlayerSelect={(playerId) => {
                                    setSelectedPlayerId(playerId);
                                    resetPlayState();
                                    setEditingEvent(null);
                                }}
                            />
                        ) : (
                            <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500 border-2 border-dashed">
                                Select a team to view players
                            </div>
                        )}

                        {/* Opponent Goalkeepers Selection */}
                        {activeTeam && (
                            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">
                                    Opponent Goalkeeper
                                </h3>
                                <div className="space-y-2">
                                    {(() => {
                                        const opponentTeam = activeTeam.id === homeTeam?.id ? visitorTeam : homeTeam;
                                        const goalkeepers = opponentTeam?.players.filter(p => p.isGoalkeeper) || [];

                                        if (goalkeepers.length === 0) {
                                            return <div className="text-sm text-gray-400 italic">No goalkeepers found</div>;
                                        }

                                        return goalkeepers.map(gk => (
                                            <button
                                                key={gk.id}
                                                onClick={() => setSelectedOpponentGoalkeeper(gk)}
                                                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${selectedOpponentGoalkeeper?.id === gk.id
                                                    ? 'bg-orange-50 border-orange-500 ring-1 ring-orange-500'
                                                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${selectedOpponentGoalkeeper?.id === gk.id
                                                        ? 'bg-orange-500 text-white'
                                                        : 'bg-gray-200 text-gray-600'
                                                        }`}>
                                                        {gk.number}
                                                    </span>
                                                    <span className={`font-medium ${selectedOpponentGoalkeeper?.id === gk.id ? 'text-orange-900' : 'text-gray-700'
                                                        }`}>
                                                        {gk.name}
                                                    </span>
                                                </div>
                                                {selectedOpponentGoalkeeper?.id === gk.id && (
                                                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                                )}
                                            </button>
                                        ));
                                    })()}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Recording Interface OR Editing Interface */}
                    <div className="lg:col-span-8">
                        {editingEvent ? (
                            <div className="bg-white rounded-xl shadow-sm p-6 border border-indigo-100">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Edit Event
                                    </h2>
                                    <button
                                        onClick={handleCancelEdit}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                <EventEditResult
                                    event={editingEvent}
                                    team={editingEvent.teamId === homeTeam.id ? homeTeam : visitorTeam}
                                    onSave={handleSaveEdit}
                                    onCancel={handleCancelEdit}
                                    onDelete={(eventId) => deleteEvent(eventId, true)}
                                />
                            </div>
                        ) : selectedPlayerId ? (
                            <div className="space-y-6">

                                {/* 1. Flow Selection */}
                                <FlowSelector
                                    flowType={flowType}
                                    onFlowSelect={handleFlowSelect}
                                    onEditFlow={() => { setFlowType(null); resetPlayState(); }}
                                />

                                {/* 2. SHOT FLOW */}
                                {flowType === 'Shot' && (
                                    <ShotFlow
                                        selectedZone={selectedZone}
                                        selectedAction={selectedAction}
                                        isCollective={isCollective}
                                        hasOpposition={hasOpposition}
                                        isCounterAttack={isCounterAttack}
                                        onZoneSelect={setSelectedZone}
                                        onActionSelect={setSelectedAction}
                                        onToggleCollective={toggleCollective}
                                        onToggleOpposition={toggleOpposition}
                                        onToggleCounter={toggleCounterAttack}
                                        onEditZone={() => { setSelectedZone(null); setSelectedAction(null); }}
                                        onEditResult={() => setSelectedAction(null)}
                                        onFinalizeEvent={handleFinalizeEvent}
                                    />
                                )}

                                {/* 2. SANCTION FLOW */}
                                {flowType === 'Sanction' && (
                                    <SanctionFlow
                                        selectedAction={selectedAction}
                                        onActionSelect={setSelectedAction}
                                        onZoneSelect={setSelectedZone}
                                        onEditSeverity={() => { setSelectedAction(null); setSelectedZone(null); }}
                                        onFinalizeEvent={handleFinalizeEvent}
                                    />
                                )}

                                {/* 3. TURNOVER FLOW */}
                                {flowType === 'Turnover' && (
                                    <TurnoverFlow
                                        selectedAction={selectedAction}
                                        onActionSelect={setSelectedAction}
                                        onZoneSelect={setSelectedZone}
                                        onFinalizeEvent={handleFinalizeEvent}
                                    />
                                )}

                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed p-12">
                                Select a player to record stats
                            </div>
                        )}
                    </div>
                </div>

                {/* 4. RECENT EVENTS */}
                <EventList
                    initialEventsToShow={5}
                    onEditEvent={handleEditEvent}
                    onSeekToVideo={seekToTime}
                    isVideoLoaded={isVideoLoaded}
                    getVideoTimeFromMatch={getVideoTimeFromMatch}
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
