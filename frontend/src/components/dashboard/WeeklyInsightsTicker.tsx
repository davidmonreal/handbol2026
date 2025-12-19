import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useSafeTranslation } from '../../context/LanguageContext';
import type {
  WeeklyInsightsGoalkeeper,
  WeeklyInsightsPlayer,
  WeeklyInsightsResponse,
  WeeklyInsightsTeam,
  WeeklyInsightsTeamPercentage,
} from '../../types/api.types';
import { formatCategoryLabel } from '../../utils/categoryLabels';

type Translator = (key: string, params?: Record<string, string | number>) => string;

interface WeeklyInsightsTickerProps {
  insights: WeeklyInsightsResponse | null;
  isLoading: boolean;
  isRefreshing: boolean;
  errorKey: string | null;
  onRefresh: () => void;
}

interface TickerItem {
  id: string;
  label: string;
  summary: string;
  icon?: string;
}

// Increase this value (px/sec) to speed up the marquee; decrease to slow it down.
const SCROLL_SPEED_PX_PER_SECOND = 120;
const MIN_SCROLL_DURATION = 12;
const tickerKeyframes = `
@keyframes ticker-marquee {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(calc(-1 * var(--ticker-distance, 0px)));
  }
}`;

const formatPercentageValue = (value: number) => {
  if (!Number.isFinite(value)) return '0';
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
};

