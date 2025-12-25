import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useMatch } from '../context/MatchContext';
import { useSafeTranslation } from '../context/LanguageContext';
import type { MatchEvent } from '../types';
import { transformBackendEvents } from '../utils/eventTransformers';
import type { BackendEvent as TransformerBackendEvent } from '../utils/eventTransformers';
import { StatisticsView } from './stats';
import { API_BASE_URL } from '../config/api';
import { formatCategoryLabel } from '../utils/categoryLabels';
import { DEFAULT_FIELD_POSITION, PLAYER_POSITION_ABBR, PLAYER_POSITIONS } from '../constants/playerPositions';
import type { PlayerPositionId } from '../constants/playerPositions';

type BackendTeamRef = {
  id?: string;
  name?: string;
  club?: { name?: string };
};

type BackendMatchRef = {
  id?: string;
  date?: string;
  homeTeamId?: string;
  awayTeamId?: string;
  homeTeam?: BackendTeamRef;
  awayTeam?: BackendTeamRef;
};

type ApiEvent = TransformerBackendEvent & { match?: BackendMatchRef };

type PlayerSummary = {
  player: { id: string; name: string; number: number; isGoalkeeper?: boolean };
  position?: number;
};

type MatchData = {
  homeTeam: { id: string; name: string; club?: { name?: string }; category?: string; players?: PlayerSummary[] };
  awayTeam: { id: string; name: string; club?: { name?: string }; category?: string; players?: PlayerSummary[] };
  homeTeamId: string;
  awayTeamId: string;
  realTimeFirstHalfStart?: number | null;
  realTimeSecondHalfStart?: number | null;
  realTimeFirstHalfEnd?: number | null;
  realTimeSecondHalfEnd?: number | null;
  firstHalfVideoStart?: number | null;
  secondHalfVideoStart?: number | null;
};

type TeamData = {
  id?: string;
  name?: string;
  club?: { name?: string };
  category?: string;
  players?: PlayerSummary[];
};

type PlayerData = {
  id?: string;
  name?: string;
  number?: number;
  teams?: { position?: number }[];
};

type MatchFilterOption = { matchId: string; label: string };

const formatMatchDate = (raw?: string, locale = 'ca-ES') => {
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit' }).format(date);
};

const resolveMatchDateLocale = (language: string) => {
  if (language === 'en') return 'en-GB';
  if (language === 'es') return 'es-ES';
  return 'ca-ES';
};

const buildTeamMatchFilters = (
  eventsData: ApiEvent[],
  teamId: string,
  fallbackOpponentLabel: string,
  dateLocale: string,
): MatchFilterOption[] => {
  const matches = new Map<string, { label: string; sortKey: number }>();

  eventsData.forEach((event) => {
    const match = event.match;
    const matchId = event.matchId ?? match?.id;
    if (!match || !matchId) return;

    const homeId = match.homeTeamId ?? match.homeTeam?.id;
    const awayId = match.awayTeamId ?? match.awayTeam?.id;
    if (homeId !== teamId && awayId !== teamId) return;

    const opponent = homeId === teamId ? match.awayTeam : match.homeTeam;
    const opponentName = opponent?.club?.name ?? opponent?.name ?? fallbackOpponentLabel;
    const dateLabel = formatMatchDate(match.date, dateLocale);
    const label = dateLabel ? `${opponentName} • ${dateLabel}` : opponentName;
    const sortKey = match.date ? new Date(match.date).getTime() : 0;

    if (!matches.has(matchId)) {
      matches.set(matchId, { label, sortKey });
    }
  });

  return [...matches.entries()]
    .map(([matchId, meta]) => ({ matchId, label: meta.label, sortKey: meta.sortKey }))
    .sort((a, b) => b.sortKey - a.sortKey)
    .map(({ matchId, label }) => ({ matchId, label }));
};

