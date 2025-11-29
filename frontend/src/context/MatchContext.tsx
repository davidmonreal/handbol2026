import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { MatchEvent, DefenseType } from '../types';

interface Player {
  id: string;
  number: number;
  name: string;
  position: string;
}

interface Team {
  id: string;
  name: string;
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
  homeTeam: Team | null;
  setHomeTeam: React.Dispatch<React.SetStateAction<Team | null>>;
  visitorTeam: Team | null;
  setVisitorTeam: React.Dispatch<React.SetStateAction<Team | null>>;
  matchId: string | null;
  setMatchId: React.Dispatch<React.SetStateAction<string | null>>;
  setMatchData: (id: string, home: Team, visitor: Team) => void;
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

  const addEvent = (event: MatchEvent) => {
    setEvents(prev => [event, ...prev]);
    
    // Update Score Logic
    if (event.category === 'Shot' && event.action === 'Goal') {
      if (event.teamId === homeTeam?.id) setHomeScore(s => s + 1);
      else if (event.teamId === visitorTeam?.id) setVisitorScore(s => s + 1);
    }
  };

  const setMatchData = useCallback((id: string, home: Team, visitor: Team) => {
    console.log('setMatchData called with:', { id, home, visitor });
    setMatchId(id);
    setHomeTeam(home);
    setVisitorTeam(visitor);
    // Reset game state if needed or load existing events
    setEvents([]); // Assuming events should be reset when new match data is loaded
    setHomeScore(0);
    setVisitorScore(0);
    setTime(0);
    setIsPlaying(false);
    setActiveTeamId(null);
    setDefenseFormation('6-0');
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
      homeTeam, setHomeTeam,
      visitorTeam, setVisitorTeam,
      matchId, setMatchId,
      setMatchData
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
