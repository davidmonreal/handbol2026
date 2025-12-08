import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { MatchEvent, DefenseType, ZoneType, SanctionType } from '../types';
import { API_BASE_URL } from '../config/api';

type ScoreMode = 'live' | 'manual';

interface MatchMeta {
  isFinished?: boolean;
  homeScore?: number;
  awayScore?: number;
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
  setMatchData: (id: string, home: Team, visitor: Team, preserveState?: boolean, matchMeta?: MatchMeta) => void;
  selectedOpponentGoalkeeper: Player | null;
  setSelectedOpponentGoalkeeper: React.Dispatch<React.SetStateAction<Player | null>>;
  realTimeFirstHalfStart: number | null;
  realTimeSecondHalfStart: number | null;
  setRealTimeCalibration: (half: 1 | 2, timestamp: number) => void;
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

  const addEvent = async (event: MatchEvent) => {
    // Add to local state immediately for UI responsiveness
    setEvents(prev => [...prev, event]);

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
            timestamp: event.timestamp,
            playerId: event.playerId,
            teamId: event.teamId,
            type: event.category,
            subtype: event.action,
            position: event.position,
            distance: event.distance,
            isCollective: event.isCollective,
            hasOpposition: event.hasOpposition,
            isCounterAttack: event.isCounterAttack,
            goalZone: event.goalZoneTag,
            sanctionType: event.sanctionType,
            activeGoalkeeperId: selectedOpponentGoalkeeper?.id,
          }),
        });

        if (!response.ok) {
          console.error('Failed to save event to backend');
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

  const setRealTimeCalibration = async (half: 1 | 2, timestamp: number) => {
    if (half === 1) setRealTimeFirstHalfStart(timestamp);
    else setRealTimeSecondHalfStart(timestamp);

    // Persist to backend if possible (could update the Match entity)
    if (matchId) {
      try {
        await fetch(`${API_BASE_URL}/api/matches/${matchId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(half === 1 ? { realTimeFirstHalfStart: timestamp } : { realTimeSecondHalfStart: timestamp })
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

    const hasManualScores = matchMeta?.homeScore !== undefined || matchMeta?.awayScore !== undefined;
    const currentScoreMode: ScoreMode = matchMeta?.isFinished ? 'manual' : 'live';
    setScoreMode(currentScoreMode);

    if (currentScoreMode === 'manual') {
      setHomeScore(matchMeta?.homeScore ?? 0);
      setVisitorScore(matchMeta?.awayScore ?? 0);
    } else {
      setHomeScore(0);
      setVisitorScore(0);
    }

    // Initial load of match-level data (like calibration) should happen here or separately
    try {
      const res = await fetch(`${API_BASE_URL}/api/matches/${id}`);
      if (res.ok) {
        const data = await res.json();
        setRealTimeFirstHalfStart(data.realTimeFirstHalfStart || null);
        setRealTimeSecondHalfStart(data.realTimeSecondHalfStart || null);
      }
    } catch (e) { /* ignore */ }

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

        // Transform backend events to MatchEvent format
        const transformedEvents: MatchEvent[] = backendEvents.map((e) => ({
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
        } else if (!hasManualScores) {
          // Fallback to event totals if we don't have manual scores for a finished match
          setHomeScore(homeGoals);
          setVisitorScore(visitorGoals);
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
      setActiveTeamId(null);
      setDefenseFormation('6-0');
    }
  }, []);

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
      setRealTimeCalibration
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