export const WeeklyInsightsTicker = ({ insights, isLoading, isRefreshing, errorKey, onRefresh }: WeeklyInsightsTickerProps) => {
  const { t } = useSafeTranslation();
  const tickerItems = useMemo(() => buildTickerItems(insights, t), [insights, t]);
  const [animationDuration, setAnimationDuration] = useState(MIN_SCROLL_DURATION);
  const [scrollDistance, setScrollDistance] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const hasError = Boolean(errorKey);

  useEffect(() => {
    const handleResize = () => {
      setContainerWidth(containerRef.current?.offsetWidth ?? 0);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!trackRef.current) return;

    const trackNode = trackRef.current;
    const totalWidth = trackNode.scrollWidth;
    const sequencesWidth = Math.max(totalWidth - containerWidth, 0);
    const singleSequenceWidth = sequencesWidth / 2;
    const distance = singleSequenceWidth + containerWidth;
    const duration = distance
      ? Math.max(distance / SCROLL_SPEED_PX_PER_SECOND, MIN_SCROLL_DURATION)
      : MIN_SCROLL_DURATION;

    const frameId = window.requestAnimationFrame(() => {
      setScrollDistance(distance);
      setAnimationDuration(duration);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [tickerItems, containerWidth]);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm px-4 py-2">
      <style>{tickerKeyframes}</style>
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0 min-h-[32px] flex items-center">
          {isLoading ? (
            <div className="w-full animate-pulse h-3 bg-gray-100 rounded" />
          ) : hasError ? (
            <p className="text-sm text-red-600">{errorKey ? t(errorKey) : ''}</p>
          ) : tickerItems.length > 0 ? (
            <div className="relative w-full overflow-hidden h-7" ref={containerRef}>
              <div
                ref={trackRef}
                className="flex items-center gap-12 whitespace-nowrap text-sm text-gray-800"
                style={
                  {
                    animation:
                      tickerItems.length > 0 && scrollDistance > 0
                        ? `ticker-marquee ${animationDuration}s linear infinite`
                        : 'none',
                    paddingLeft: containerWidth ? `${containerWidth}px` : undefined,
                    '--ticker-distance': scrollDistance > 0 ? `${scrollDistance}px` : undefined,
                  } as CSSProperties
                }
              >
                {[...tickerItems, ...tickerItems].map((item, idx) => (
                  <span key={`${item.id}-${idx}`} className="flex items-center gap-3 pr-12">
                    {item.icon && <span className="text-lg">{item.icon}</span>}
                    <span className="font-semibold text-indigo-700">{item.label}</span>
                    <span className="text-gray-800">{item.summary}</span>
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 w-full text-left">{t('dashboard.insights.empty')}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className={`shrink-0 inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
            isRefreshing
              ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-wait'
              : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
          }`}
        >
          {isRefreshing ? t('dashboard.insights.recomputing') : t('dashboard.insights.recompute')}
        </button>
      </div>
    </div>
  );
};

const buildTickerItems = (insights: WeeklyInsightsResponse | null, t: Translator): TickerItem[] => {
  if (!insights) return [];
  const { metrics } = insights;
  const items: TickerItem[] = [];

  if (metrics.topScorerOverall) {
    items.push(
      createPlayerItem(
        'overall',
        t('dashboard.insights.metric.topScorerOverall'),
        metrics.topScorerOverall,
        t('dashboard.insights.value.goals', { count: metrics.topScorerOverall.goals }),
        t,
        '🏆',
      ),
    );
  }

  metrics.topScorersByCategory.forEach((player, index) => {
    const categoryLabel = formatCategoryLabel(player.teamCategory, t);
    items.push(
      createPlayerItem(
        `category-${player.teamCategory}-${player.playerId}-${index}`,
        t('dashboard.insights.metric.topScorerCategory', { category: categoryLabel || player.teamCategory }),
        player,
        t('dashboard.insights.value.goals', { count: player.goals }),
        t,
        '🥇',
      ),
    );
  });

  if (metrics.topIndividualScorer) {
    items.push(
      createPlayerItem(
        'individual',
        t('dashboard.insights.metric.topIndividual'),
        metrics.topIndividualScorer,
        t('dashboard.insights.value.individualGoals', { count: metrics.topIndividualScorer.goals }),
        t,
        '🔥',
      ),
    );
  }

  if (metrics.teamWithMostCollectiveGoals) {
    items.push(
      createTeamItem(
        'collective',
        t('dashboard.insights.metric.collectiveTeam'),
        metrics.teamWithMostCollectiveGoals,
        t('dashboard.insights.value.collectiveGoals', { count: metrics.teamWithMostCollectiveGoals.count }),
        t,
        '🤝',
      ),
    );
  }

  if (metrics.teamWithMostFouls) {
    items.push(
      createTeamItem(
        'fouls',
        t('dashboard.insights.metric.mostFouls'),
        metrics.teamWithMostFouls,
        t('dashboard.insights.value.fouls', { count: metrics.teamWithMostFouls.count }),
        t,
        '⚠️',
      ),
    );
  }

  if (metrics.bestGoalkeeper) {
    items.push(
      createPlayerItem(
        'goalkeeper',
        t('dashboard.insights.metric.bestGoalkeeper'),
        metrics.bestGoalkeeper,
        t('dashboard.insights.value.savePercentage', {
          percentage: formatPercentageValue(metrics.bestGoalkeeper.savePercentage),
        }),
        t,
        '🧤',
      ),
    );
  }

  if (metrics.mostEfficientTeam) {
    items.push(
      createTeamItem(
        'efficient',
        t('dashboard.insights.metric.mostEfficientTeam'),
        metrics.mostEfficientTeam,
        t('dashboard.insights.value.goalPerShot', {
          percentage: formatPercentageValue(metrics.mostEfficientTeam.percentage),
        }),
        t,
        '🎯',
      ),
    );
  }

  if (metrics.mostAttackingTeam) {
    items.push(
      createTeamItem(
        'attacking',
        t('dashboard.insights.metric.mostAttackingTeam'),
        metrics.mostAttackingTeam,
        t('dashboard.insights.value.goalPerPlay', {
          percentage: formatPercentageValue(metrics.mostAttackingTeam.percentage),
        }),
        t,
        '⚔️',
      ),
    );
  }

  return items;
};

const createPlayerItem = (
  id: string,
  label: string,
  player: WeeklyInsightsPlayer | WeeklyInsightsGoalkeeper,
  valueLabel: string,
  t: Translator,
  icon?: string,
): TickerItem => ({
  id,
  label,
  summary: t('dashboard.insights.summary.player', {
    player: player.playerName,
    team: player.teamName,
    club: player.clubName?.trim() || player.teamName,
    category: formatCategoryLabel(player.teamCategory, t) || player.teamCategory || '',
    value: valueLabel,
  }),
  icon,
});

const createTeamItem = (
  id: string,
  label: string,
  team: WeeklyInsightsTeam | WeeklyInsightsTeamPercentage,
  valueLabel: string,
  t: Translator,
  icon?: string,
): TickerItem => ({
  id,
  label,
  summary: t('dashboard.insights.summary.team', {
    club: team.clubName?.trim() || team.teamName,
    category: formatCategoryLabel(team.teamCategory, t) || team.teamCategory || '',
    team: team.teamName,
    value: valueLabel,
  }),
  icon,
});

export default WeeklyInsightsTicker;
