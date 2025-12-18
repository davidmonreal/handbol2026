import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useMatch } from '../context/MatchContext';
import { useSafeTranslation } from '../context/LanguageContext';
import type { MatchEvent } from '../types';
import { transformBackendEvents } from '../utils/eventTransformers';
import { StatisticsView } from './stats';
import { API_BASE_URL } from '../config/api';
import { formatCategoryLabel } from '../utils/categoryLabels';

const Statistics = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const matchId = searchParams.get('matchId');
  const playerId = searchParams.get('playerId');
  const teamId = searchParams.get('teamId');
  const urlActiveTeamId = searchParams.get('activeTeamId');

  const { events, activeTeamId } = useMatch();
  const { t } = useSafeTranslation();

  // State
  const [data, setData] = useState<any>(null);
  const [statsEvents, setStatsEvents] = useState<MatchEvent[]>([]);
  const [foulStatsEvents, setFoulStatsEvents] = useState<MatchEvent[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load data based on context
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (matchId) {
          // Load match details
          const matchRes = await fetch(`${API_BASE_URL}/api/matches/${matchId}`);
          const matchData = await matchRes.json();
          setData(matchData);
          // Use activeTeamId from URL or context, fallback to homeTeamId
          setSelectedTeamId(urlActiveTeamId || activeTeamId || matchData.homeTeamId);

          // Load match events
          const eventsRes = await fetch(`${API_BASE_URL}/api/game-events/match/${matchId}`);
          const eventsData = await eventsRes.json();
          setStatsEvents(transformBackendEvents(eventsData));
        } else if (playerId) {
          // Load player details
          const playerRes = await fetch(`${API_BASE_URL}/api/players/${playerId}`);
          const playerData = await playerRes.json();
          setData(playerData);

          // Load all events
          const eventsRes = await fetch(`${API_BASE_URL}/api/game-events`);
          const allEvents = await eventsRes.json();

          // Filter based on player type
          const playerEvents = playerData.isGoalkeeper
            ? allEvents.filter((e: any) =>
              e.activeGoalkeeperId === playerId &&
              e.type === 'Shot' &&
              ['Goal', 'Save'].includes(e.subtype)
            )
            : allEvents.filter((e: any) => e.playerId === playerId);

          setStatsEvents(transformBackendEvents(playerEvents));
        } else if (teamId) {
          // Load team details
          const teamRes = await fetch(`${API_BASE_URL}/api/teams/${teamId}`);
          const teamData = await teamRes.json();
          setData(teamData);

          // Load all events to derive both team and opponent data
          const eventsRes = await fetch(`${API_BASE_URL}/api/game-events`);
          const eventsData = await eventsRes.json();
          const transformed = transformBackendEvents(eventsData);

          const teamEvents = transformed.filter((e: MatchEvent) => e.teamId === teamId);
          const matchesForTeam = new Set(teamEvents.map(e => e.matchId).filter(Boolean));
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
  }, [matchId, playerId, teamId]);

  // Determine which events to show
  const displayEvents = useMemo(() => {
    if (matchId || playerId || teamId) return statsEvents;
    return events.filter(e => e.teamId === activeTeamId);
  }, [matchId, playerId, teamId, statsEvents, events, activeTeamId]);

  // Determine context
  const context = matchId ? 'match' : (playerId ? 'player' : 'team');

  // Determine title
  const title = useMemo(() => {
    if (matchId && data) {
      const currentTeam = selectedTeamId === data.homeTeamId ? data.homeTeam : data.awayTeam;
      const parts = [];
      if (currentTeam?.club?.name) parts.push(currentTeam.club.name);
      const categoryLabel = formatCategoryLabel(currentTeam?.category, t);
      if (categoryLabel) parts.push(categoryLabel);
      if (currentTeam?.name) parts.push(currentTeam.name);
      const displayName = parts.join(' ');
      return `Match Statistics: ${displayName || 'Team'}`;
    }
    if (playerId && data) {
      return (
        <div className="flex items-center gap-2">
          <span>{data.name} - Statistics</span>
          {data.isGoalkeeper && (
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
              GK
            </span>
          )}
        </div>
      );
    }
    if (teamId && data) {
      return `${data.name} - Statistics`;
    }
    return 'Team Statistics';
  }, [matchId, playerId, teamId, data, selectedTeamId, activeTeamId]);

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

  const teamSubtitle = teamId && data
    ? [data?.club?.name, formatCategoryLabel(data?.category, t), 'All Matches'].filter(Boolean).join(' • ')
    : undefined;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <StatisticsView
        events={displayEvents}
        foulEvents={foulStatsEvents}
        context={context}
        title={title}
        subtitle={playerId ? `#${data?.number} • All Time Stats` : teamSubtitle}
        matchData={matchId ? data : undefined}
        teamData={teamId ? data : undefined}
        playerData={playerId ? data : undefined}
        teamId={selectedTeamId}
        selectedPlayerId={playerId}
        onTeamChange={setSelectedTeamId}
        onBack={handleBack}
        showComparison={!!matchId}
      />
    </div>
  );
};

export default Statistics;
