import { useState, useMemo } from 'react';
import { Users, Filter, X } from 'lucide-react';
import type { MatchEvent, ZoneType } from '../../types';
import { StatisticsPanel } from './StatisticsPanel';
import { PlayerStatisticsTable } from './PlayerStatisticsTable';
import { FiltersBar } from './FiltersBar';
import { usePlayerBaselines } from './hooks/usePlayerBaselines';

interface StatisticsViewProps {
  events: MatchEvent[];
  title?: string;
  subtitle?: string;
  context: 'match' | 'player' | 'team';
  onPlayerClick?: (playerId: string | null) => void;
  selectedPlayerId?: string | null;
  showComparison?: boolean;
  teamId?: string | null;
  matchData?: {
    homeTeam: { id: string; name: string; players: any[] };
    awayTeam: { id: string; name: string; players: any[] };
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
  const getPlayerInfo = (playerId: string): { name: string; number: number } => {
    if (matchData) {
      // Look in home team
      const homePlayer = matchData.homeTeam.players.find((p: any) => p.player.id === playerId);
      if (homePlayer) return { name: homePlayer.player.name, number: homePlayer.player.number };

      // Look in away team
      const awayPlayer = matchData.awayTeam.players.find((p: any) => p.player.id === playerId);
      if (awayPlayer) return { name: awayPlayer.player.name, number: awayPlayer.player.number };
    }

    if (teamData) {
      // Look in team players
      const teamPlayer = teamData.players.find((p: any) => p.player.id === playerId);
      if (teamPlayer) return { name: teamPlayer.player.name, number: teamPlayer.player.number };
    }

    // Fallback to event data
    const event = events.find(e => e.playerId === playerId);
    return { name: event?.playerName || 'Unknown', number: event?.playerNumber || 0 };
  };

  // Calculate baselines if comparison is enabled
  const playerBaselines = usePlayerBaselines(
    showComparison ? events : [],
    teamId
  );

  // Apply all filters
  const filteredEvents = useMemo(() => {
    console.log('[StatisticsView] Filtering events:', {
      totalEvents: events.length,
      context,
      selectedTeamId,
      sampleEvent: events[0]
    });

    const filtered = events.filter(e => {
      // Filter by team in match context
      if (context === 'match' && selectedTeamId && e.teamId !== selectedTeamId) return false;
      if (filterZone && e.zone !== filterZone) return false;
      if (filterPlayer && e.playerId !== filterPlayer) return false;
      if (filterOpposition !== null && (e.hasOpposition ?? e.context?.hasOpposition) !== filterOpposition) return false;
      if (filterCollective !== null && (e.isCollective ?? e.context?.isCollective) !== filterCollective) return false;
      if (filterCounterAttack !== null && (e.isCounterAttack ?? e.context?.isCounterAttack) !== filterCounterAttack) return false;
      return true;
    });

    console.log('[StatisticsView] Filtered result:', { filteredCount: filtered.length });
    return filtered;
  }, [events, context, selectedTeamId, filterZone, filterPlayer, filterOpposition, filterCollective, filterCounterAttack]);

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
                {selectedTeamId === matchData.homeTeamId ? matchData.homeTeam.name : matchData.awayTeam.name}
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
                Switch to {selectedTeamId === matchData.homeTeamId ? matchData.awayTeam.name : matchData.homeTeam.name}
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
          title: '',
          context,
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
