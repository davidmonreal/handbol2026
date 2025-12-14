import { useState, useMemo } from 'react';
import { Users, Filter, X } from 'lucide-react';
import type { MatchEvent, ZoneType } from '../../types';
import type { StatisticsViewProps } from './types';
import { StatisticsPanel } from './StatisticsPanel';
import { PlayerStatisticsTable } from './PlayerStatisticsTable';
import { FiltersBar } from './FiltersBar';
import { usePlayerBaselines } from './hooks/usePlayerBaselines';
import { GoalFlowChart } from './GoalFlowChart';
import { usePlayWindow } from './hooks/usePlayWindow';
import { useStatisticsCalculator } from './hooks/useStatisticsCalculator';

const HALF_DURATION_SECONDS = 30 * 60;

export function StatisticsView({
  events,
  foulEvents,
  disableFoulToggle,
  title,
  subtitle,
  context,
  onPlayerClick,
  selectedPlayerId,
  showComparison = false,
  teamId,
  matchData,
  teamData,
  playerData,
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

    if (playerData && playerData.id === playerId) {
      return {
        name: playerData.name,
        number: playerData.number,
        isGoalkeeper: playerData.isGoalkeeper
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

  const selectedTeamData = matchData
    ? (selectedTeamId === matchData.homeTeamId ? matchData.homeTeam : matchData.awayTeam)
    : null;

  const opponentTeamData = matchData
    ? (selectedTeamId === matchData.homeTeamId ? matchData.awayTeam : matchData.homeTeam)
    : null;

  const selectedTeamName = selectedTeamData ? formatTeamDisplay(selectedTeamData) : 'Your team';
  const opponentTeamName = opponentTeamData ? formatTeamDisplay(opponentTeamData) : 'Rival';

  // Apply all filters for both own team (selected) and opponent (for fouls)
  const baseFoulEvents: MatchEvent[] = foulEvents || [];

  const { filteredEvents, filteredFoulEvents, filteredOpponentEvents } = useMemo(() => {
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
    const rival = opponentTeamId
      ? events.filter(e => passesFilters(e, opponentTeamId))
      : baseFoulEvents.filter(e => passesFilters(e, null));

    const opponentAll = opponentTeamId
      ? events.filter(e => passesFilters(e, opponentTeamId))
      : [];

    return { filteredEvents: own, filteredFoulEvents: rival, filteredOpponentEvents: opponentAll };
  }, [events, baseFoulEvents, context, selectedTeamId, opponentTeamId, filterZone, filterPlayer, filterOpposition, filterCollective, filterCounterAttack, getPlayerInfo]);

  // Determine if we're viewing goalkeeper statistics
  const isGoalkeeperView = useMemo(() => {
    // 1. If we have a specific player selected, check their role
    if (filterPlayer) {
      // First check official data source
      const info = getPlayerInfo(filterPlayer);
      if (info.isGoalkeeper) return true;

      // Fallback: Check if this player appears as an active goalkeeper in the events
      // (This handles cases where metadata might be missing but events are correct)
      const appearsAsGk = events.some(e => e.activeGoalkeeperId === filterPlayer);
      if (appearsAsGk) return true;
    }

    // 2. If in player context but no filter set (unlikely for single player view, but defensive)
    if (context === 'player' && events.length > 0) {
      // It's ambiguous which player is the "subject" if we don't have filterPlayer.
      // But if we assume the events are filtered for the subject:
      // If the events are SAVES, the subject is likely the GK (activeGoalkeeperId).
      // If the events are SHOTS (Goals/Misses/etc) by the subject, the subject is playerId.

      const firstEvent = events[0];

      // Heuristic: If we have many SAVES, it's a GK view
      const saveCount = events.filter(e => e.action === 'Save').length;
      if (saveCount > 0 && saveCount > events.length / 3) return true;

      // Existing heuristic fallback (checks playerId, which is SHOOTER in saves, so this tends to false for GKs)
      if (firstEvent.playerId) {
        return getPlayerInfo(firstEvent.playerId).isGoalkeeper || false;
      }
    }
    return false;
  }, [filterPlayer, context, events, getPlayerInfo]);

  const handleZoneFilter = (zone: ZoneType | '7m' | null) => {
    setFilterZone(zone);
  };

  // Play window filter (by recency in current filteredEvents)
  const { options: playWindowOptions, selected: selectedPlayWindow, setSelected: setSelectedPlayWindow, filteredEvents: playWindowEvents } = usePlayWindow(filteredEvents);

  const handlePlayerClick = (playerId: string | null) => {
    // Don't apply filter in player context (already viewing single player)
    if (context === 'player') return;

    setFilterPlayer(playerId);
    onPlayerClick?.(playerId);
  };

  // Calculate stats for the table using the shared calculator
  const { playerStats } = useStatisticsCalculator(
    playWindowEvents,
    showComparison ? { playerAverages: playerBaselines } : undefined,
    isGoalkeeperView,
    undefined, // No separate foul events needed for player table (it uses events for everything)
    getPlayerInfo,
    filteredOpponentEvents // Pass opponent events to calculate correct GK stats (Saves/Conceded)
  );

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
            <div className="flex items-center gap-3 mr-auto">
              <button
                onClick={() => handleTeamSwitch(
                  selectedTeamId === matchData.homeTeamId ? matchData.awayTeamId : matchData.homeTeamId
                )}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-800 rounded-lg border border-indigo-200 hover:bg-indigo-200 transition-colors text-sm"
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
          playWindowOptions={playWindowOptions}
          selectedPlayWindow={selectedPlayWindow}
          onPlayWindowChange={setSelectedPlayWindow}
        />

        {/* Player Filter Badge */}
        {/* 
          Only show the filter badge if we are NOT in a single-player context.
          If context is 'player', the view is already dedicated to that player, 
          so showing a removable filter badge is redundant and confusing.
        */}
        {filterPlayer && context !== 'player' && (
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
          events: playWindowEvents,
          foulEvents: filteredFoulEvents,
          title: '',
          context,
          isGoalkeeper: isGoalkeeperView,
        }}
        disableFoulToggle={disableFoulToggle ?? !!filterPlayer}
        comparison={showComparison ? { playerAverages: playerBaselines } : undefined}
        onZoneFilter={handleZoneFilter}
      />

      {/* Player Statistics Table */}
      <div className="hidden md:block">
        <PlayerStatisticsTable
          stats={playerStats}
          onPlayerClick={handlePlayerClick}
          selectedPlayerId={filterPlayer}
          subtitle={filterZone ? `(from ${filterZone})` : subtitle || '(Overall)'}
        />
      </div>

      {/* Goal flow chart - only for match context */}
      {context === 'match' && selectedTeamId && opponentTeamId && (
        <div className="hidden md:block">
          <GoalFlowChart
            events={[...filteredEvents, ...filteredOpponentEvents]}
            selectedTeamId={selectedTeamId}
            opponentTeamId={opponentTeamId}
            secondHalfMarkSeconds={HALF_DURATION_SECONDS}
            teamName={selectedTeamName}
            opponentName={opponentTeamName}
          />
        </div>
      )}
    </div>
  );
}
