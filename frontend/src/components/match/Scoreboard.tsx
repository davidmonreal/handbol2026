import { Plus, Minus } from 'lucide-react';
import { useMatch } from '../../context/MatchContext';

interface MatchTeam {
  id: string;
  name: string;
  category?: string;
  club?: { id?: string; name: string };
  color: string;
}

interface ScoreboardProps {
  homeTeam: MatchTeam;
  visitorTeam: MatchTeam;
  homeScore: number;
  visitorScore: number;
  time: number;
  activeTeamId: string | null;
  onHomeScoreChange: (score: number) => void;
  onVisitorScoreChange: (score: number) => void;
  onTeamSelect: (teamId: string) => void;
  showCalibration?: boolean; // Show calibration buttons (for MatchTracker only)
}

export const Scoreboard = ({
  homeTeam,
  visitorTeam,
  homeScore,
  visitorScore,
  time,
  activeTeamId,
  onHomeScoreChange,
  onVisitorScoreChange,
  onTeamSelect,
  showCalibration = true
}: ScoreboardProps) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get calibration from context
  const { realTimeFirstHalfStart, realTimeSecondHalfStart, setRealTimeCalibration, scoreMode } = useMatch();

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
          {scoreMode !== 'manual' && (
            <div className="flex justify-center gap-2" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => onHomeScoreChange(Math.max(0, homeScore - 1))} className="p-1 rounded bg-gray-100 hover:bg-gray-200"><Minus size={14} /></button>
              <button onClick={() => onHomeScoreChange(homeScore + 1)} className="p-1 rounded bg-blue-100 text-blue-600 hover:bg-blue-200"><Plus size={14} /></button>
            </div>
          )}
        </div>

        {/* Timer & Controls */}
        <div className="flex flex-col items-center px-2 md:px-4 space-y-3">
          <div className="flex flex-col items-center">
            <div className="text-2xl md:text-4xl font-mono font-bold text-gray-900 mb-2">{formatTime(time)}</div>
            {scoreMode === 'manual' && (
              <div className="text-[11px] font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
                Result locked (manual)
              </div>
            )}
          </div>

          {/* Calibration Buttons - Only show in MatchTracker (not VideoMatchTracker) */}
          {showCalibration && (
            <div className="flex gap-2 text-xs">
              <button
                onClick={() => setRealTimeCalibration(1, Date.now())}
                disabled={!!realTimeFirstHalfStart}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${realTimeFirstHalfStart
                  ? 'bg-green-50 text-green-700 cursor-default'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                title={realTimeFirstHalfStart ? `Started at ${new Date(realTimeFirstHalfStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Start 1st Half'}
              >
                {realTimeFirstHalfStart ? '1H Started' : 'Start 1H'}
              </button>
              <button
                onClick={() => setRealTimeCalibration(2, Date.now())}
                disabled={!realTimeFirstHalfStart || !!realTimeSecondHalfStart}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${realTimeSecondHalfStart
                  ? 'bg-green-50 text-green-700 cursor-default'
                  : !realTimeFirstHalfStart
                    ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                title={realTimeSecondHalfStart ? `Started at ${new Date(realTimeSecondHalfStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Start 2nd Half'}
              >
                {realTimeSecondHalfStart ? '2H Started' : 'Start 2H'}
              </button>
            </div>
          )}
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
          {scoreMode !== 'manual' && (
            <div className="flex justify-center gap-2" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => onVisitorScoreChange(Math.max(0, visitorScore - 1))} className="p-1 rounded bg-gray-100 hover:bg-gray-200"><Minus size={14} /></button>
              <button onClick={() => onVisitorScoreChange(visitorScore + 1)} className="p-1 rounded bg-red-100 text-red-600 hover:bg-red-200"><Plus size={14} /></button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
