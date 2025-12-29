import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronRight, Calendar, BarChart3 } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { useSafeTranslation } from '../context/LanguageContext';
import { useDataRefresh } from '../context/DataRefreshContext';
import { ErrorMessage } from './common';
import { MatchCard } from './match/MatchCard';
import type { WeeklyInsightsResponse, DashboardSnapshotResponse } from '../types/api.types';
import { WeeklyInsightsTicker } from './dashboard/WeeklyInsightsTicker';
import { formatCategoryLabel } from '../utils/categoryLabels';

const MatchCardSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-3 pt-4 pb-2 w-full min-w-0">
    <div className="flex flex-col gap-5 animate-pulse">
      <div className="flex flex-col gap-3">
        <div className="flex items-center text-sm">
          <div className="h-3 w-28 bg-gray-50 border border-gray-100 rounded" />
          <div className="h-3 w-16 bg-gray-50 border border-gray-100 rounded ml-4" />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0 space-y-2 text-right">
            <div className="h-4 w-24 bg-gray-50 border border-gray-100 rounded ml-auto" />
            <div className="h-3 w-16 bg-gray-50 border border-gray-100 rounded ml-auto" />
          </div>

          <div className="px-4 flex items-center justify-center min-w-[100px]">
            <div className="h-6 w-12 bg-gray-50 border border-gray-100 rounded" />
          </div>

          <div className="flex-1 min-w-0 space-y-2 text-left">
            <div className="h-4 w-24 bg-gray-50 border border-gray-100 rounded" />
            <div className="h-3 w-16 bg-gray-50 border border-gray-100 rounded" />
          </div>
        </div>

        <div className="h-3 w-2/3 bg-gray-50 border border-gray-100 rounded" />
      </div>

      <div className="flex flex-col lg:flex-row gap-1.5">
        <div className="h-8 flex-1 bg-gray-50 border border-gray-100 rounded-lg" />
        <div className="h-8 w-12 bg-gray-50 border border-gray-100 rounded-lg" />
        <div className="h-8 flex-1 bg-gray-50 border border-gray-100 rounded-lg" />
      </div>
    </div>
  </div>
);

const MatchCardSkeletonGrid = ({ items = 3 }: { items?: number }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 xl:gap-8">
    {Array.from({ length: items }).map((_, index) => (
      <MatchCardSkeleton key={`match-skeleton-${index}`} />
    ))}
  </div>
);

