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
  // Hide half controls when the currently selected team has events locked; switching to an unlocked
  // team should show them again so their plays can still be tracked.
  hideHalfControls?: boolean;
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
  isFinished = false,
  hideHalfControls = false,
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
    firstHalfVideoStart,
    secondHalfVideoStart,
    setRealTimeCalibration,
    scoreMode,
    matchId
  } = useMatch();
  const [calibrationLoading, setCalibrationLoading] = useState<'first' | 'second' | null>(null);

  // When the active team is locked we hide controls. When it's unlocked, ignore previous half markers
  // so the user can re-start halves for the unlocked side even if the other team already finished theirs.
  const effectiveFirstHalfStart = hideHalfControls ? realTimeFirstHalfStart : null;
  const effectiveFirstHalfEnd = hideHalfControls ? realTimeFirstHalfEnd : null;
  const effectiveSecondHalfStart = hideHalfControls ? realTimeSecondHalfStart : null;
  const effectiveSecondHalfEnd = hideHalfControls ? realTimeSecondHalfEnd : null;

  const firstHalfDuration = effectiveFirstHalfStart && effectiveFirstHalfEnd
    ? Math.max(0, Math.floor((effectiveFirstHalfEnd - effectiveFirstHalfStart) / 1000))
    : null;
  const liveFirstPhaseDuration = effectiveFirstHalfStart
    ? effectiveFirstHalfEnd
      ? Math.max(0, Math.floor((effectiveFirstHalfEnd - effectiveFirstHalfStart) / 1000))
      : effectiveSecondHalfStart
        ? Math.max(0, Math.floor((effectiveSecondHalfStart - effectiveFirstHalfStart) / 1000))
        : null
    : null;
  const videoFirstPhaseDuration = firstHalfVideoStart !== null && secondHalfVideoStart !== null
    ? Math.max(0, secondHalfVideoStart - firstHalfVideoStart)
    : null;
  const halfOffset = liveFirstPhaseDuration ?? videoFirstPhaseDuration;
  const isSecondHalfConfigured = !!effectiveSecondHalfStart || secondHalfVideoStart !== null;
  // Guard: if we calibrated la 2a part però seguim dins el minutatge de la 1a, no restem l’offset;
  // així evitem quedar a 00:00 quan el vídeo encara és dins la primera part.
  const isSecondHalfActive = isSecondHalfConfigured && halfOffset !== null && time >= halfOffset;
  const displayTime = isSecondHalfActive && halfOffset !== null
    ? Math.max(0, time - halfOffset)
    : time;
  const secondHalfDuration = effectiveSecondHalfStart && effectiveSecondHalfEnd
    ? Math.max(0, Math.floor((effectiveSecondHalfEnd - effectiveSecondHalfStart) / 1000))
    : null;
  const secondHalfEndClock = secondHalfDuration !== null
    ? secondHalfDuration
    : null;

  const firstHalfButtonLabel = !effectiveFirstHalfStart
    ? t('scoreboard.startFirstHalf')
    : !effectiveFirstHalfEnd
      ? t('scoreboard.finishFirstHalf')
      : t('scoreboard.firstHalfFinished');
  const secondHalfButtonLabel = !effectiveSecondHalfStart
    ? t('scoreboard.startSecondHalf')
    : !effectiveSecondHalfEnd
      ? t('scoreboard.finishSecondHalf')
      : t('scoreboard.secondHalfFinished');

  const firstHalfButtonDisabled = hideHalfControls || isFinished || !!effectiveFirstHalfEnd || calibrationLoading !== null;
  const secondHalfLocked = !effectiveSecondHalfStart && !effectiveFirstHalfEnd;
  const secondHalfButtonDisabled = hideHalfControls || isFinished || (!!effectiveSecondHalfEnd) || (secondHalfLocked && !effectiveSecondHalfStart) || calibrationLoading !== null;
  const homeCategoryLabel = formatCategoryLabel(homeTeam.category, t);
  const visitorCategoryLabel = formatCategoryLabel(visitorTeam.category, t);

  const handleFirstHalfAction = async () => {
    if (isFinished || hideHalfControls) return;
    setCalibrationLoading('first');
    try {
      if (!effectiveFirstHalfStart) {
        await setRealTimeCalibration(1, Date.now());
      } else if (!effectiveFirstHalfEnd) {
        await setRealTimeCalibration(1, Date.now(), 'end');
      }
    } finally {
      setCalibrationLoading(null);
    }
  };

  const handleSecondHalfAction = async () => {
    if (isFinished || secondHalfLocked || hideHalfControls) return;
    setCalibrationLoading('second');
    try {
      if (!effectiveSecondHalfStart) {
        await setRealTimeCalibration(2, Date.now());
      } else if (!effectiveSecondHalfEnd) {
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
            <div className="text-2xl md:text-4xl font-mono font-bold text-gray-900 mb-2">{formatTime(displayTime)}</div>
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

          {/* Calibration Buttons - Only show in MatchTracker (not VideoMatchTracker).
              We only hide them when both teams are locked: if one team is still open,
              we keep the controls visible so the other side can continue tracking. */}
          {showCalibration && !hideHalfControls && (
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
                    !effectiveFirstHalfStart
                      ? t('scoreboard.startFirstHalfTooltip')
                      : !effectiveFirstHalfEnd
                        ? t('scoreboard.halfStartedAt', {
                          time: new Date(effectiveFirstHalfStart).toLocaleTimeString([], {
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
                    !effectiveSecondHalfStart
                      ? secondHalfLocked
                        ? t('scoreboard.waitFirstHalfEnd')
                        : t('scoreboard.startSecondHalfTooltip')
                      : !effectiveSecondHalfEnd
                        ? t('scoreboard.halfStartedAt', {
                          time: new Date(effectiveSecondHalfStart).toLocaleTimeString([], {
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
