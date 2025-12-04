import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { MatchEvent, DefenseType, ZoneType, SanctionType } from '../types';
import { API_BASE_URL } from '../config/api';

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
  updateEvent: (eventId: string, updates: Partial<MatchEvent>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  homeTeam: Team | null;
  setHomeTeam: React.Dispatch<React.SetStateAction<Team | null>>;
  visitorTeam: Team | null;
  setVisitorTeam: React.Dispatch<React.SetStateAction<Team | null>>;
  matchId: string | null;
  setMatchId: React.Dispatch<React.SetStateAction<string | null>>;
  setMatchData: (id: string, home: Team, visitor: Team, preserveState?: boolean) => void;
  selectedOpponentGoalkeeper: Player | null;
  setSelectedOpponentGoalkeeper: React.Dispatch<React.SetStateAction<Player | null>>;
}

const MatchContext = createContext<MatchContextType | undefined>(undefined);

export const MatchProvider = ({ children }: { children: ReactNode }) => {
  const [homeScore, setHomeScore] = useState(0);
  const [visitorScore, setVisitorScore] = useState(0);
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
    if (event.category === 'Shot' && event.action === 'Goal') {
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

  const updateEvent = async (eventId: string, updates: Partial<MatchEvent>) => {
    const currentEvent = events.find(e => e.id === eventId);
    if (!currentEvent) {
      console.error('Event not found:', eventId);
      return;
    }

    // Check if the update affects the score
    const oldIsGoal = currentEvent.category === 'Shot' && currentEvent.action === 'Goal';
    const newIsGoal = (updates.category === 'Shot' || currentEvent.category === 'Shot') &&
      (updates.action === 'Goal' || (updates.action === undefined && currentEvent.action === 'Goal'));

    const affectsScore = oldIsGoal !== newIsGoal;

    if (affectsScore) {
      const confirmed = window.confirm(
        'This change will affect the score. Are you sure you want to continue?'
      );
      if (!confirmed) {
        console.log('User cancelled score change');
        return;
      }
    }

    // Create updated events array
    const updatedEvents = events.map(e =>
      e.id === eventId ? { ...e, ...updates } : e
    );

    // Update state
    setEvents(updatedEvents);

    // Recalculate scores if needed - using the updated events array directly
    if (affectsScore) {
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
  };

  const deleteEvent = async (eventId: string) => {
    const currentEvent = events.find(e => e.id === eventId);
    if (!currentEvent) return;

    // Check if the event is a goal
    const isGoal = currentEvent.category === 'Shot' && currentEvent.action === 'Goal';

    if (isGoal) {
      const confirmed = window.confirm(
        'Deleting this goal will affect the score. Are you sure you want to continue?'
      );
      if (!confirmed) return;
    }

    // Create filtered events array
    const updatedEvents = events.filter(e => e.id !== eventId);

    // Delete locally
    setEvents(updatedEvents);

    // Recalculate scores if needed - using the updated events array directly
    if (isGoal) {
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
  };

  const setMatchData = useCallback(async (id: string, home: Team, visitor: Team, preserveState = false) => {

    setMatchId(id);
    setHomeTeam(home);
    setVisitorTeam(visitor);

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
          zone: e.goalZone as ZoneType | undefined,
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

        setHomeScore(homeGoals);
        setVisitorScore(visitorGoals);
      } else {
        // No events yet, start fresh
        setEvents([]);
        setHomeScore(0);
        setVisitorScore(0);
      }
    } catch (error) {
      console.error('Error loading events:', error);
      setEvents([]);
      setHomeScore(0);
      setVisitorScore(0);
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
      selectedOpponentGoalkeeper, setSelectedOpponentGoalkeeper
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
