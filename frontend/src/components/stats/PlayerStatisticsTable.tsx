import { Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { MatchEvent } from '../../types';

interface PlayerStatisticsTableProps {
  events: MatchEvent[];
  onPlayerClick?: (playerId: string | null) => void;
  selectedPlayerId?: string | null;
  subtitle?: string;
  getPlayerInfo?: (playerId: string) => { name: string; number: number };
}

interface PlayerStat {
  id: string;
  name: string;
  number: number;
  totalShots: number;
  totalGoals: number;
  shots6m: number;
  goals6m: number;
  shots9m: number;
  goals9m: number;
  shots7m: number;
  goals7m: number;
  shotsWithOpp: number;
  goalsWithOpp: number;
  shotsNoOpp: number;
  goalsNoOpp: number;
  shotsCollective: number;
  goalsCollective: number;
  shotsIndividual: number;
  goalsIndividual: number;
  shotsCounter: number;
  goalsCounter: number;
  shotsStatic: number;
  goalsStatic: number;
  turnovers: number;
  yellowCards: number;
  twoMinutes: number;
  redCards: number;
  blueCards: number;
  commonFouls: number;
}

type SortKey = keyof PlayerStat | 'foulsRec' | 'eff6m' | 'eff9m' | 'eff7m';

interface SortConfig {
  key: SortKey;
  direction: 'asc' | 'desc';
}

export function PlayerStatisticsTable({
  events,
  onPlayerClick,
  selectedPlayerId,
  subtitle = '(Overall)',
  getPlayerInfo
}: PlayerStatisticsTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'totalGoals', direction: 'desc' });

  const playerStats = useMemo(() => {
    const statsMap = new Map<string, PlayerStat>();

    events.forEach(e => {
      if (!e.playerId) return;

      if (!statsMap.has(e.playerId)) {
        // Get player info (use provided function or fallback to event data)
        const playerInfo = getPlayerInfo
          ? getPlayerInfo(e.playerId)
          : { name: e.playerName || 'Unknown', number: e.playerNumber || 0 };

        statsMap.set(e.playerId, {
          id: e.playerId,
          name: playerInfo.name,
          number: playerInfo.number,
          totalShots: 0,
          totalGoals: 0,
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
        });
      }

      const stat = statsMap.get(e.playerId)!;

      // Count shots and goals
      if (e.category === 'Shot') {
        stat.totalShots++;
        if (e.action === 'Goal') stat.totalGoals++;

        // Zone-based stats
        if (e.zone?.startsWith('6m')) {
          stat.shots6m++;
          if (e.action === 'Goal') stat.goals6m++;
        } else if (e.zone?.startsWith('9m')) {
          stat.shots9m++;
          if (e.action === 'Goal') stat.goals9m++;
        } else if (e.zone === '7m') {
          stat.shots7m++;
          if (e.action === 'Goal') stat.goals7m++;
        }

        // Context-based stats
        if (e.context?.hasOpposition) {
          stat.shotsWithOpp++;
          if (e.action === 'Goal') stat.goalsWithOpp++;
        } else if (e.context?.hasOpposition === false) {
          stat.shotsNoOpp++;
          if (e.action === 'Goal') stat.goalsNoOpp++;
        }

        if (e.context?.isCollective) {
          stat.shotsCollective++;
          if (e.action === 'Goal') stat.goalsCollective++;
        } else if (e.context?.isCollective === false) {
          stat.shotsIndividual++;
          if (e.action === 'Goal') stat.goalsIndividual++;
        }

        if (e.context?.isCounterAttack) {
          stat.shotsCounter++;
          if (e.action === 'Goal') stat.goalsCounter++;
        } else if (e.context?.isCounterAttack === false) {
          stat.shotsStatic++;
          if (e.action === 'Goal') stat.goalsStatic++;
        }
      }

      // Count turnovers
      if (e.category === 'Turnover') {
        stat.turnovers++;
      }

      // Count sanctions and fouls
      if (e.category === 'Sanction' || e.category === 'Foul') {
        if (e.action === 'Yellow') stat.yellowCards++;
        else if (e.action === '2min') stat.twoMinutes++;
        else if (e.action === 'Red') stat.redCards++;
        else if (e.action === 'Blue') stat.blueCards++;
        // Assuming any other action in 'Foul' category or specific 'Foul' action counts as common foul
        // Adjust condition based on exact data shape if needed. 
        // Typically 'Foul' category has action 'Foul' or 'Offensive Foul' etc.
        // If it's NOT a sanction action, we count it as common foul.
        else stat.commonFouls++;
      }
    });

    return Array.from(statsMap.values());
  }, [events]);

  const sortedPlayerStats = useMemo(() => {
    const sorted = [...playerStats];
    return sorted.sort((a, b) => {
      let aValue: number | string = 0;
      let bValue: number | string = 0;

      switch (sortConfig.key) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
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
          aValue = a[sortConfig.key as keyof PlayerStat] as number;
          bValue = b[sortConfig.key as keyof PlayerStat] as number;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [playerStats, sortConfig]);

  // Calculate totals across all displayed players
  const totals = useMemo(() => {
    if (playerStats.length === 0) return null;

    const initialTotal: PlayerStat = {
      id: 'total',
      name: 'Total',
      number: 0,
      totalShots: 0,
      totalGoals: 0,
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
    };

    return playerStats.reduce((acc, curr) => {
      acc.totalShots += curr.totalShots;
      acc.totalGoals += curr.totalGoals;
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

  const handlePlayerClick = (playerId: string) => {
    if (onPlayerClick) {
      onPlayerClick(selectedPlayerId === playerId ? null : playerId);
    }
  };

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

  const renderRow = (stat: PlayerStat, isTotalRow: boolean = false) => {
    const efficiency6m = stat.shots6m > 0 ? Math.round((stat.goals6m / stat.shots6m) * 100) : 0;
    const efficiency9m = stat.shots9m > 0 ? Math.round((stat.goals9m / stat.shots9m) * 100) : 0;
    const efficiency7m = stat.shots7m > 0 ? Math.round((stat.goals7m / stat.shots7m) * 100) : 0;
    const isSelected = selectedPlayerId === stat.id && !isTotalRow;
    const totalFouls = stat.twoMinutes + stat.yellowCards + stat.redCards + stat.blueCards + stat.commonFouls;

    return (
      <tr
        key={stat.id}
        onClick={() => !isTotalRow && handlePlayerClick(stat.id)}
        className={`${isTotalRow
          ? 'bg-gray-100 font-bold border-b-2 border-gray-300'
          : `cursor-pointer ${isSelected
            ? 'bg-green-50 hover:bg-green-100 font-semibold'
            : 'hover:bg-gray-50'
          }`
          }`}
      >
        {/* Player name and number */}
        <td className="py-3 pl-3">
          <div className="flex items-center gap-2">
            {!isTotalRow && (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold">
                {stat.number}
              </div>
            )}
            <span className={isSelected ? 'text-green-700' : ''}>{stat.name}</span>
          </div>
        </td>

        {/* Total */}
        <td className="py-3 text-center font-mono">
          <div className="font-bold">{stat.totalGoals}/{stat.totalShots}</div>
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
        Player Statistics {subtitle}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b-2 border-gray-300 text-gray-600 text-xs uppercase">
              {renderSortableHeader('Player', 'name', 'left', 'pl-3')}
              {renderSortableHeader('Total', 'totalGoals')}
              {renderSortableHeader('6m Goals', 'goals6m', 'center', 'bg-blue-50 px-2')}
              {renderSortableHeader('6m Eff%', 'eff6m', 'center', 'bg-blue-50 px-2')}
              {renderSortableHeader('9m Goals', 'goals9m', 'center', 'bg-indigo-50 px-2')}
              {renderSortableHeader('9m Eff%', 'eff9m', 'center', 'bg-indigo-50 px-2')}
              {renderSortableHeader('7m Goals', 'goals7m', 'center', 'bg-purple-50 px-2')}
              {renderSortableHeader('7m Eff%', 'eff7m', 'center', 'bg-purple-50 px-2')}
              {renderSortableHeader('With Opp', 'goalsWithOpp', 'center', 'bg-orange-50 px-2')}
              {renderSortableHeader('No Opp', 'goalsNoOpp', 'center', 'bg-orange-50 px-2')}
              {renderSortableHeader('Collective', 'goalsCollective', 'center', 'bg-purple-50 px-2')}
              {renderSortableHeader('Individual', 'goalsIndividual', 'center', 'bg-purple-50 px-2')}
              {renderSortableHeader('Counter', 'goalsCounter', 'center', 'bg-cyan-50 px-2')}
              {renderSortableHeader('Static', 'goalsStatic', 'center', 'bg-cyan-50 px-2')}
              {renderSortableHeader('Turnovers', 'turnovers', 'center', 'bg-red-50 px-2')}
              {renderSortableHeader('Fouls Rec.', 'foulsRec', 'center', 'bg-yellow-50 px-2')}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {totals && renderRow(totals, true)}
            {sortedPlayerStats.map(stat => renderRow(stat, false))}
            {sortedPlayerStats.length === 0 && (
              <tr>
                <td colSpan={16} className="py-8 text-center text-gray-400 italic">
                  No player data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
