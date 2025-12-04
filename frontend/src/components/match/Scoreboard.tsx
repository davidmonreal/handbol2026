import { Play, Pause, RotateCcw, Plus, Minus } from 'lucide-react';
import type { Team } from '../../data/mockData';

interface ScoreboardProps {
  homeTeam: Team;
  visitorTeam: Team;
  homeScore: number;
  visitorScore: number;
  time: number;
  isPlaying: boolean;
  activeTeamId: string | null;
  onHomeScoreChange: (score: number) => void;
  onVisitorScoreChange: (score: number) => void;
  onTogglePlay: () => void;
  onReset: () => void;
  onTeamSelect: (teamId: string) => void;
}

export const Scoreboard = ({
  homeTeam,
  visitorTeam,
  homeScore,
  visitorScore,
  time,
  isPlaying,
  activeTeamId,
  onHomeScoreChange,
  onVisitorScoreChange,
  onTogglePlay,
  onReset,
  onTeamSelect
}: ScoreboardProps) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-2 md:p-3 mb-4">
      <div className="flex justify-between items-center">
        {/* Home Team */}
        <div
          className={`text-center flex-1 p-2 rounded-lg cursor-pointer transition-colors ${activeTeamId === homeTeam.id ? 'bg-blue-50 border-2 border-blue-500' : 'hover:bg-gray-50'}`}
          onClick={() => onTeamSelect(homeTeam.id)}
        >
          <div className="mb-1">
            <h2 className="text-sm md:text-lg font-bold text-gray-800 leading-tight">
              {homeTeam.category && `${homeTeam.category} `}{homeTeam.name}
            </h2>
            {homeTeam.club?.name && (
              <div className="text-xs text-gray-500">{homeTeam.club.name}</div>
            )}
          </div>
          <div className="text-3xl md:text-5xl font-bold text-blue-600 mb-2">{homeScore}</div>
          <div className="flex justify-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => onHomeScoreChange(Math.max(0, homeScore - 1))} className="p-1 rounded bg-gray-100 hover:bg-gray-200"><Minus size={14} /></button>
            <button onClick={() => onHomeScoreChange(homeScore + 1)} className="p-1 rounded bg-blue-100 text-blue-600 hover:bg-blue-200"><Plus size={14} /></button>
          </div>
        </div>

        {/* Timer */}
        <div className="flex flex-col items-center px-2 md:px-4">
          <div className="text-2xl md:text-4xl font-mono font-bold text-gray-900 mb-2">{formatTime(time)}</div>
          <div className="flex gap-2">
            <button onClick={onTogglePlay} className={`p-2 rounded-full ${isPlaying ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button onClick={onReset} className="p-2 rounded-full bg-red-100 text-red-600">
              <RotateCcw size={16} />
            </button>
          </div>
        </div>

        {/* Visitor Team */}
        <div
          className={`text-center flex-1 p-2 rounded-lg cursor-pointer transition-colors ${activeTeamId === visitorTeam.id ? 'bg-red-50 border-2 border-red-500' : 'hover:bg-gray-50'}`}
          onClick={() => onTeamSelect(visitorTeam.id)}
        >
          <div className="mb-1">
            <h2 className="text-sm md:text-lg font-bold text-gray-800 leading-tight">
              {visitorTeam.category && `${visitorTeam.category} `}{visitorTeam.name}
            </h2>
            {visitorTeam.club?.name && (
              <div className="text-xs text-gray-500">{visitorTeam.club.name}</div>
            )}
          </div>
          <div className="text-3xl md:text-5xl font-bold text-red-600 mb-2">{visitorScore}</div>
          <div className="flex justify-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => onVisitorScoreChange(Math.max(0, visitorScore - 1))} className="p-1 rounded bg-gray-100 hover:bg-gray-200"><Minus size={14} /></button>
            <button onClick={() => onVisitorScoreChange(visitorScore + 1)} className="p-1 rounded bg-red-100 text-red-600 hover:bg-red-200"><Plus size={14} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};
