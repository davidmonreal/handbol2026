import { useState } from 'react';
import { Plus, Minus, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMatch } from '../../context/MatchContext';
import { useSafeTranslation } from '../../context/LanguageContext';
import { formatCategoryLabel } from '../../utils/categoryLabels';

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
  onFinishMatch?: () => void;
  isFinished?: boolean;
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
  showCalibration = true,
  onFinishMatch,
  isFinished = false
}: ScoreboardProps) => {
  const { t } = useSafeTranslation();
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get calibration and match id from context
  const {
    realTimeFirstHalfStart,
    realTimeSecondHalfStart,
    realTimeFirstHalfEnd,
    realTimeSecondHalfEnd,
    setRealTimeCalibration,
    scoreMode,
    matchId
  } = useMatch();
  const [calibrationLoading, setCalibrationLoading] = useState<'first' | 'second' | null>(null);

  const firstHalfDuration = realTimeFirstHalfStart && realTimeFirstHalfEnd
    ? Math.max(0, Math.floor((realTimeFirstHalfEnd - realTimeFirstHalfStart) / 1000))
    : null;
  const secondHalfDuration = realTimeSecondHalfStart && realTimeSecondHalfEnd
    ? Math.max(0, Math.floor((realTimeSecondHalfEnd - realTimeSecondHalfStart) / 1000))
    : null;
  const secondHalfEndClock = secondHalfDuration !== null
    ? secondHalfDuration
    : null;

  const firstHalfButtonLabel = !realTimeFirstHalfStart
    ? t('scoreboard.startFirstHalf')
    : !realTimeFirstHalfEnd
      ? t('scoreboard.finishFirstHalf')
      : t('scoreboard.firstHalfFinished');
  const secondHalfButtonLabel = !realTimeSecondHalfStart
    ? t('scoreboard.startSecondHalf')
    : !realTimeSecondHalfEnd
      ? t('scoreboard.finishSecondHalf')
      : t('scoreboard.secondHalfFinished');

  const firstHalfButtonDisabled = isFinished || !!realTimeFirstHalfEnd || calibrationLoading !== null;
  const secondHalfLocked = !realTimeSecondHalfStart && !realTimeFirstHalfEnd;
  const secondHalfButtonDisabled = isFinished || (!!realTimeSecondHalfEnd) || (secondHalfLocked && !realTimeSecondHalfStart) || calibrationLoading !== null;
  const homeCategoryLabel = formatCategoryLabel(homeTeam.category, t);
  const visitorCategoryLabel = formatCategoryLabel(visitorTeam.category, t);

  const handleFirstHalfAction = async () => {
    if (isFinished) return;
    setCalibrationLoading('first');
    try {
      if (!realTimeFirstHalfStart) {
        await setRealTimeCalibration(1, Date.now());
      } else if (!realTimeFirstHalfEnd) {
        await setRealTimeCalibration(1, Date.now(), 'end');
      }
    } finally {
      setCalibrationLoading(null);
    }
  };

  const handleSecondHalfAction = async () => {
    if (isFinished || secondHalfLocked) return;
    setCalibrationLoading('second');
    try {
      if (!realTimeSecondHalfStart) {
        await setRealTimeCalibration(2, Date.now());
      } else if (!realTimeSecondHalfEnd) {
        await setRealTimeCalibration(2, Date.now(), 'end');
        if (onFinishMatch) {
          await onFinishMatch();
        }
      }
    } finally {
      setCalibrationLoading(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-2 md:p-3 mb-4">
      <div className="flex justify-between items-center">
        {/* Home Team */}
        <div
          className={`text-center flex-1 p-2 rounded-lg cursor-pointer transition-colors ${activeTeamId === homeTeam.id ? 'bg-blue-50 border-2 border-blue-500' : 'hover:bg-gray-50'}`}
          onClick={() => onTeamSelect(homeTeam.id)}
          data-testid="home-team-card"
        >
          <div className="mb-1">
            <h2 className="text-sm md:text-lg font-bold text-gray-800 leading-tight">
              {homeCategoryLabel && `${homeCategoryLabel} `}{homeTeam.name}
            </h2>
            {homeTeam.club?.name && (
              <div className="text-xs text-gray-500">{homeTeam.club.name}</div>
            )}
          </div>
          <div className="text-3xl md:text-5xl font-bold text-blue-600 mb-2" data-testid="home-score">{homeScore}</div>
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
              <div className="text-[11px] font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-md flex items-center gap-2">
                <Lock size={12} />
                <span>{t('scoreboard.scoreLocked')}</span>
                {matchId && (
                  <Link to={`/matches/${matchId}/edit`} className="text-xs text-indigo-600 hover:underline ml-1">
                    {t('scoreboard.editLink')}
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Calibration Buttons - Only show in MatchTracker (not VideoMatchTracker) */}
          {showCalibration && (
            <div className="flex flex-col gap-2 text-xs w-full">
              <div className="flex gap-2">
                <button
                  onClick={handleFirstHalfAction}
                  disabled={firstHalfButtonDisabled}
                  className={`flex-1 px-3 py-1 rounded-md font-medium transition-colors ${realTimeFirstHalfEnd
                    ? 'bg-green-50 text-green-700 cursor-default'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300'
                    }`}
                  title={
                    !realTimeFirstHalfStart
                      ? t('scoreboard.startFirstHalfTooltip')
                      : !realTimeFirstHalfEnd
                        ? t('scoreboard.halfStartedAt', {
                          time: new Date(realTimeFirstHalfStart).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          }),
                        })
                        : firstHalfDuration !== null
                          ? t('scoreboard.halfFinishedAtClock', { clock: formatTime(firstHalfDuration) })
                          : undefined
                  }
                >
                  {firstHalfButtonLabel}
                </button>
                <button
                  onClick={handleSecondHalfAction}
                  disabled={secondHalfButtonDisabled}
                  className={`flex-1 px-3 py-1 rounded-md font-medium transition-colors ${realTimeSecondHalfEnd
                    ? 'bg-green-50 text-green-700 cursor-default'
                    : secondHalfLocked
                      ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300'
                    }`}
                  title={
                    !realTimeSecondHalfStart
                      ? secondHalfLocked
                        ? t('scoreboard.waitFirstHalfEnd')
                        : t('scoreboard.startSecondHalfTooltip')
                      : !realTimeSecondHalfEnd
                        ? t('scoreboard.halfStartedAt', {
                          time: new Date(realTimeSecondHalfStart).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          }),
                        })
                        : secondHalfEndClock !== null
                          ? t('scoreboard.halfFinishedAtClock', { clock: formatTime(secondHalfEndClock) })
                          : undefined
                  }
                >
                  {secondHalfButtonLabel}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Visitor Team */}
        <div
          className={`text-center flex-1 p-2 rounded-lg cursor-pointer transition-colors ${activeTeamId === visitorTeam.id ? 'bg-red-50 border-2 border-red-500' : 'hover:bg-gray-50'}`}
          onClick={() => onTeamSelect(visitorTeam.id)}
          data-testid="visitor-team-card"
        >
          <div className="mb-1">
            <h2 className="text-sm md:text-lg font-bold text-gray-800 leading-tight">
              {visitorCategoryLabel && `${visitorCategoryLabel} `}{visitorTeam.name}
            </h2>
            {visitorTeam.club?.name && (
              <div className="text-xs text-gray-500">{visitorTeam.club.name}</div>
            )}
          </div>
          <div className="text-3xl md:text-5xl font-bold text-red-600 mb-2" data-testid="visitor-score">{visitorScore}</div>
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
