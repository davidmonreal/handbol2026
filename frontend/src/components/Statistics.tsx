import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMatch } from '../context/MatchContext';
import type { MatchEvent } from '../types';
import { HOME_TEAM } from '../data/mockData';
import { transformBackendEvents } from '../utils/eventTransformers';
import { StatisticsView } from './stats';
import { API_BASE_URL } from '../config/api';


const Statistics = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const matchId = searchParams.get('matchId');
  const playerId = searchParams.get('playerId');
  const teamId = searchParams.get('teamId');

  const { events, activeTeamId } = useMatch();

  // State
  const [data, setData] = useState<any>(null);
  const [statsEvents, setStatsEvents] = useState<MatchEvent[]>([]);
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
          setSelectedTeamId(matchData.homeTeamId);

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

          // Load team events
          const eventsRes = await fetch(`${API_BASE_URL}/api/game-events?teamId=${teamId}`);
          const eventsData = await eventsRes.json();
          setStatsEvents(transformBackendEvents(eventsData));
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
      const currentTeamName = selectedTeamId === data.homeTeamId
        ? data.homeTeam.name
        : data.awayTeam.name;
      return `Match Statistics: ${currentTeamName}`;
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
    return activeTeamId === HOME_TEAM.id ? 'Team Statistics' : 'Team Statistics';
  }, [matchId, playerId, teamId, data, selectedTeamId, activeTeamId]);

  // Handle back navigation
  const handleBack = () => {
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

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <StatisticsView
        events={displayEvents}
        context={context}
        title={title}
        subtitle={playerId ? `#${data?.number} • All Time Stats` : (teamId ? `${data?.club?.name} • ${data?.category} • All Matches` : undefined)}
        matchData={matchId ? data : undefined}
        teamData={teamId ? data : undefined}
        teamId={selectedTeamId}
        onTeamChange={setSelectedTeamId}
        onBack={handleBack}
        showComparison={!!matchId}
      />
    </div>
  );
};

export default Statistics;
