import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { MatchEvent, DefenseType } from '../types';
import { HOME_TEAM, VISITOR_TEAM } from '../data/mockData';

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

  const addEvent = (event: MatchEvent) => {
    setEvents(prev => [event, ...prev]);
    
    // Update Score Logic
    if (event.category === 'Shot' && event.action === 'Goal') {
      if (event.teamId === HOME_TEAM.id) setHomeScore(s => s + 1);
      else setVisitorScore(s => s + 1);
    }
  };

  return (
    <MatchContext.Provider value={{
      homeScore, setHomeScore,
      visitorScore, setVisitorScore,
      isPlaying, setIsPlaying,
      time, setTime,
      events, setEvents,
      activeTeamId, setActiveTeamId,
      defenseFormation, setDefenseFormation,
      addEvent
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