const buildPlayerMatchFilters = (
  eventsData: ApiEvent[],
  playerId: string,
  fallbackOpponentLabel: string,
  dateLocale: string,
): MatchFilterOption[] => {
  const matches = new Map<string, { label: string; sortKey: number }>();

  eventsData.forEach((event) => {
    const match = event.match;
    const matchId = event.matchId ?? match?.id;
    if (!match || !matchId) return;

    const homeId = match.homeTeamId ?? match.homeTeam?.id;
    const awayId = match.awayTeamId ?? match.awayTeam?.id;
    if (!homeId || !awayId) return;

    let playerTeamId: string | undefined;
    if (event.playerId === playerId) {
      playerTeamId = event.teamId;
    } else if (event.activeGoalkeeperId === playerId) {
      playerTeamId = event.teamId === homeId ? awayId : homeId;
    }

    const opponent = playerTeamId
      ? (playerTeamId === homeId ? match.awayTeam : match.homeTeam)
      : (event.teamId === homeId ? match.awayTeam : match.homeTeam);
    const opponentName = opponent?.club?.name ?? opponent?.name ?? fallbackOpponentLabel;
    const dateLabel = formatMatchDate(match.date, dateLocale);
    const label = dateLabel ? `${opponentName} • ${dateLabel}` : opponentName;
    const sortKey = match.date ? new Date(match.date).getTime() : 0;

    if (!matches.has(matchId)) {
      matches.set(matchId, { label, sortKey });
    }
  });

  return [...matches.entries()]
    .map(([matchId, meta]) => ({ matchId, label: meta.label, sortKey: meta.sortKey }))
    .sort((a, b) => b.sortKey - a.sortKey)
    .map(({ matchId, label }) => ({ matchId, label }));
};

const normalizeEventTimestampsForVideo = (events: MatchEvent[], matchData: MatchData | null) => {
  if (!matchData?.firstHalfVideoStart && !matchData?.secondHalfVideoStart) return events;
  if (matchData?.firstHalfVideoStart == null) return events;

  const firstHalfStart = matchData.firstHalfVideoStart;
  const secondHalfStart = matchData.secondHalfVideoStart ?? null;
  const firstHalfDuration = secondHalfStart !== null
    ? Math.max(0, secondHalfStart - firstHalfStart)
    : null;

  let hasVideoEvents = false;
  const normalized = events.map((event) => {
    if (event.videoTimestamp == null) return event;
    hasVideoEvents = true;

    let derivedTimestamp = Math.max(0, event.videoTimestamp - firstHalfStart);
    if (secondHalfStart !== null && event.videoTimestamp >= secondHalfStart && firstHalfDuration !== null) {
      derivedTimestamp = firstHalfDuration + Math.max(0, event.videoTimestamp - secondHalfStart);
    }

    if (derivedTimestamp === event.timestamp) return event;
    return { ...event, timestamp: derivedTimestamp };
  });

  return hasVideoEvents ? normalized : events;
};

const normalizeMatchData = (data: MatchData | null) => {
  if (!data) return undefined;

  const normalizeTeam = (team: MatchData['homeTeam']) => ({
    id: team.id,
    name: team.name ?? '',
    club: team.club ? { name: team.club.name ?? '' } : undefined,
    category: team.category,
    players: team.players ?? [],
  });

  return {
    homeTeam: normalizeTeam(data.homeTeam),
    awayTeam: normalizeTeam(data.awayTeam),
    homeTeamId: data.homeTeamId,
    awayTeamId: data.awayTeamId,
    realTimeFirstHalfStart: data.realTimeFirstHalfStart ?? null,
    realTimeSecondHalfStart: data.realTimeSecondHalfStart ?? null,
    realTimeFirstHalfEnd: data.realTimeFirstHalfEnd ?? null,
    realTimeSecondHalfEnd: data.realTimeSecondHalfEnd ?? null,
    firstHalfVideoStart: data.firstHalfVideoStart ?? null,
    secondHalfVideoStart: data.secondHalfVideoStart ?? null,
  };
};

const normalizeTeamData = (data: TeamData | null) => {
  if (!data) return undefined;
  return {
    ...data,
    id: data.id ?? '',
    name: data.name ?? '',
    club: data.club ? { name: data.club.name ?? '' } : undefined,
    players: data.players ?? [],
  };
};

