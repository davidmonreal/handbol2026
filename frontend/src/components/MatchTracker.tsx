import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBackNavigation } from '../hooks/useBackNavigation';
import { useMatch } from '../context/MatchContext';
import { useSafeTranslation } from '../context/LanguageContext';
import { API_BASE_URL } from '../config/api';
import { Scoreboard } from './match/Scoreboard';
import { EventList } from './match/events/EventList';
import { useMatchClock } from './match/useMatchClock';
import {
  useMatchTrackerCore,
  MatchTrackerLayout,
  EventFormSection,
  type MatchDataOptions,
} from './match/shared';


const MatchTracker = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { t } = useSafeTranslation();

  // Live-mode specific context values
  const {
    toggleTeamLock,
    isTeamLocked,
    realTimeFirstHalfStart,
    realTimeSecondHalfStart,
    realTimeFirstHalfEnd,
    realTimeSecondHalfEnd,
    deleteEvent,
  } = useMatch();

  // Live-mode specific state
  const [timerStopped, setTimerStopped] = useState(false);

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
    handleEditEvent,
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
      realTimeFirstHalfStart: data.realTimeFirstHalfStart as number | null,
      realTimeSecondHalfStart: data.realTimeSecondHalfStart as number | null,
      realTimeFirstHalfEnd: data.realTimeFirstHalfEnd as number | null,
      realTimeSecondHalfEnd: data.realTimeSecondHalfEnd as number | null,
    }),
    getEventTimestamp: () => time,
    onEventSaved: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
    onMatchLoaded: (data) => {
      if (data.isFinished) {
        setTimerStopped(true);
      }
    },
  });

  // Live-mode specific: Stop timer when match ends
  useEffect(() => {
    setTimerStopped(false);
  }, [matchId]);

  useEffect(() => {
    if (realTimeSecondHalfEnd) {
      setTimerStopped(true);
    }
  }, [realTimeSecondHalfEnd]);

  // Live-mode specific: Clock synchronization
  const activeTeamLocked = isTeamLocked(activeTeamId);

  useMatchClock({
    activeTeamLocked,
    timerStopped,
    realTimeFirstHalfStart,
    realTimeFirstHalfEnd,
    realTimeSecondHalfStart,
    realTimeSecondHalfEnd,
    setTime: useMatch().setTime,
  });

  // Live-mode specific: Clock blocking logic
  const missingFirstHalf = !realTimeFirstHalfStart;
  const waitingForSecondHalf = Boolean(realTimeFirstHalfEnd && !realTimeSecondHalfStart);
  const clockBlockKey = missingFirstHalf
    ? 'matchTracker.lockedUntilFirstHalfStart'
    : waitingForSecondHalf
      ? 'matchTracker.lockedUntilSecondHalfStart'
      : null;
  const formLocked = activeTeamLocked || Boolean(clockBlockKey);

  // Navigate handlers
  const handleBack = useBackNavigation({ fallbackPath: '/' });
  const handleStatistics = useCallback(() => {
    navigate(`/statistics?matchId=${matchId}${activeTeamId ? `&activeTeamId=${activeTeamId}` : ''}`);
  }, [navigate, matchId, activeTeamId]);

  // Loading state
  if (!homeTeam || !visitorTeam || !matchLoaded) {
    return <div className="p-8 text-center">{t('matchTracker.loading')}</div>;
  }

  return (
    <MatchTrackerLayout
      homeTeamName={homeTeam.name}
      visitorTeamName={visitorTeam.name}
      matchId={matchId!}
      activeTeamId={activeTeamId}
      backLabel={t('matchTracker.backToDashboard')}
      onBack={handleBack}
      onStatistics={handleStatistics}
    >
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
        hideHalfControls={activeTeamLocked}
        onFinishMatch={async () => {
          try {
            await fetch(`${API_BASE_URL}/api/matches/${matchId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ isFinished: true }),
            });
            setTimerStopped(true);
          } catch (error) {
            console.error('Failed to finish match:', error);
          }
        }}
      />

      <EventFormSection
        editingEvent={editingEvent}
        activeTeam={activeTeam}
        opponentTeam={opponentTeam}
        activeTeamId={activeTeamId}
        eventFormInitialState={eventFormInitialState}
        saveBanner={saveBanner}
        locked={formLocked}
        onSave={handleSaveEvent}
        onSaveMessage={(message, variant) => {
          setSaveBanner({ message, variant });
          if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);
          bannerTimeoutRef.current = setTimeout(() => setSaveBanner(null), 3000);
        }}
        onSaved={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onCancel={handleCancelEdit}
        onDelete={(eventId) => deleteEvent(eventId, true)}
        translationPrefix="matchTracker"
        headerSlot={
          activeTeam && (
            <button
              onClick={() => toggleTeamLock(activeTeam.id, !activeTeamLocked)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${activeTeamLocked
                ? 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 11c1.657 0 3-1.343 3-3V5a3 3 0 10-6 0v3c0 1.657 1.343 3 3 3z M5 11h14v8a2 2 0 01-2 2H7a2 2 0 01-2-2v-8z"
                />
              </svg>
              {activeTeamLocked ? t('matchTracker.unlockEvents') : t('matchTracker.lockEvents')}
            </button>
          )
        }
        lockedBannerSlot={
          (activeTeamLocked || clockBlockKey) && (
            <div className="flex items-center gap-2 text-[11px] font-medium text-gray-600 bg-gray-100 px-3 py-2 rounded-md mb-3">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 11c1.657 0 3-1.343 3-3V5a3 3 0 10-6 0v3c0 1.657 1.343 3 3 3z M5 11h14v8a2 2 0 01-2 2H7a2 2 0 01-2-2v-8z"
                />
              </svg>
              <span>{t(clockBlockKey ?? 'matchTracker.lockedBanner')}</span>
            </div>
          )
        }
      />

      <div className="mt-8">
        <EventList
          initialEventsToShow={10}
          onEditEvent={handleEditEvent}
          filterTeamId={activeTeamId}
        />
      </div>
    </MatchTrackerLayout>
  );
};

export default MatchTracker;
