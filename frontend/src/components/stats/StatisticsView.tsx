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
}: StatisticsViewProps) {
  // Filter state
  const [filterZone, setFilterZone] = useState<ZoneType | '7m' | null>(null);
  const [filterPlayer, setFilterPlayer] = useState<string | null>(selectedPlayerId || null);
  const [filterOpposition, setFilterOpposition] = useState<boolean | null>(null);
  const [filterCollective, setFilterCollective] = useState<boolean | null>(null);
  const [filterCounterAttack, setFilterCounterAttack] = useState<boolean | null>(null);

  // Calculate baselines if comparison is enabled
  const playerBaselines = usePlayerBaselines(
    showComparison ? events : [],
    teamId
  );

  // Apply all filters
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (filterZone && e.zone !== filterZone) return false;
      if (filterPlayer && e.playerId !== filterPlayer) return false;
      if (filterOpposition !== null && e.context?.hasOpposition !== filterOpposition) return false;
      if (filterCollective !== null && e.context?.isCollective !== filterCollective) return false;
      if (filterCounterAttack !== null && e.context?.isCounterAttack !== filterCounterAttack) return false;
      return true;
    });
  }, [events, filterZone, filterPlayer, filterOpposition, filterCollective, filterCounterAttack]);

  const handleZoneFilter = (zone: ZoneType | '7m' | null) => {
    setFilterZone(zone);
  };

  const handlePlayerClick = (playerId: string | null) => {
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

      {/* Filters Bar */}
      <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Filters:</span>
        
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
        
        {/* Context Filters */}
        <FiltersBar
          filterOpposition={filterOpposition}
          filterCollective={filterCollective}
          filterCounterAttack={filterCounterAttack}
          setFilterOpposition={setFilterOpposition}
          setFilterCollective={setFilterCollective}
          setFilterCounterAttack={setFilterCounterAttack}
        />
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
      />
    </div>
  );
}