const Statistics = () => {
  const GOALKEEPER_POSITION_ID: PlayerPositionId = 1;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const matchId = searchParams.get('matchId');
  const playerId = searchParams.get('playerId');
  const teamId = searchParams.get('teamId');
  const urlActiveTeamId = searchParams.get('activeTeamId');

  const { events, activeTeamId } = useMatch();
  const { t, language } = useSafeTranslation();

  // State
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [statsEvents, setStatsEvents] = useState<MatchEvent[]>([]);
  const [foulStatsEvents, setFoulStatsEvents] = useState<MatchEvent[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [teamMatchFilters, setTeamMatchFilters] = useState<MatchFilterOption[]>([]);
  const [playerMatchFilters, setPlayerMatchFilters] = useState<MatchFilterOption[]>([]);
  const [loading, setLoading] = useState(false);

  const playerPositionIds = useMemo(() => {
    const ids = new Set<number>();
    playerData?.teams?.forEach((team) => {
      if (typeof team.position === 'number') {
        ids.add(team.position);
      }
    });
    const ordered = PLAYER_POSITIONS.map((pos) => pos.id).filter((id) => ids.has(id));
    return ordered.length > 0 ? ordered : [DEFAULT_FIELD_POSITION];
  }, [playerData]);

  // Load data based on context
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (matchId) {
          setTeamMatchFilters([]);
          setPlayerMatchFilters([]);
          // Load match details
          const matchRes = await fetch(`${API_BASE_URL}/api/matches/${matchId}`);
          const matchData = await matchRes.json();
          setMatchData(matchData);
          // Pick an initial team that belongs to the match; avoid leaking a stale activeTeamId from another match.
          const belongsToMatch = (id: string | null | undefined) =>
            id === matchData.homeTeamId || id === matchData.awayTeamId;
          const initialTeamId =
            (urlActiveTeamId && belongsToMatch(urlActiveTeamId) && urlActiveTeamId) ||
            (activeTeamId && belongsToMatch(activeTeamId) && activeTeamId) ||
            matchData.homeTeamId;
          setSelectedTeamId(initialTeamId);

          // Load match events
          const eventsRes = await fetch(`${API_BASE_URL}/api/game-events/match/${matchId}`);
          const eventsData = await eventsRes.json();
          setStatsEvents(transformBackendEvents(eventsData));
        } else if (playerId) {
          setTeamMatchFilters([]);
          setPlayerMatchFilters([]);
          // Load player details
          const playerRes = await fetch(`${API_BASE_URL}/api/players/${playerId}`);
          const playerData = await playerRes.json();
          setPlayerData(playerData);

          // Load all events
          const eventsRes = await fetch(`${API_BASE_URL}/api/game-events`);
          const allEvents: ApiEvent[] = await eventsRes.json();
          const hasGoalkeeperPosition =
            playerData?.teams?.some((team: { position?: number }) => team.position === GOALKEEPER_POSITION_ID) ??
            false;

          // Filter based on player type
          const playerEvents = hasGoalkeeperPosition
            ? allEvents.filter((e) =>
              e.activeGoalkeeperId === playerId &&
              e.type === 'Shot' &&
              (e.subtype ? ['Goal', 'Save'].includes(e.subtype) : false)
            )
            : allEvents.filter((e) => e.playerId === playerId);

          const dateLocale = resolveMatchDateLocale(language);
          setPlayerMatchFilters(buildPlayerMatchFilters(playerEvents, playerId, t('stats.opponentFallback'), dateLocale));
          setStatsEvents(transformBackendEvents(playerEvents));
        } else if (teamId) {
          setPlayerMatchFilters([]);
          // Load team details
          const teamRes = await fetch(`${API_BASE_URL}/api/teams/${teamId}`);
          const teamData = await teamRes.json();
          setTeamData(teamData);

          // Load all events to derive both team and opponent data
          const eventsRes = await fetch(`${API_BASE_URL}/api/game-events`);
          const eventsData: ApiEvent[] = await eventsRes.json();
          const transformed = transformBackendEvents(eventsData);
          const dateLocale = resolveMatchDateLocale(language);
          setTeamMatchFilters(buildTeamMatchFilters(eventsData, teamId, t('stats.opponentFallback'), dateLocale));

          const matchesForTeam = new Set(
            (eventsData || [])
              .map((event) => {
                const match = event.match;
                const homeId = match?.homeTeamId ?? match?.homeTeam?.id;
                const awayId = match?.awayTeamId ?? match?.awayTeam?.id;
                if (homeId === teamId || awayId === teamId) {
                  return event.matchId as string | null;
                }
                return null;
              })
              .filter((matchId: string | null): matchId is string => Boolean(matchId))
          );
          const teamEvents = transformed.filter((e: MatchEvent) => e.teamId === teamId);
          // These are opponent events in our matches; later we treat them as defensive
          // fouls committed by our team (i.e., rival plays that ended in a foul).
          const opponentEvents = transformed.filter(
            (e: MatchEvent) => e.teamId !== teamId && e.matchId && matchesForTeam.has(e.matchId)
          );

          setStatsEvents(teamEvents);
          setFoulStatsEvents(opponentEvents);
        }
      } catch (error) {
        console.error('Error loading statistics:', error);
      } finally {
        setLoading(false);
      }
    };

    if (matchId || playerId || teamId) {
      loadData();
    }
  }, [matchId, playerId, teamId, activeTeamId, urlActiveTeamId, language, t]);

  // Determine which events to show
  const displayEvents = useMemo(() => {
    if (matchId) return normalizeEventTimestampsForVideo(statsEvents, matchData);
    if (playerId || teamId) return statsEvents;
    return events.filter(e => e.teamId === activeTeamId);
  }, [matchId, playerId, teamId, statsEvents, events, activeTeamId, matchData]);

  // Determine context
  const context = matchId ? 'match' : (playerId ? 'player' : 'team');

  // Determine title
  const title = useMemo(() => {
    if (matchId && matchData) {
      const currentTeam = selectedTeamId === matchData.homeTeamId ? matchData.homeTeam : matchData.awayTeam;
      const parts = [];
      if (currentTeam?.club?.name) parts.push(currentTeam.club.name);
      const categoryLabel = formatCategoryLabel(currentTeam?.category, t);
      if (categoryLabel) parts.push(categoryLabel);
      if (currentTeam?.name) parts.push(currentTeam.name);
      const displayName = parts.join(' ');
      return `Match Statistics: ${displayName || 'Team'}`;
    }
    if (playerId && playerData) {
      const renderPositionBadges = () =>
        playerPositionIds.map((positionId) => {
          const abbr =
            PLAYER_POSITION_ABBR[positionId as PlayerPositionId] ??
            PLAYER_POSITION_ABBR[DEFAULT_FIELD_POSITION];
          const isGoalkeeper = positionId === GOALKEEPER_POSITION_ID;
          return (
            <span
              key={abbr}
              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                isGoalkeeper
                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                  : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
              }`}
            >
              {abbr}
            </span>
          );
        });
      return (
        <div className="flex items-center gap-2">
          <span>{playerData.name} - Statistics</span>
          {renderPositionBadges()}
        </div>
      );
    }
    if (teamId && teamData) {
      return `${teamData.name} - Statistics`;
    }
    return 'Team Statistics';
  }, [
    matchId,
    playerId,
    teamId,
    matchData,
    playerData,
    teamData,
    selectedTeamId,
    t,
    playerPositionIds,
  ]);

  // Handle back navigation
  const fromPath = (location.state as { fromPath?: string } | null)?.fromPath;

  const handleBack = () => {
    if (fromPath) {
      navigate(fromPath);
      return;
    }
    if (matchId) {
      // If coming from MatchTracker (live), go back there. 
      // But we don't know if we came from MatchTracker or MatchesManagement.
      // We can check history or just default to MatchesManagement if not in live mode?
      // For now, let's assume if we are in "admin" layout (which this component is part of), we go back to matches list.
      // BUT, MatchTracker also links here.
      // Let's use window.history.length > 1 ? navigate(-1) : navigate('/matches')
      navigate(-1);
    } else if (playerId) {
      navigate('/players');
    } else if (teamId) {
      navigate('/teams');
    } else {
      navigate('/');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading statistics...</div>;
  }

  if (!matchId && !playerId && !teamId && !activeTeamId) {
    return <div className="p-8 text-center text-gray-500">Please select a team in the Match tab first or navigate from a match.</div>;
  }

  const matchDataForView = matchId ? normalizeMatchData(matchData) : undefined;
  const teamDataForView = teamId ? normalizeTeamData(teamData) : undefined;

  const teamSubtitle = teamId && teamDataForView
    ? [teamDataForView?.club?.name, formatCategoryLabel(teamDataForView?.category, t), t('stats.allMatches')]
      .filter(Boolean)
      .join(' • ')
    : undefined;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <StatisticsView
        events={displayEvents}
        foulEvents={foulStatsEvents}
        context={context}
        title={title}
        subtitle={playerId ? `#${playerData?.number} • All Time Stats` : teamSubtitle}
        matchData={matchDataForView}
        teamData={teamDataForView}
        playerData={playerId ? playerData : undefined}
        teamId={selectedTeamId}
        matchFilters={playerId ? playerMatchFilters : (teamId ? teamMatchFilters : undefined)}
        selectedPlayerId={playerId}
        onTeamChange={setSelectedTeamId}
        onBack={handleBack}
        showComparison={!!matchId}
      />
    </div>
  );
};

export default Statistics;
