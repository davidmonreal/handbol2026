import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { MatchEvent, DefenseType, ZoneType, SanctionType } from '../types';
import { goalZoneToTarget } from '../utils/eventTransformers';
import { API_BASE_URL } from '../config/api';

type ScoreMode = 'live' | 'manual';

interface MatchMeta {
  isFinished?: boolean;
  homeScore?: number;
  awayScore?: number;
  homeEventsLocked?: boolean;
  awayEventsLocked?: boolean;
  // Video calibration markers (YouTube tracking).
  firstHalfVideoStart?: number | null;
  secondHalfVideoStart?: number | null;
  // Live match markers (in-person tracking).
  realTimeFirstHalfStart?: number | null;
  realTimeSecondHalfStart?: number | null;
  realTimeFirstHalfEnd?: number | null;
  realTimeSecondHalfEnd?: number | null;
}

interface Player {
  id: string;
  number: number;
  name: string;
  position: string;
  isGoalkeeper?: boolean;
}

interface Team {
  id: string;
  name: string;
  category?: string;
  club?: { name: string };
  color: string;
  players: Player[];
}

interface MatchContextType {
  homeScore: number;
  setHomeScore: React.Dispatch<React.SetStateAction<number>>;
  visitorScore: number;
  setVisitorScore: React.Dispatch<React.SetStateAction<number>>;
  scoreMode: ScoreMode;
  isPlaying: boolean;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  time: number;
  setTime: React.Dispatch<React.SetStateAction<number>>;
  events: MatchEvent[];
  setEvents: React.Dispatch<React.SetStateAction<MatchEvent[]>>;
  activeTeamId: string | null;
  setActiveTeamId: React.Dispatch<React.SetStateAction<string | null>>;
  defenseFormation: DefenseType;
  setDefenseFormation: React.Dispatch<React.SetStateAction<DefenseType>>;
  addEvent: (event: MatchEvent) => void;
  updateEvent: (eventId: string, updates: Partial<MatchEvent>, skipConfirmation?: boolean) => Promise<boolean>;
  deleteEvent: (eventId: string, skipConfirmation?: boolean) => Promise<boolean>;
  homeTeam: Team | null;
  setHomeTeam: React.Dispatch<React.SetStateAction<Team | null>>;
  visitorTeam: Team | null;
  setVisitorTeam: React.Dispatch<React.SetStateAction<Team | null>>;
  matchId: string | null;
  setMatchId: React.Dispatch<React.SetStateAction<string | null>>;
  setMatchData: (id: string, home: Team, visitor: Team, preserveState?: boolean, matchMeta?: MatchMeta) => Promise<void>;
  toggleTeamLock: (teamId: string, locked: boolean) => Promise<void>;
  isTeamLocked: (teamId: string | null) => boolean;
  selectedOpponentGoalkeeper: Player | null;
  setSelectedOpponentGoalkeeper: React.Dispatch<React.SetStateAction<Player | null>>;
  realTimeFirstHalfStart: number | null;
  realTimeSecondHalfStart: number | null;
  realTimeFirstHalfEnd: number | null;
  realTimeSecondHalfEnd: number | null;
  firstHalfVideoStart: number | null;
  secondHalfVideoStart: number | null;
  setRealTimeCalibration: (half: 1 | 2, timestamp: number, boundary?: 'start' | 'end') => Promise<void>;
  // Keep video calibration in MatchContext so event gating matches live mode.
  setVideoCalibration: (half: 1 | 2, timestamp: number) => void;
}

