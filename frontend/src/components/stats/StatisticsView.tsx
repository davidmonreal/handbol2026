import { useState, useMemo } from 'react';
import { Users, Filter, X } from 'lucide-react';
import type { MatchEvent, ZoneType } from '../../types';
import { StatisticsPanel } from './StatisticsPanel';
import { PlayerStatisticsTable } from './PlayerStatisticsTable';
import { FiltersBar } from './FiltersBar';
import { usePlayerBaselines } from './hooks/usePlayerBaselines';

interface StatisticsViewProps {
  events: MatchEvent[];
  title?: React.ReactNode;
  subtitle?: string;
  context: 'match' | 'player' | 'team';
  onPlayerClick?: (playerId: string | null) => void;
  selectedPlayerId?: string | null;
  showComparison?: boolean;
  teamId?: string | null;
  matchData?: {
    homeTeam: { id: string; name: string; club?: { name: string }; category?: string; players: any[] };
    awayTeam: { id: string; name: string; club?: { name: string }; category?: string; players: any[] };
    homeTeamId: string;
    awayTeamId: string;
  };
  teamData?: {
    players: any[];
  };
  onTeamChange?: (teamId: string) => void;
  onBack?: () => void;
}

export function StatisticsView({
  events,
  title,
  subtitle,
  context,
  onPlayerClick,
  selectedPlayerId,
  showComparison = false,
  teamId,
  matchData,
  teamData,
  onTeamChange,
  onBack,
}: StatisticsViewProps) {
  // Helper function to format team display with club, category, and name
  const formatTeamDisplay = (team: { name: string; club?: { name: string }; category?: string }) => {
    const parts = [];
    if (team.club?.name) parts.push(team.club.name);
    if (team.category) parts.push(team.category);
    parts.push(team.name);
    return parts.join(' ');
  };
  // Filter state
  const [filterZone, setFilterZone] = useState<ZoneType | '7m' | null>(null);
  const [filterPlayer, setFilterPlayer] = useState<string | null>(selectedPlayerId || null);
  const [filterOpposition, setFilterOpposition] = useState<boolean | null>(null);
  const [filterCollective, setFilterCollective] = useState<boolean | null>(null);
  const [filterCounterAttack, setFilterCounterAttack] = useState<boolean | null>(null);

  // Team selection for match context (controlled or uncontrolled)
  const [internalSelectedTeamId, setInternalSelectedTeamId] = useState<string | null>(
    matchData ? matchData.homeTeamId : null
  );

  const selectedTeamId = teamId || internalSelectedTeamId;

  const handleTeamSwitch = (newTeamId: string) => {
    if (onTeamChange) {
      onTeamChange(newTeamId);
    } else {
      setInternalSelectedTeamId(newTeamId);
    }
  };

  // Player info lookup function
  const getPlayerInfo = (playerId: string): { name: string; number: number; isGoalkeeper?: boolean } => {
    if (matchData) {
      // Look in home team
      const homePlayer = matchData.homeTeam.players.find((p: any) => p.player.id === playerId);
      if (homePlayer) return {
        name: homePlayer.player.name,
        number: homePlayer.player.number,
        isGoalkeeper: homePlayer.player.isGoalkeeper
      };

      // Look in away team
      const awayPlayer = matchData.awayTeam.players.find((p: any) => p.player.id === playerId);
      if (awayPlayer) return {
        name: awayPlayer.player.name,
        number: awayPlayer.player.number,
        isGoalkeeper: awayPlayer.player.isGoalkeeper
      };
    }

    if (teamData) {
      // Look in team players
      const teamPlayer = teamData.players.find((p: any) => p.player.id === playerId);
      if (teamPlayer) return {
        name: teamPlayer.player.name,
        number: teamPlayer.player.number,
        isGoalkeeper: teamPlayer.player.isGoalkeeper
      };
    }

    // Fallback to event data (we might not have isGoalkeeper here if it's not in event)
    const event = events.find(e => e.playerId === playerId);
    return { name: event?.playerName || 'Unknown', number: event?.playerNumber || 0 };
  };

  // Calculate baselines if comparison is enabled
  const playerBaselines = usePlayerBaselines(
    showComparison ? events : [],
    teamId
  );

  const opponentTeamId = matchData
    ? (selectedTeamId === matchData.homeTeamId ? matchData.awayTeamId : matchData.homeTeamId)
    : null;

  // Apply all filters for both own team (selected) and opponent (for fouls)
  const { filteredEvents, filteredFoulEvents } = useMemo(() => {
    const passesFilters = (e: MatchEvent, teamIdConstraint: string | null) => {
      if (context === 'match' && teamIdConstraint && e.teamId !== teamIdConstraint) return false;
      if (filterZone && e.zone !== filterZone) return false;

      // Player filter with goalkeeper support
      if (filterPlayer) {
        const playerInfo = getPlayerInfo(filterPlayer);

        if (playerInfo.isGoalkeeper) {
          if (e.activeGoalkeeperId !== filterPlayer) return false;
          if (e.category === 'Shot' && !['Goal', 'Save'].includes(e.action)) return false;
        } else {
          if (e.playerId !== filterPlayer) return false;
        }
      }

      if (filterOpposition !== null && (e.hasOpposition ?? e.context?.hasOpposition) !== filterOpposition) return false;
      if (filterCollective !== null && (e.isCollective ?? e.context?.isCollective) !== filterCollective) return false;
      if (filterCounterAttack !== null && (e.isCounterAttack ?? e.context?.isCounterAttack) !== filterCounterAttack) return false;
      return true;
    };

    const own = events.filter(e => passesFilters(e, selectedTeamId || null));
    const rival = opponentTeamId ? events.filter(e => passesFilters(e, opponentTeamId)) : [];

    return { filteredEvents: own, filteredFoulEvents: rival };
  }, [events, context, selectedTeamId, opponentTeamId, filterZone, filterPlayer, filterOpposition, filterCollective, filterCounterAttack, getPlayerInfo]);

  // Determine if we're viewing goalkeeper statistics
  const isGoalkeeperView = useMemo(() => {
    if (filterPlayer) {
      // If filtering by specific player, check if they're a goalkeeper
      return getPlayerInfo(filterPlayer).isGoalkeeper || false;
    }
    if (context === 'player' && events.length > 0) {
      // If in player context, check the first event to see if it's a goalkeeper event
      // (events are already filtered to be goalkeeper events if the player is a GK)
      const firstEvent = events[0];
      if (firstEvent.activeGoalkeeperId) {
        // If events have activeGoalkeeperId set, this is a goalkeeper view
        return true;
      }
    }
    return false;
  }, [filterPlayer, context, events]);

  const handleZoneFilter = (zone: ZoneType | '7m' | null) => {
    setFilterZone(zone);
  };

  const handlePlayerClick = (playerId: string | null) => {
    // Don't apply filter in player context (already viewing single player)
    if (context === 'player') return;

    setFilterPlayer(playerId);
    onPlayerClick?.(playerId);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      {title && (
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      )}

      {/* Header Actions (Team Switcher & Back) */}
      {(context === 'match' && matchData) || onBack ? (
        <div className="flex items-center w-full">
          {/* Team Switcher */}
          {context === 'match' && matchData && (
            <div className="flex items-center gap-2 mr-auto">
              <span className="text-sm text-gray-600">Viewing:</span>
              <span className="font-semibold text-gray-900">
                {selectedTeamId === matchData.homeTeamId ? formatTeamDisplay(matchData.homeTeam) : formatTeamDisplay(matchData.awayTeam)}
              </span>
              <button
                onClick={() => handleTeamSwitch(
                  selectedTeamId === matchData.homeTeamId ? matchData.awayTeamId : matchData.homeTeamId
                )}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Switch to {selectedTeamId === matchData.homeTeamId ? formatTeamDisplay(matchData.awayTeam) : formatTeamDisplay(matchData.homeTeam)}
              </button>
            </div>
          )}

          {/* Back Button */}
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm ml-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
          )}
        </div>
      ) : null}

      {/* Filters Bar */}
      <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
        {/* Context Filters (includes FILTERS: label) */}
        <FiltersBar
          filterOpposition={filterOpposition}
          filterCollective={filterCollective}
          filterCounterAttack={filterCounterAttack}
          setFilterOpposition={setFilterOpposition}
          setFilterCollective={setFilterCollective}
          setFilterCounterAttack={setFilterCounterAttack}
        />

        {/* Player Filter Badge */}
        {filterPlayer && (
          <button
            onClick={() => handlePlayerClick(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
          >
            <Users size={14} />
            {events.find(e => e.playerId === filterPlayer)?.playerName || 'Player'}
            <X size={14} />
          </button>
        )}

        {/* Zone Filter Badge */}
        {filterZone && (
          <button
            onClick={() => setFilterZone(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium"
          >
            <Filter size={14} />
            {filterZone}
            <X size={14} />
          </button>
        )}
      </div>

      {/* Statistics Panel (Cards + Heatmap + Zones) */}
      <StatisticsPanel
        data={{
          events: filteredEvents,
          foulEvents: filteredFoulEvents,
          title: '',
          context,
          isGoalkeeper: isGoalkeeperView,
        }}
        comparison={showComparison ? { playerAverages: playerBaselines } : undefined}
        onZoneFilter={handleZoneFilter}
      />

      {/* Player Statistics Table */}
      <PlayerStatisticsTable
        events={filteredEvents}
        onPlayerClick={handlePlayerClick}
        selectedPlayerId={filterPlayer}
        subtitle={filterZone ? `(from ${filterZone})` : subtitle || '(Overall)'}
        getPlayerInfo={matchData || teamData ? getPlayerInfo : undefined}
      />
    </div>
  );
}