// ...

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useSafeTranslation();
  const { refreshToken } = useDataRefresh();
  const [dashboardData, setDashboardData] = useState<DashboardSnapshotResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [isInsightsRefreshing, setIsInsightsRefreshing] = useState(false);
  const [insightsErrorKey, setInsightsErrorKey] = useState<string | null>(null);
  const [teamsErrorKey, setTeamsErrorKey] = useState<string | null>(null);
  const [showInsightsTicker, setShowInsightsTicker] = useState(false);

  const pendingMatches = dashboardData?.pendingMatches ?? [];
  const pastMatches = dashboardData?.pastMatches ?? [];
  const myTeams = dashboardData?.myTeams ?? [];
  const weeklyInsights = dashboardData?.weeklyInsights ?? null;
  const myPendingMatches = pendingMatches.filter(
    match => match.homeTeam?.isMyTeam || match.awayTeam?.isMyTeam,
  );
  const isInsightsLoading = isLoading && !weeklyInsights;
  const isMyTeamsLoading = isLoading && !dashboardData;

  useEffect(() => {
    loadDashboard();
  }, [refreshToken]);

  useEffect(() => {
    if (isLoading) {
      setShowInsightsTicker(false);
      return;
    }

    const win = globalThis as typeof globalThis & {
      requestIdleCallback?: (callback: () => void) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let idleId: number | undefined;

    if (typeof win.requestIdleCallback === 'function') {
      idleId = win.requestIdleCallback(() => setShowInsightsTicker(true));
    } else {
      timeoutId = setTimeout(() => setShowInsightsTicker(true), 200);
    }

    return () => {
      if (idleId !== undefined && typeof win.cancelIdleCallback === 'function') {
        win.cancelIdleCallback(idleId);
      }
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    };
  }, [isLoading]);

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      setErrorKey(null);
      const response = await fetch(`${API_BASE_URL}/api/dashboard`);
      if (!response.ok) {
        throw new Error('Failed to load dashboard');
      }
      const payload = (await response.json()) as DashboardSnapshotResponse;
      setDashboardData(payload);
      setInsightsErrorKey(null);
      setTeamsErrorKey(null);
    } catch (error) {
      console.error('Error fetching dashboard snapshot:', error);
      setErrorKey('dashboard.errorConnection');
      setInsightsErrorKey('dashboard.insights.errorLoad');
      setTeamsErrorKey('dashboard.myTeamsStats.error');
    } finally {
      setIsLoading(false);
    }
  };

  const recomputeInsights = async () => {
    try {
      setInsightsErrorKey(null);
      setIsInsightsRefreshing(true);
      const response = await fetch(`${API_BASE_URL}/api/insights/weekly/recompute`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to recompute insights');
      }
      const data = (await response.json()) as WeeklyInsightsResponse;
      setDashboardData(prev => {
        if (prev) {
          return { ...prev, weeklyInsights: data };
        }
        return {
          pendingMatches: [],
          pastMatches: [],
          myTeams: [],
          weeklyInsights: data,
        };
      });
    } catch (error) {
      console.error('Error recomputing weekly insights:', error);
      setInsightsErrorKey('dashboard.insights.errorRecompute');
    } finally {
      setIsInsightsRefreshing(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 overflow-x-hidden min-w-0">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.title')}</h1>
          <p className="text-gray-500">
            {isLoading ? t('dashboard.loadingMessage') : t('dashboard.welcome')}
          </p>
        </div>
        {isLoading ? (
          <div className="h-10 w-36 rounded-lg bg-gray-100 animate-pulse" />
        ) : (
          <button
            onClick={() => navigate('/matches')}
            className="flex w-full items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm sm:w-auto"
          >
            <Plus size={18} className="mr-2" />
            {t('dashboard.newMatch')}
          </button>
        )}
      </div>

      {showInsightsTicker ? (
        <WeeklyInsightsTicker
          insights={weeklyInsights}
          isLoading={isInsightsLoading}
          isRefreshing={isInsightsRefreshing}
          errorKey={insightsErrorKey}
          onRefresh={recomputeInsights}
        />
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm px-4 py-2">
          <div className="flex items-center gap-3 animate-pulse">
            <div className="flex-1 min-w-0 min-h-[32px] flex items-center">
              <div className="w-full h-3 bg-gray-50 rounded border border-gray-100" />
            </div>
            <div className="h-7 w-24 rounded-lg bg-gray-50 border border-gray-100" />
          </div>
        </div>
      )}

      <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold tracking-wide text-indigo-600">
            <BarChart3 size={16} />
            {t('dashboard.myTeamsStats.title')}
          </div>
        </div>
        {isMyTeamsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(3)].map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className="h-24 rounded-2xl bg-gray-100 animate-pulse"
              />
            ))}
          </div>
        ) : teamsErrorKey ? (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-4">
            {t(teamsErrorKey)}
          </div>
        ) : myTeams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {myTeams.map(team => {
              const meta = [team.club?.name, formatCategoryLabel(team.category, t)]
                .filter(Boolean)
                .join(' • ');
              return (
                <button
                  key={team.id}
                  onClick={() => navigate(`/statistics?teamId=${team.id}`, { state: { fromPath: '/' } })}
                  className="group flex flex-col items-start gap-3 rounded-2xl border border-gray-200 px-4 py-3 text-left transition hover:border-indigo-300 hover:shadow-sm"
                >
                  {meta && <span className="text-xs text-gray-500">{meta}</span>}
                  <div className="flex w-full items-center justify-between">
                    <span className="text-base font-semibold text-gray-900">{team.name}</span>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 group-hover:text-indigo-700">
                      {t('dashboard.myTeamsStats.cta')}
                      <ChevronRight size={16} />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-sm text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-xl p-4">
            {t('dashboard.myTeamsStats.empty')}
          </div>
        )}
      </section>

      {/* Error Message */}
      {errorKey && (
        <ErrorMessage
          message={t(errorKey)}
          onRetry={loadDashboard}
        />
      )}

      {/* Next matches strip (first three upcoming) */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full" />
          <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.upcomingMyTeams')}</h2>
        </div>
        {isLoading ? (
          <MatchCardSkeletonGrid items={3} />
        ) : myPendingMatches.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 xl:gap-10">
            {myPendingMatches.slice(0, 3).map(match => (
              <MatchCard key={`next-${match.id}`} match={match} isPending={true} />
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-xl p-4">
            {t('dashboard.noUpcomingMyTeams')}
          </div>
        )}
      </section>

      {/* Pending Matches */}
      <section>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center min-w-0">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            {t('dashboard.upcomingAll')}
          </h2>
          {isLoading ? (
            <div className="h-4 w-24 rounded bg-gray-100 animate-pulse" />
          ) : (
            <button
              onClick={() => navigate('/matches')}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center shrink-0"
            >
              {t('dashboard.viewAll')} <ChevronRight size={16} />
            </button>
          )}
        </div>

        {isLoading ? (
          <MatchCardSkeletonGrid items={3} />
        ) : pendingMatches.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 xl:gap-8">
            {pendingMatches.map(match => (
              <MatchCard key={match.id} match={match} isPending={true} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <h3 className="text-sm font-medium text-gray-900">{t('dashboard.noUpcoming')}</h3>
            <p className="mt-1 text-sm text-gray-500">{t('dashboard.noUpcomingDescription')}</p>
            <button
              onClick={() => navigate('/matches')}
              className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
            >
              {t('dashboard.scheduleMatch')}
            </button>
          </div>
        )}
      </section>

      {/* Past Matches */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
            {t('dashboard.recentHistory')}
          </h2>
        </div>

        {isLoading ? (
          <MatchCardSkeletonGrid items={3} />
        ) : pastMatches.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 xl:gap-8">
            {pastMatches.map(match => (
              <MatchCard key={match.id} match={match} isPending={false} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 text-sm">
            {t('dashboard.noPastMatches')}
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