const MatchContext = createContext<MatchContextType | undefined>(undefined);
export const MatchProvider = ({ children }: { children: ReactNode }) => {
  const [homeScore, setHomeScore] = useState(0);
  const [visitorScore, setVisitorScore] = useState(0);
  const [scoreMode, setScoreMode] = useState<ScoreMode>('live');
  const [isPlaying, setIsPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [defenseFormation, setDefenseFormation] = useState<DefenseType>('6-0');
  const [homeTeam, setHomeTeam] = useState<Team | null>(null);
  const [visitorTeam, setVisitorTeam] = useState<Team | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [selectedOpponentGoalkeeper, setSelectedOpponentGoalkeeper] = useState<Player | null>(null);
  const [homeEventsLocked, setHomeEventsLocked] = useState(false);
  const [awayEventsLocked, setAwayEventsLocked] = useState(false);
  const addEvent = async (event: MatchEvent) => {
    // Allow event creation after either live kickoff or video calibration.
    if (!realTimeFirstHalfStart && !firstHalfVideoStart) {
      console.warn('Cannot add events before starting the first half.');
      return;
    }
    if (realTimeFirstHalfEnd && !realTimeSecondHalfStart) {
      console.warn('Cannot add events until the second half is started.');
      return;
    }

    // Ensure timestamp defaults to current clock if caller didn't set it
    const timestamp = event.timestamp ?? time;
    const eventWithTimestamp = { ...event, timestamp };

    // Prevent adding if team locked
    if ((event.teamId === homeTeam?.id && homeEventsLocked) || (event.teamId === visitorTeam?.id && awayEventsLocked)) {
      console.warn('Events locked for this team');
      return;
    }

    // Add to local state immediately for UI responsiveness
    setEvents(prev => [...prev, eventWithTimestamp]);

    // Update Score Logic
    if (scoreMode === 'live' && event.category === 'Shot' && event.action === 'Goal') {
      if (event.teamId === homeTeam?.id) setHomeScore(s => s + 1);
      else if (event.teamId === visitorTeam?.id) setVisitorScore(s => s + 1);
    }

    // Persist to backend if we have a matchId
    if (matchId) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/game-events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            matchId,
            timestamp: eventWithTimestamp.timestamp,
            // Persist the video timestamp so we can seek back after refresh.
            videoTimestamp: eventWithTimestamp.videoTimestamp,
            playerId: eventWithTimestamp.playerId,
            teamId: eventWithTimestamp.teamId,
            type: eventWithTimestamp.category,
            subtype: eventWithTimestamp.action,
            position: eventWithTimestamp.position,
            distance: eventWithTimestamp.distance,
            isCollective: eventWithTimestamp.isCollective,
            hasOpposition: eventWithTimestamp.hasOpposition,
            isCounterAttack: eventWithTimestamp.isCounterAttack,
            goalZone: eventWithTimestamp.goalZoneTag,
            sanctionType: eventWithTimestamp.sanctionType,
            activeGoalkeeperId: eventWithTimestamp.opponentGoalkeeperId ?? selectedOpponentGoalkeeper?.id,
          }),
        });

        if (!response.ok) {
          console.error('Failed to save event to backend');
        } else {
          try {
            const createdEvent = await response.json();
            const createdId = createdEvent?.id;
            if (createdId && createdId !== eventWithTimestamp.id) {
              setEvents(prev =>
                prev.map(existing =>
                  existing.id === eventWithTimestamp.id
                    ? { ...existing, id: createdId }
                    : existing
                )
              );
            }
          } catch {
            // Ignore JSON parse errors when backend returns no body.
          }
        }
      } catch (error) {
        console.error('Error saving event:', error);
      }
    }
  };

  const updateEvent = async (eventId: string, updates: Partial<MatchEvent>, skipConfirmation = false): Promise<boolean> => {
    const currentEvent = events.find(e => e.id === eventId);
    if (!currentEvent) {
      console.error('Event not found:', eventId);
      return false;
    }

    // Check if the update affects the score
    const oldIsGoal = currentEvent.category === 'Shot' && currentEvent.action === 'Goal';
    const newIsGoal = (updates.category === 'Shot' || currentEvent.category === 'Shot') &&
      (updates.action === 'Goal' || (updates.action === undefined && currentEvent.action === 'Goal'));

    const affectsScore = oldIsGoal !== newIsGoal;

    // If affects score and confirmation not skipped, return false to signal caller to confirm
    if (affectsScore && !skipConfirmation) {
      return false; // Caller should show confirmation and call again with skipConfirmation=true
    }

    // Create updated events array
    const updatedEvents = events.map(e =>
      e.id === eventId ? { ...e, ...updates } : e
    );

    // Update state
    setEvents(updatedEvents);

    // Recalculate scores if needed - using the updated events array directly
    if (affectsScore && scoreMode === 'live') {
      const homeGoals = updatedEvents.filter(e =>
        e.category === 'Shot' && e.action === 'Goal' && e.teamId === homeTeam?.id
      ).length;
      const visitorGoals = updatedEvents.filter(e =>
        e.category === 'Shot' && e.action === 'Goal' && e.teamId === visitorTeam?.id
      ).length;

      setHomeScore(homeGoals);
      setVisitorScore(visitorGoals);
    }

    // Persist to backend if we have a matchId
    if (matchId) {
      try {
        const updatedEvent = { ...currentEvent, ...updates };

        const response = await fetch(`${API_BASE_URL}/api/game-events/${eventId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            timestamp: updatedEvent.timestamp,
            playerId: updatedEvent.playerId,
            teamId: updatedEvent.teamId,
            type: updatedEvent.category,
            subtype: updatedEvent.action,
            position: updatedEvent.position,
            distance: updatedEvent.distance,
            isCollective: updatedEvent.isCollective,
            hasOpposition: updatedEvent.hasOpposition,
            isCounterAttack: updatedEvent.isCounterAttack,
            goalZone: updatedEvent.goalZoneTag,
            sanctionType: updatedEvent.sanctionType,
            activeGoalkeeperId: updatedEvent.opponentGoalkeeperId,
          }),
        });

        if (!response.ok) {
          console.error('Failed to update event in backend');
          const errorText = await response.text();
          console.error('Error response:', errorText);
        } else {
          console.log('Event updated successfully in backend');
          // No need to update events again - we already did it above with the updated events array
        }
      } catch (error) {
        console.error('Error updating event:', error);
      }
    }

    return true; // Success
  };

  const deleteEvent = async (eventId: string, skipConfirmation = false): Promise<boolean> => {
    const currentEvent = events.find(e => e.id === eventId);
    if (!currentEvent) return false;

    // Check if the event is a goal
    const isGoal = currentEvent.category === 'Shot' && currentEvent.action === 'Goal';

    // If affects score and confirmation not skipped, return false to signal caller to confirm
    if (isGoal && !skipConfirmation) {
      return false; // Caller should show confirmation and call again with skipConfirmation=true
    }

    // Create filtered events array
    const updatedEvents = events.filter(e => e.id !== eventId);

    // Delete locally
    setEvents(updatedEvents);

    // Recalculate scores if needed - using the updated events array directly
    if (isGoal && scoreMode === 'live') {
      const homeGoals = updatedEvents.filter(e =>
        e.category === 'Shot' && e.action === 'Goal' && e.teamId === homeTeam?.id
      ).length;
      const visitorGoals = updatedEvents.filter(e =>
        e.category === 'Shot' && e.action === 'Goal' && e.teamId === visitorTeam?.id
      ).length;

      setHomeScore(homeGoals);
      setVisitorScore(visitorGoals);
    }

    // Delete from backend if we have a matchId
    if (matchId) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/game-events/${eventId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          console.error('Failed to delete event from backend');
        }
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }

    return true; // Success
  };

  const [realTimeFirstHalfStart, setRealTimeFirstHalfStart] = useState<number | null>(null);
  const [realTimeSecondHalfStart, setRealTimeSecondHalfStart] = useState<number | null>(null);
  const [realTimeFirstHalfEnd, setRealTimeFirstHalfEnd] = useState<number | null>(null);
  const [realTimeSecondHalfEnd, setRealTimeSecondHalfEnd] = useState<number | null>(null);
  const [firstHalfVideoStart, setFirstHalfVideoStart] = useState<number | null>(null);
  const [secondHalfVideoStart, setSecondHalfVideoStart] = useState<number | null>(null);

  // Store video calibration so match-time gating stays consistent with live mode.
  const setVideoCalibration = useCallback((half: 1 | 2, timestamp: number) => {
    if (half === 1) {
      setFirstHalfVideoStart(timestamp);
      setSecondHalfVideoStart(null);
    } else {
      setSecondHalfVideoStart(timestamp);
    }

    if (!matchId) return;

    const payload =
      half === 1
        ? { firstHalfVideoStart: timestamp, secondHalfVideoStart: null }
        : { secondHalfVideoStart: timestamp };

    void Promise.resolve(
      fetch(`${API_BASE_URL}/api/matches/${matchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    ).catch((error) => {
      console.error('Failed to save video calibration', error);
    });
  }, [matchId]);

  // Live mode calibration uses wall-clock time to drive the match timer.
  const setRealTimeCalibration = async (half: 1 | 2, timestamp: number, boundary: 'start' | 'end' = 'start') => {
    if (half === 1) {
      if (boundary === 'start') {
        setRealTimeFirstHalfStart(timestamp);
        setRealTimeFirstHalfEnd(null);
        setRealTimeSecondHalfStart(null);
        setRealTimeSecondHalfEnd(null);
        setTime(0); // Reset timer to the start of the match
      } else {
        setRealTimeFirstHalfEnd(timestamp);
        if (realTimeFirstHalfStart) {
          setTime(Math.max(0, Math.floor((timestamp - realTimeFirstHalfStart) / 1000)));
        }
      }
    } else {
      if (boundary === 'start') {
        setRealTimeSecondHalfStart(timestamp);
        if (realTimeFirstHalfStart) {
          const firstPhaseDuration = realTimeFirstHalfEnd
            ? Math.max(0, Math.floor((realTimeFirstHalfEnd - realTimeFirstHalfStart) / 1000))
            : Math.max(0, Math.floor((timestamp - realTimeFirstHalfStart) / 1000));
          setTime(firstPhaseDuration);
        } else {
          setTime(0);
        }
      } else {
        setRealTimeSecondHalfEnd(timestamp);
        if (realTimeSecondHalfStart && realTimeFirstHalfStart) {
          const firstPhaseDuration = realTimeFirstHalfEnd
            ? Math.max(0, Math.floor((realTimeFirstHalfEnd - realTimeFirstHalfStart) / 1000))
            : Math.max(0, Math.floor((realTimeSecondHalfStart - realTimeFirstHalfStart) / 1000));
          const elapsedSecond = Math.max(0, Math.floor((timestamp - realTimeSecondHalfStart) / 1000));
          setTime(firstPhaseDuration + elapsedSecond);
        }
      }
    }

    // Persist to backend if possible (could update the Match entity)
    if (matchId) {
      try {
        await fetch(`${API_BASE_URL}/api/matches/${matchId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            half === 1
              ? boundary === 'start'
                ? { realTimeFirstHalfStart: timestamp }
                : { realTimeFirstHalfEnd: timestamp }
              : boundary === 'start'
                ? { realTimeSecondHalfStart: timestamp }
                : { realTimeSecondHalfEnd: timestamp }
          )
        });
      } catch (error) {
        console.error('Failed to save calibration', error);
      }
    }
  };

  const setMatchData = useCallback(async (id: string, home: Team, visitor: Team, preserveState = false, matchMeta?: MatchMeta) => {
    setMatchId(id);
    setHomeTeam(home);
    setVisitorTeam(visitor);
    if (!preserveState && !activeTeamId) {
      // Default to home team when loading a new match so the UI is immediately usable
      setActiveTeamId(home.id);
    }

    // We'll enrich matchMeta with data fetched from the backend if it wasn't provided.
    // This keeps live (realTime*) and video (first/secondHalfVideoStart) aligned.
    let fetchedMeta: MatchMeta | undefined;

    // Avoid an extra round-trip if caller already provided matchMeta (e.g., fetched in the page)
    if (!matchMeta) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/matches/${id}`);
        if (res.ok) {
          const data = await res.json();
          setRealTimeFirstHalfStart(data.realTimeFirstHalfStart || null);
          setRealTimeSecondHalfStart(data.realTimeSecondHalfStart || null);
          setFirstHalfVideoStart(data.firstHalfVideoStart ?? null);
          setSecondHalfVideoStart(data.secondHalfVideoStart ?? null);
          fetchedMeta = {
            isFinished: data.isFinished,
            homeScore: data.homeScore,
            awayScore: data.awayScore,
            homeEventsLocked: data.homeEventsLocked,
            awayEventsLocked: data.awayEventsLocked,
            firstHalfVideoStart: data.firstHalfVideoStart ?? null,
            secondHalfVideoStart: data.secondHalfVideoStart ?? null,
            realTimeFirstHalfStart: data.realTimeFirstHalfStart,
            realTimeSecondHalfStart: data.realTimeSecondHalfStart,
            realTimeFirstHalfEnd: data.realTimeFirstHalfEnd,
            realTimeSecondHalfEnd: data.realTimeSecondHalfEnd,
            // if backend exposes status in the future we can add it here
          };
        }
      } catch (e) { /* ignore */ }
    }

    const effectiveMeta = matchMeta ?? fetchedMeta;
    const hasManualScores = effectiveMeta?.homeScore !== undefined || effectiveMeta?.awayScore !== undefined;
    // Only use manual mode if match is finished AND has explicit scores set
    const currentScoreMode: ScoreMode = effectiveMeta?.isFinished && hasManualScores ? 'manual' : 'live';
    setScoreMode(currentScoreMode);

    if (currentScoreMode === 'manual') {
      setHomeScore(effectiveMeta?.homeScore ?? 0);
      setVisitorScore(effectiveMeta?.awayScore ?? 0);
    } else {
      setHomeScore(0);
      setVisitorScore(0);
    }

    setHomeEventsLocked(!!effectiveMeta?.homeEventsLocked);
    setAwayEventsLocked(!!effectiveMeta?.awayEventsLocked);

    // Set calibration data if provided
    if (effectiveMeta?.realTimeFirstHalfStart !== undefined) {
      setRealTimeFirstHalfStart(effectiveMeta.realTimeFirstHalfStart);
    }
    if (effectiveMeta?.realTimeSecondHalfStart !== undefined) {
      setRealTimeSecondHalfStart(effectiveMeta.realTimeSecondHalfStart);
    }
    if (effectiveMeta?.realTimeFirstHalfEnd !== undefined) {
      setRealTimeFirstHalfEnd(effectiveMeta.realTimeFirstHalfEnd);
    }
    if (effectiveMeta?.realTimeSecondHalfEnd !== undefined) {
      setRealTimeSecondHalfEnd(effectiveMeta.realTimeSecondHalfEnd);
    }
    if (effectiveMeta?.firstHalfVideoStart !== undefined) {
      setFirstHalfVideoStart(effectiveMeta.firstHalfVideoStart);
    }
    if (effectiveMeta?.secondHalfVideoStart !== undefined) {
      setSecondHalfVideoStart(effectiveMeta.secondHalfVideoStart);
    }

    // Load existing events from backend
    try {
      const response = await fetch(`${API_BASE_URL}/api/game-events/match/${id}`);
      if (response.ok) {
        interface BackendEvent {
          id: string;
          timestamp: number;
          playerId: string;
          teamId: string;
          type: string;
          subtype: string;
          position?: string;
          distance?: string;
          isCollective?: boolean;
          hasOpposition?: boolean;
          isCounterAttack?: boolean;
          goalZone?: string;
          sanctionType?: string;
          player?: {
            name: string;
            number: number;
          };
        }
        const backendEvents: BackendEvent[] = await response.json();

        // Defensive: ensure we have an array before mapping
        const safeEvents = Array.isArray(backendEvents) ? backendEvents : [];

        // Transform backend events to MatchEvent format
        const transformedEvents: MatchEvent[] = safeEvents.map((e) => ({
          id: e.id,
          timestamp: e.timestamp,
          playerId: e.playerId,
          playerName: e.player?.name || 'Unknown',
          playerNumber: e.player?.number || 0,
          teamId: e.teamId,
          category: e.type,
          action: e.subtype || e.type,  // This is the problem! If subtype is empty, it uses type
          position: e.position,
          distance: e.distance,
          isCollective: e.isCollective || false,
          hasOpposition: e.hasOpposition || false,
          isCounterAttack: e.isCounterAttack || false,
          zone: (e.distance === '7M' ? '7m' :
            (e.distance && e.position) ? `${e.distance === '6M' ? '6m' : '9m'}-${e.position}` as ZoneType : undefined
          ),
          goalZoneTag: e.goalZone, // Explicitly map goalZone to goalZoneTag
          goalTarget: goalZoneToTarget(e.goalZone || null),
          sanctionType: e.sanctionType as SanctionType | undefined,
        }));

        setEvents(transformedEvents);

        // Calculate scores from events
        const homeGoals = transformedEvents.filter(e =>
          e.category === 'Shot' && e.action === 'Goal' && e.teamId === home.id
        ).length;
        const visitorGoals = transformedEvents.filter(e =>
          e.category === 'Shot' && e.action === 'Goal' && e.teamId === visitor.id
        ).length;

        if (currentScoreMode === 'live') {
          setHomeScore(homeGoals);
          setVisitorScore(visitorGoals);
        } else if (currentScoreMode === 'manual') {
          // Keep the manual scores that were already set - don't recalculate from events
          // Manual scores are the source of truth for finished matches
        }
      } else {
        // No events yet, start fresh
        setEvents([]);
        if (currentScoreMode === 'live') {
          setHomeScore(0);
          setVisitorScore(0);
        }
      }
    } catch (error) {
      console.error('Error loading events:', error);
      setEvents([]);
      if (currentScoreMode === 'live') {
        setHomeScore(0);
        setVisitorScore(0);
      }
    }

    setTime(0);
    setIsPlaying(false);

    // Only reset these if not preserving state
    if (!preserveState) {
      setDefenseFormation('6-0');
    }
  }, []);

  const toggleTeamLock = useCallback(async (teamId: string, locked: boolean) => {
    if (!matchId) return;
    const isHome = teamId === homeTeam?.id;
    const isAway = teamId === visitorTeam?.id;
    const payload: Record<string, unknown> = {};
    if (isHome) payload.homeEventsLocked = locked;
    if (isAway) payload.awayEventsLocked = locked;

    try {
      const res = await fetch(`${API_BASE_URL}/api/matches/${matchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        console.error('Failed to update lock state on backend', res.statusText);
        return;
      }

      // Trust backend as source of truth in case another flag changed concurrently
      const updatedMatch = await res.json();
      if (typeof updatedMatch.homeEventsLocked === 'boolean') {
        setHomeEventsLocked(updatedMatch.homeEventsLocked);
      } else if (isHome) {
        setHomeEventsLocked(locked);
      }
      if (typeof updatedMatch.awayEventsLocked === 'boolean') {
        setAwayEventsLocked(updatedMatch.awayEventsLocked);
      } else if (isAway) {
        setAwayEventsLocked(locked);
      }
    } catch (error) {
      console.error('Failed to update lock state', error);
    }
  }, [matchId, homeTeam?.id, visitorTeam?.id]);

  const isTeamLocked = useCallback((teamId: string | null) => {
    if (!teamId) return false;
    if (teamId === homeTeam?.id) return homeEventsLocked;
    if (teamId === visitorTeam?.id) return awayEventsLocked;
    return false;
  }, [homeTeam?.id, visitorTeam?.id, homeEventsLocked, awayEventsLocked]);

  return (
    <MatchContext.Provider value={{
      homeScore, setHomeScore,
      visitorScore, setVisitorScore,
      scoreMode,
      isPlaying, setIsPlaying,
      time, setTime,
      events, setEvents,
      activeTeamId, setActiveTeamId,
      defenseFormation, setDefenseFormation,
      addEvent,
      updateEvent,
      deleteEvent,
      homeTeam, setHomeTeam,
      visitorTeam, setVisitorTeam,
      matchId, setMatchId,
      setMatchData,
      selectedOpponentGoalkeeper, setSelectedOpponentGoalkeeper,
      realTimeFirstHalfStart,
      realTimeSecondHalfStart,
      realTimeFirstHalfEnd,
      realTimeSecondHalfEnd,
      firstHalfVideoStart,
      secondHalfVideoStart,
      setRealTimeCalibration,
      setVideoCalibration,
      toggleTeamLock,
      isTeamLocked
    }}>
      {children}
    </MatchContext.Provider>
  );
};

export const useMatch = () => {
  const context = useContext(MatchContext);
  if (context === undefined) {
    throw new Error('useMatch must be used within a MatchProvider');
  }
  return context;
};
