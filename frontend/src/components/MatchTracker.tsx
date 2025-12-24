import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMatch } from '../context/MatchContext';
import { useSafeTranslation } from '../context/LanguageContext';
import type { MatchEvent } from '../types';
import type { TeamApiResponse, TeamPlayerApiResponse } from '../types/api.types';
import { API_BASE_URL } from '../config/api';
import { DEFAULT_FIELD_POSITION, PLAYER_POSITION_ABBR } from '../constants/playerPositions';
import type { PlayerPositionId } from '../constants/playerPositions';
import { Scoreboard } from './match/Scoreboard';
import { EventList } from './match/events/EventList';
import { EventForm } from './match/events/EventForm';
import { useMatchClock } from './match/useMatchClock';


const MatchTracker = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { t } = useSafeTranslation();

  // Use Context
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
    matchId: contextMatchId,
    toggleTeamLock,
    isTeamLocked,
    realTimeFirstHalfStart,
    realTimeSecondHalfStart,
    realTimeFirstHalfEnd,
    realTimeSecondHalfEnd
  } = useMatch();
  const [matchLoaded, setMatchLoaded] = useState(false);
  const [timerStopped, setTimerStopped] = useState(false);
  const [saveBanner, setSaveBanner] = useState<{ message: string; variant?: 'success' | 'error' } | null>(null);
  const bannerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ref to track context match ID without triggering effect re-runs
  const contextMatchIdRef = useRef(contextMatchId);
  useEffect(() => {
    contextMatchIdRef.current = contextMatchId;
  }, [contextMatchId]);

  // Fetch Match Data
  useEffect(() => {
    if (!matchId) return;

    if (contextMatchIdRef.current === matchId && homeTeam && visitorTeam) {
      setMatchLoaded(true);
      return;
    }

    const loadMatchData = async () => {
      try {
        setMatchLoaded(false);
        const response = await fetch(`${API_BASE_URL}/api/matches/${matchId}`);
        if (!response.ok) throw new Error('Failed to load match');

        const data = await response.json();

    const GOALKEEPER_POSITION_ID = 1;
    const transformTeam = (teamData: TeamApiResponse, color: string) => ({
      id: teamData.id,
      name: teamData.name,
      category: teamData.category,
      club: teamData.club
        ? { id: teamData.club.id ?? '', name: teamData.club.name }
        : undefined,
      color: color,
      players: (teamData.players || []).map((p: TeamPlayerApiResponse) => {
        const positionId = typeof p.position === 'number' ? p.position : DEFAULT_FIELD_POSITION;
        const positionLabel =
          PLAYER_POSITION_ABBR[positionId as PlayerPositionId] ??
          PLAYER_POSITION_ABBR[DEFAULT_FIELD_POSITION];
        return {
          id: p.player.id,
          number: p.player.number,
          name: p.player.name,
          position: positionLabel,
          isGoalkeeper: positionId === GOALKEEPER_POSITION_ID,
        };
      })
    });

        const home = transformTeam(data.homeTeam, 'bg-yellow-400');
        const visitor = transformTeam(data.awayTeam, 'bg-white');

        const shouldPreserveState = contextMatchIdRef.current === data.id;
        await setMatchData(data.id, home, visitor, shouldPreserveState, {
          isFinished: data.isFinished,
          homeScore: data.homeScore,
          awayScore: data.awayScore,
          homeEventsLocked: data.homeEventsLocked,
          awayEventsLocked: data.awayEventsLocked,
          realTimeFirstHalfStart: data.realTimeFirstHalfStart,
          realTimeSecondHalfStart: data.realTimeSecondHalfStart,
          realTimeFirstHalfEnd: data.realTimeFirstHalfEnd,
          realTimeSecondHalfEnd: data.realTimeSecondHalfEnd,
        });
        if (data.isFinished) {
          setTimerStopped(true);
        }
        setMatchLoaded(true);
      } catch (error) {
        console.error('Error loading match:', error);
        setMatchLoaded(true);
      }
    };

    loadMatchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  useEffect(() => {
    return () => {
      if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);
    };
  }, []);

  // Editing State
  const [editingEvent, setEditingEvent] = useState<MatchEvent | null>(null);

  const handleTeamSelect = (teamId: string) => {
    setActiveTeamId(teamId);
    setEditingEvent(null);
  };

  const handleEditEvent = (event: MatchEvent) => {
    // Switch active team to event's team to ensure context
    if (event.teamId !== activeTeamId) {
      setActiveTeamId(event.teamId);
    }
    setEditingEvent(event);
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

  // Ensure we have an active team selected once teams are loaded
  useEffect(() => {
    if (!activeTeamId && homeTeam) {
      setActiveTeamId(homeTeam.id);
    }
  }, [activeTeamId, homeTeam, setActiveTeamId]);

  useEffect(() => {
    // Reset stop flag when switching matches
    setTimerStopped(false);
  }, [matchId]);

  useEffect(() => {
    if (realTimeSecondHalfEnd) {
      setTimerStopped(true);
    }
  }, [realTimeSecondHalfEnd]);

  // Keep the visible clock in sync with real time when halves are calibrated
  const activeTeam = getActiveTeam();
  const opponentTeam = getOpponentTeam();
  const activeTeamLocked = isTeamLocked(activeTeamId);

  useMatchClock({
    activeTeamLocked,
    timerStopped,
    realTimeFirstHalfStart,
    realTimeFirstHalfEnd,
    realTimeSecondHalfStart,
    realTimeSecondHalfEnd,
    setTime,
  });


  /* 
    NOTE: MATCH TRACKER CONTEXT
    This tracker strictly follows OFFENSIVE plays. 
    - events tracked for 'activeTeam' are attacks.
    - if an event is 'Foul' or 'Sanction', it means the activeTeam SUFFERED the foul.
    - Defensive stats (fouls committed) are derived from the opponent's offensive log.
  */
  const handleSaveEvent = async (event: MatchEvent, opponentGkId?: string) => {
    // 1. Handle Goalkeeper Persistence/Update
    // ONLY update global persistence if we are creating a NEW event.
    // When editing, we respect the event's specific GK but don't change the default for future events.
    if (!editingEvent && opponentGkId && opponentTeam && matchId) {
      const gk = opponentTeam.players.find(p => p.id === opponentGkId);
      if (gk) {
        setSelectedOpponentGoalkeeper(gk);
        localStorage.setItem(`goalkeeper-${matchId}-${activeTeamId}`, gk.id);
      }
    }

    // 2. Add or Update Event
    if (editingEvent) {
      await updateEvent(editingEvent.id, {
        ...event,
        opponentGoalkeeperId: opponentGkId // Ensure we pass the updated GK ID
      });
      setEditingEvent(null);
    } else {
      const newEvent: MatchEvent = {
        ...event,
        timestamp: time,
        defenseFormation,
        opponentGoalkeeperId: opponentGkId // Pass explicit GK ID
      };
      addEvent(newEvent);
    }
  };

  const handleCancelEdit = () => {
    setEditingEvent(null);
  };

  // Load GK from storage
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

  // Memoize initialState to prevent EventForm from resetting local state on every timer tick
  const eventFormInitialState = useMemo(() => ({
    opponentGoalkeeperId: selectedOpponentGoalkeeper?.id,
    playerId: undefined as string | undefined,
  }), [selectedOpponentGoalkeeper?.id]);

  const missingFirstHalf = !realTimeFirstHalfStart;
  const waitingForSecondHalf = Boolean(realTimeFirstHalfEnd && !realTimeSecondHalfStart);
  const clockBlockKey = missingFirstHalf
    ? 'matchTracker.lockedUntilFirstHalfStart'
    : waitingForSecondHalf
      ? 'matchTracker.lockedUntilSecondHalfStart'
      : null;
  const formLocked = activeTeamLocked || Boolean(clockBlockKey);

  if (!homeTeam || !visitorTeam || !matchLoaded) {
    return <div className="p-8 text-center">{t('matchTracker.loading')}</div>;
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
              {t('matchTracker.backToDashboard')}
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              {homeTeam.name} vs {visitorTeam.name}
            </h1>
            <button
              onClick={() => navigate(`/statistics?matchId=${matchId}${activeTeamId ? `&activeTeamId=${activeTeamId}` : ''}`)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              {t('matchTracker.statistics')}
            </button>
          </div>
        </div>
      </nav>

      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
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
        isFinished={timerStopped || !!realTimeSecondHalfEnd}
        // Hide half controls only when the currently selected team is locked; if the other team is unlocked,
        // switching to it should re-enable the clock so its plays can be tracked.
        hideHalfControls={activeTeamLocked}
        onFinishMatch={async () => {
          try {
            await fetch(`${API_BASE_URL}/api/matches/${matchId}`, {
              method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isFinished: true })
              });
              setTimerStopped(true);
            } catch (error) {
              console.error('Failed to finish match:', error);
            }
          }}
        />

        {/* Event Form (Creation/Editing) */}
        <div className="animate-fade-in">
          {activeTeam ? (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  {editingEvent ? (
                    <>
                      <span className="text-indigo-600">{t('matchTracker.editEvent')}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-green-600">
                        {activeTeam
                          ? t('matchTracker.newEventFor', { team: activeTeam.name })
                          : t('matchTracker.newEvent')}
                      </span>
                      <span className="text-sm font-normal text-gray-500 ml-2">
                        {t('matchTracker.clickHint')}
                      </span>
                    </>
                  )}
                </h2>
                {saveBanner && (
                  <div
                    className={`flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-lg border ${
                      saveBanner.variant === 'error'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : 'bg-green-50 text-green-700 border-green-200'
                    }`}
                    role="status"
                    aria-live="polite"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={
                          saveBanner.variant === 'error'
                            ? 'M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                            : 'M5 13l4 4L19 7'
                        }
                      />
                    </svg>
                    {saveBanner.message}
                  </div>
                )}
                {activeTeam && (
                  <button
                    onClick={() => toggleTeamLock(activeTeam.id, !activeTeamLocked)}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${activeTeamLocked
                      ? 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={activeTeamLocked ? 'M12 11c1.657 0 3-1.343 3-3V5a3 3 0 10-6 0v3c0 1.657 1.343 3 3 3z M5 11h14v8a2 2 0 01-2 2H7a2 2 0 01-2-2v-8z' : 'M12 11c1.657 0 3-1.343 3-3V5a3 3 0 10-6 0v3c0 1.657 1.343 3 3 3z M5 11h14v8a2 2 0 01-2 2H7a2 2 0 01-2-2v-8z'} />
                    </svg>
                    {activeTeamLocked ? t('matchTracker.unlockEvents') : t('matchTracker.lockEvents')}
                  </button>
                )}
              </div>
              {(activeTeamLocked || clockBlockKey) && (
                <div className="flex items-center gap-2 text-[11px] font-medium text-gray-600 bg-gray-100 px-3 py-2 rounded-md mb-3">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c1.657 0 3-1.343 3-3V5a3 3 0 10-6 0v3c0 1.657 1.343 3 3 3z M5 11h14v8a2 2 0 01-2 2H7a2 2 0 01-2-2v-8z" />
                  </svg>
                  <span>{t(clockBlockKey ?? 'matchTracker.lockedBanner')}</span>
                </div>
              )}

              <EventForm
                key={editingEvent
                  ? editingEvent.id
                  : `new-event-${activeTeamId}-${eventFormInitialState.playerId ?? 'none'}-${eventFormInitialState.opponentGoalkeeperId ?? 'none'}`}
                event={editingEvent}
                team={activeTeam}
                opponentTeam={opponentTeam || undefined}
                initialState={eventFormInitialState}
                onSave={handleSaveEvent}
                onSaveMessage={(message, variant) => {
                  setSaveBanner({ message, variant });
                  if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);
                  bannerTimeoutRef.current = setTimeout(() => setSaveBanner(null), 3000);
                }}
                onSaved={() => {
                  // Scroll to top for quick consecutive entries in manual tracker.
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onCancel={handleCancelEdit}
                onDelete={(eventId) => deleteEvent(eventId, true)}
                locked={formLocked}
              />
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500 border-2 border-dashed mb-8">
              {t('matchTracker.selectTeamPrompt')}
            </div>
          )}
        </div>

        <div className="mt-8">
          <EventList
            initialEventsToShow={10}
            onEditEvent={handleEditEvent}
            filterTeamId={activeTeamId}
          />
        </div>
      </div>
    </div>
  );
};

export default MatchTracker;
