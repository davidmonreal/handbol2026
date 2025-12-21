import { Plus, Minus, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMatch } from '../../context/MatchContext';
import { useSafeTranslation } from '../../context/LanguageContext';
import { formatCategoryLabel } from '../../utils/categoryLabels';
import { useHalfControls } from './useHalfControls';

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
    matchId,
    events,
  } = useMatch();
  const homeCategoryLabel = formatCategoryLabel(homeTeam.category, t);
  const visitorCategoryLabel = formatCategoryLabel(visitorTeam.category, t);
  const {
    displayTime,
    firstHalfStart,
    firstHalfFinish,
    secondHalfStart,
    secondHalfFinish,
    showHalfControls,
    showSecondHalfControls,
    formatTime,
    firstHalfFinished,
    secondHalfFinished,
  } = useHalfControls({
    time,
    hideHalfControls,
    isFinished,
    hasAnyEvents: (events ?? []).length > 0,
    realTimeFirstHalfStart,
    realTimeFirstHalfEnd,
    realTimeSecondHalfStart,
    realTimeSecondHalfEnd,
    firstHalfVideoStart,
    secondHalfVideoStart,
    setRealTimeCalibration,
    onFinishMatch,
    t,
  });

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
          {showCalibration && !hideHalfControls && showHalfControls && (
            <div className="flex flex-col gap-2 text-xs w-full">
              {/* Half buttons are stacked vertically; 2H appears 3s after finishing 1H (or immediately if already started). */}
              {!showSecondHalfControls && (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={firstHalfStart.onClick}
                    disabled={firstHalfStart.disabled}
                    className={`w-full px-3 py-1 rounded-md font-medium transition-colors ${firstHalfFinished
                      ? 'bg-green-50 text-green-700 cursor-default'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300'
                      }`}
                    title={firstHalfStart.title}
                  >
                    {firstHalfStart.label}
                  </button>
                  <button
                    onClick={firstHalfFinish.onClick}
                    disabled={firstHalfFinish.disabled}
                    className={`w-full px-3 py-1 rounded-md font-medium transition-colors ${firstHalfFinished
                      ? 'bg-green-50 text-green-700 cursor-default'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300'
                      }`}
                    title={firstHalfFinish.title}
                  >
                    {firstHalfFinish.label}
                  </button>
                </div>
              )}

              {secondHalfStart.visible && showSecondHalfControls && scoreMode !== 'manual' && (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={secondHalfStart.onClick}
                    disabled={secondHalfStart.disabled}
                    className={`w-full px-3 py-1 rounded-md font-medium transition-colors ${secondHalfFinished
                      ? 'bg-green-50 text-green-700 cursor-default'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300'
                      }`}
                    title={secondHalfStart.title}
                  >
                    {secondHalfStart.label}
                  </button>
                  <button
                    onClick={secondHalfFinish.onClick}
                    disabled={secondHalfFinish.disabled}
                    className={`w-full px-3 py-1 rounded-md font-medium transition-colors ${secondHalfFinished
                      ? 'bg-green-50 text-green-700 cursor-default'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300'
                      }`}
                    title={secondHalfFinish.title}
                  >
                    {secondHalfFinish.label}
                  </button>
                </div>
              )}
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
