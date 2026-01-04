import { Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { PlayerStatistics } from './types';
import { useSafeTranslation } from '../../context/LanguageContext';

interface PlayerStatisticsTableProps {
  stats: Map<string, PlayerStatistics>;
  onPlayerClick?: (playerId: string | null) => void;
  selectedPlayerId?: string | null;
  subtitle?: string;
}

type SortKey = keyof PlayerStatistics | 'foulsRec' | 'eff6m' | 'eff9m' | 'eff7m';

interface SortConfig {
  key: SortKey;
  direction: 'asc' | 'desc';
}

export function PlayerStatisticsTable({
  stats,
  onPlayerClick,
  selectedPlayerId,
  subtitle,
}: PlayerStatisticsTableProps) {
  const { t } = useSafeTranslation();
  const resolvedSubtitle = subtitle ?? t('stats.table.subtitle.overall');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'goals', direction: 'desc' });

  const playerStats = useMemo(() => {
    return Array.from(stats.values());
  }, [stats]);

  const sortedPlayerStats = useMemo(() => {
    const sorted = [...playerStats];
    return sorted.sort((a, b) => {
      let aValue: number | string = 0;
      let bValue: number | string = 0;

      switch (sortConfig.key) {
        case 'playerName':
          aValue = a.playerName || '';
          bValue = b.playerName || '';
          break;
        case 'foulsRec':
          aValue = a.twoMinutes + a.yellowCards + a.redCards + a.blueCards + a.commonFouls;
          bValue = b.twoMinutes + b.yellowCards + b.redCards + b.blueCards + b.commonFouls;
          break;
        case 'eff6m':
          aValue = a.shots6m > 0 ? a.goals6m / a.shots6m : -1;
          bValue = b.shots6m > 0 ? b.goals6m / b.shots6m : -1;
          break;
        case 'eff9m':
          aValue = a.shots9m > 0 ? a.goals9m / a.shots9m : -1;
          bValue = b.shots9m > 0 ? b.goals9m / b.shots9m : -1;
          break;
        case 'eff7m':
          aValue = a.shots7m > 0 ? a.goals7m / a.shots7m : -1;
          bValue = b.shots7m > 0 ? b.goals7m / b.shots7m : -1;
          break;
        default:
          aValue = (a[sortConfig.key as keyof PlayerStatistics] as number) || 0;
          bValue = (b[sortConfig.key as keyof PlayerStatistics] as number) || 0;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [playerStats, sortConfig]);

  // Calculate totals across all displayed players
  const totals = useMemo(() => {
    if (playerStats.length === 0) return null;

    const initialTotal: PlayerStatistics = {
      playerId: 'total',
      playerName: 'Total',
      playerNumber: 0,
      shots: 0,
      goals: 0,
      saves: 0,
      misses: 0,
      posts: 0,
      efficiency: 0,
      shots6m: 0,
      goals6m: 0,
      shots9m: 0,
      goals9m: 0,
      shots7m: 0,
      goals7m: 0,
      shotsWithOpp: 0,
      goalsWithOpp: 0,
      shotsNoOpp: 0,
      goalsNoOpp: 0,
      shotsCollective: 0,
      goalsCollective: 0,
      shotsIndividual: 0,
      goalsIndividual: 0,
      shotsCounter: 0,
      goalsCounter: 0,
      shotsStatic: 0,
      goalsStatic: 0,
      turnovers: 0,
      yellowCards: 0,
      twoMinutes: 0,
      redCards: 0,
      blueCards: 0,
      commonFouls: 0,
      goalsConceded: 0,
    };

    return playerStats.reduce((acc, curr) => {
      acc.shots += curr.shots;
      acc.goals += curr.goals;
      acc.saves += curr.saves;
      acc.goalsConceded += curr.goalsConceded;
      acc.shots6m += curr.shots6m;
      acc.goals6m += curr.goals6m;
      acc.shots9m += curr.shots9m;
      acc.goals9m += curr.goals9m;
      acc.shots7m += curr.shots7m;
      acc.goals7m += curr.goals7m;
      acc.shotsWithOpp += curr.shotsWithOpp;
      acc.goalsWithOpp += curr.goalsWithOpp;
      acc.shotsNoOpp += curr.shotsNoOpp;
      acc.goalsNoOpp += curr.goalsNoOpp;
      acc.shotsCollective += curr.shotsCollective;
      acc.goalsCollective += curr.goalsCollective;
      acc.shotsIndividual += curr.shotsIndividual;
      acc.goalsIndividual += curr.goalsIndividual;
      acc.shotsCounter += curr.shotsCounter;
      acc.goalsCounter += curr.goalsCounter;
      acc.shotsStatic += curr.shotsStatic;
      acc.goalsStatic += curr.goalsStatic;
      acc.turnovers += curr.turnovers;
      acc.yellowCards += curr.yellowCards;
      acc.twoMinutes += curr.twoMinutes;
      acc.redCards += curr.redCards;
      acc.blueCards += curr.blueCards;
      acc.commonFouls += curr.commonFouls;
      return acc;
    }, initialTotal);
  }, [playerStats]);

  // handlePlayerClick logic moved inline to tr onClick

  const handleSort = (key: SortKey) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const renderSortableHeader = (label: string, key: SortKey, align: 'left' | 'center' = 'center', className: string = '') => {
    const isActive = sortConfig.key === key;
    return (
      <th
        className={`pb-3 font-semibold ${align === 'center' ? 'text-center' : 'text-left'} cursor-pointer hover:bg-gray-50 ${className} ${isActive ? 'text-black' : ''}`}
        onClick={() => handleSort(key)}
      >
        {label}
      </th>
    );
  };

  const renderRow = (stat: PlayerStatistics, isTotalRow: boolean = false) => {
    const efficiency6m = stat.shots6m > 0 ? Math.round((stat.goals6m / stat.shots6m) * 100) : 0;
    const efficiency9m = stat.shots9m > 0 ? Math.round((stat.goals9m / stat.shots9m) * 100) : 0;
    const efficiency7m = stat.shots7m > 0 ? Math.round((stat.goals7m / stat.shots7m) * 100) : 0;
    const totalFouls = stat.twoMinutes + stat.yellowCards + stat.redCards + stat.blueCards + stat.commonFouls;

    return (
      <tr
        key={stat.playerId}
        onClick={() => !isTotalRow && onPlayerClick?.(stat.playerId === selectedPlayerId ? null : stat.playerId)}
        className={`
          border-b border-gray-100 last:border-0 transition-colors
          /* Total row gets distinct styling: bold, gray background, bottom border */
          ${isTotalRow ? 'bg-gray-100 font-bold border-b-2 border-gray-300' : 'hover:bg-gray-50 cursor-pointer'}
          /* Selected player highlighting (only for actual players, not total row) */
          ${!isTotalRow && stat.playerId === selectedPlayerId ? 'bg-blue-50 hover:bg-blue-100' : ''}
        `}
      >
        <td className="py-3 px-3">
          {isTotalRow ? (
            <span className="font-bold text-gray-900 uppercase tracking-wider pl-2">Total</span>
          ) : (
            <div className="flex items-center gap-3">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                ${stat.playerId === selectedPlayerId ? 'bg-blue-200 text-blue-800' : 'bg-gray-100 text-gray-600'}
              `}>
                {(() => {
                  if (!stat.playerName) return '-';
                  const parts = stat.playerName.split(' ').filter(Boolean);
                  const initials = parts.slice(0, 2).map(part => part[0].toUpperCase()).join('');
                  return initials || '-';
                })()}
              </div>
              <span className="font-medium text-gray-900 truncate max-w-[120px]" title={stat.playerName}>
                {(() => {
                  if (!stat.playerName) return 'Unknown';
                  const parts = stat.playerName.split(' ');
                  if (parts.length < 2) return stat.playerName;
                  return `${parts[0]} ${parts[1].charAt(0)}.`;
                })()}
              </span>
            </div>
          )}
        </td>

        {/* Total */}
        <td className="py-3 text-center font-mono">
          <div className="font-bold">{stat.goals}/{stat.shots}</div>
        </td>

        {/* 6m */}
        <td className="py-3 text-center bg-blue-50 px-2 font-mono">
          <div>{stat.goals6m}/{stat.shots6m}</div>
        </td>
        <td className="py-3 text-center bg-blue-50 px-2">
          {stat.shots6m > 0 ? (
            <span className={`font-bold ${efficiency6m >= 50 ? 'text-green-600' : 'text-red-600'}`}>
              {efficiency6m}%
            </span>
          ) : (
            <span className="text-gray-300 text-xs">-</span>
          )}
        </td>

        {/* 9m */}
        <td className="py-3 text-center bg-indigo-50 px-2 font-mono">
          <div>{stat.goals9m}/{stat.shots9m}</div>
        </td>
        <td className="py-3 text-center bg-indigo-50 px-2">
          {stat.shots9m > 0 ? (
            <span className={`font-bold ${efficiency9m >= 50 ? 'text-green-600' : 'text-red-600'}`}>
              {efficiency9m}%
            </span>
          ) : (
            <span className="text-gray-300 text-xs">-</span>
          )}
        </td>

        {/* 7m */}
        <td className="py-3 text-center bg-purple-50 px-2 font-mono">
          <div>{stat.goals7m}/{stat.shots7m}</div>
        </td>
        <td className="py-3 text-center bg-purple-50 px-2">
          {stat.shots7m > 0 ? (
            <span className={`font-bold ${efficiency7m >= 50 ? 'text-green-600' : 'text-red-600'}`}>
              {efficiency7m}%
            </span>
          ) : (
            <span className="text-gray-300 text-xs">-</span>
          )}
        </td>

        {/* Opposition */}
        <td className="py-3 text-center bg-orange-50 px-2 font-mono text-xs">
          {stat.shotsWithOpp > 0 && (
            <div className="flex flex-col items-center">
              <span className={`font-bold ${Math.round((stat.goalsWithOpp / stat.shotsWithOpp) * 100) >= 50
                ? 'text-green-600'
                : 'text-red-600'
                }`}>
                {Math.round((stat.goalsWithOpp / stat.shotsWithOpp) * 100)}%
              </span>
              <div>{stat.goalsWithOpp}/{stat.shotsWithOpp}</div>
            </div>
          )}
        </td>
        <td className="py-3 text-center bg-orange-50 px-2 font-mono text-xs">
          {stat.shotsNoOpp > 0 && (
            <div className="flex flex-col items-center">
              <span className={`font-bold ${Math.round((stat.goalsNoOpp / stat.shotsNoOpp) * 100) >= 50
                ? 'text-green-600'
                : 'text-red-600'
                }`}>
                {Math.round((stat.goalsNoOpp / stat.shotsNoOpp) * 100)}%
              </span>
              <div>{stat.goalsNoOpp}/{stat.shotsNoOpp}</div>
            </div>
          )}
        </td>

        {/* Collective/Individual */}
        <td className="py-3 text-center bg-purple-50 px-2 font-mono text-xs">
          {stat.shotsCollective > 0 && (
            <div className="flex flex-col items-center">
              <span className={`font-bold ${Math.round((stat.goalsCollective / stat.shotsCollective) * 100) >= 50
                ? 'text-green-600'
                : 'text-red-600'
                }`}>
                {Math.round((stat.goalsCollective / stat.shotsCollective) * 100)}%
              </span>
              <div>{stat.goalsCollective}/{stat.shotsCollective}</div>
            </div>
          )}
        </td>
        <td className="py-3 text-center bg-purple-50 px-2 font-mono text-xs">
          {stat.shotsIndividual > 0 && (
            <div className="flex flex-col items-center">
              <span className={`font-bold ${Math.round((stat.goalsIndividual / stat.shotsIndividual) * 100) >= 50
                ? 'text-green-600'
                : 'text-red-600'
                }`}>
                {Math.round((stat.goalsIndividual / stat.shotsIndividual) * 100)}%
              </span>
              <div>{stat.goalsIndividual}/{stat.shotsIndividual}</div>
            </div>
          )}
        </td>

        {/* Counter/Static */}
        <td className="py-3 text-center bg-cyan-50 px-2 font-mono text-xs">
          {stat.shotsCounter > 0 && (
            <div className="flex flex-col items-center">
              <span className={`font-bold ${Math.round((stat.goalsCounter / stat.shotsCounter) * 100) >= 50
                ? 'text-green-600'
                : 'text-red-600'
                }`}>
                {Math.round((stat.goalsCounter / stat.shotsCounter) * 100)}%
              </span>
              <div>{stat.goalsCounter}/{stat.shotsCounter}</div>
            </div>
          )}
        </td>
        <td className="py-3 text-center bg-cyan-50 px-2 font-mono text-xs">
          {stat.shotsStatic > 0 && (
            <div className="flex flex-col items-center">
              <span className={`font-bold ${Math.round((stat.goalsStatic / stat.shotsStatic) * 100) >= 50
                ? 'text-green-600'
                : 'text-red-600'
                }`}>
                {Math.round((stat.goalsStatic / stat.shotsStatic) * 100)}%
              </span>
              <div>{stat.goalsStatic}/{stat.shotsStatic}</div>
            </div>
          )}
        </td>

        {/* Turnovers */}
        <td className="py-3 text-center bg-red-50 px-2">
          <span className="font-mono font-bold text-red-600">{stat.turnovers}</span>
        </td>

        {/* Fouls (Sanctions Sum) */}
        <td className="py-3 text-center bg-yellow-50 px-2">
          <span className="font-mono font-bold text-yellow-600">
            {totalFouls > 0 ? totalFouls : '-'}
          </span>
        </td>
      </tr>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <h3 className="text-lg font-bold text-gray-800 p-6 flex items-center gap-2">
        <Users className="text-green-600" />
        {t('stats.table.title')} {resolvedSubtitle}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b-2 border-gray-300 text-gray-600 text-xs uppercase">
              {renderSortableHeader(t('stats.table.headers.player'), 'playerName', 'left', 'pl-3')}
              {renderSortableHeader(t('stats.table.headers.total'), 'goals')}
              {renderSortableHeader(t('stats.table.headers.goals6m'), 'goals6m', 'center', 'bg-blue-50 px-2')}
              {renderSortableHeader(t('stats.table.headers.eff6m'), 'eff6m', 'center', 'bg-blue-50 px-2')}
              {renderSortableHeader(t('stats.table.headers.goals9m'), 'goals9m', 'center', 'bg-indigo-50 px-2')}
              {renderSortableHeader(t('stats.table.headers.eff9m'), 'eff9m', 'center', 'bg-indigo-50 px-2')}
              {renderSortableHeader(t('stats.table.headers.goals7m'), 'goals7m', 'center', 'bg-purple-50 px-2')}
              {renderSortableHeader(t('stats.table.headers.eff7m'), 'eff7m', 'center', 'bg-purple-50 px-2')}
              {renderSortableHeader(t('stats.table.headers.withOpp'), 'goalsWithOpp', 'center', 'bg-orange-50 px-2')}
              {renderSortableHeader(t('stats.table.headers.noOpp'), 'goalsNoOpp', 'center', 'bg-orange-50 px-2')}
              {renderSortableHeader(t('stats.table.headers.collective'), 'goalsCollective', 'center', 'bg-purple-50 px-2')}
              {renderSortableHeader(t('stats.table.headers.individual'), 'goalsIndividual', 'center', 'bg-purple-50 px-2')}
              {renderSortableHeader(t('stats.table.headers.counter'), 'goalsCounter', 'center', 'bg-cyan-50 px-2')}
              {renderSortableHeader(t('stats.table.headers.static'), 'goalsStatic', 'center', 'bg-cyan-50 px-2')}
              {renderSortableHeader(t('stats.table.headers.turnovers'), 'turnovers', 'center', 'bg-red-50 px-2')}
              {renderSortableHeader(t('stats.table.headers.foulsRec'), 'foulsRec', 'center', 'bg-yellow-50 px-2')}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {/* 
              Only show Total row if there is more than one player.
              In single-player view, the "Total" row is identical to the player's row, making it redundant.
            */}
            {totals && playerStats.length > 1 && renderRow(totals, true)}
            {sortedPlayerStats.map(stat => renderRow(stat, false))}
            {sortedPlayerStats.length === 0 && (
              <tr>
                <td colSpan={16} className="py-8 text-center text-gray-400 italic">
                  {t('stats.table.empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
