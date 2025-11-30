import { Users } from 'lucide-react';
import { useMemo } from 'react';
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
}

export function PlayerStatisticsTable({
  events,
  onPlayerClick,
  selectedPlayerId,
  subtitle = '(Overall)',
  getPlayerInfo
}: PlayerStatisticsTableProps) {

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

      // Count sanctions
      if (e.category === 'Sanction' || e.category === 'Foul') {
        if (e.action === 'Yellow') stat.yellowCards++;
        else if (e.action === '2min') stat.twoMinutes++;
        else if (e.action === 'Red') stat.redCards++;
        else if (e.action === 'Blue') stat.blueCards++;
      }
    });

    // Sort by total goals descending
    return Array.from(statsMap.values()).sort((a, b) => b.totalGoals - a.totalGoals);
  }, [events]);

  const handlePlayerClick = (playerId: string) => {
    if (onPlayerClick) {
      onPlayerClick(selectedPlayerId === playerId ? null : playerId);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Users className="text-green-600" />
        Player Statistics {subtitle}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b-2 border-gray-300 text-gray-600 text-xs uppercase">
              <th className="pb-3 font-semibold">Player</th>
              <th className="pb-3 font-semibold text-center">Total</th>
              <th className="pb-3 font-semibold text-center bg-blue-50 px-2">6m Goals</th>
              <th className="pb-3 font-semibold text-center bg-blue-50 px-2">6m Eff%</th>
              <th className="pb-3 font-semibold text-center bg-indigo-50 px-2">9m Goals</th>
              <th className="pb-3 font-semibold text-center bg-indigo-50 px-2">9m Eff%</th>
              <th className="pb-3 font-semibold text-center bg-purple-50 px-2">7m Goals</th>
              <th className="pb-3 font-semibold text-center bg-purple-50 px-2">7m Eff%</th>
              <th className="pb-3 font-semibold text-center bg-orange-50 px-2">With Opp</th>
              <th className="pb-3 font-semibold text-center bg-orange-50 px-2">No Opp</th>
              <th className="pb-3 font-semibold text-center bg-purple-50 px-2">Collective</th>
              <th className="pb-3 font-semibold text-center bg-purple-50 px-2">Individual</th>
              <th className="pb-3 font-semibold text-center bg-cyan-50 px-2">Counter</th>
              <th className="pb-3 font-semibold text-center bg-cyan-50 px-2">Static</th>
              <th className="pb-3 font-semibold text-center bg-red-50 px-2">Turnovers</th>
              <th className="pb-3 font-semibold text-center bg-yellow-50 px-2">2m</th>
              <th className="pb-3 font-semibold text-center bg-yellow-50 px-2">YC</th>
              <th className="pb-3 font-semibold text-center bg-red-100 px-2">RC</th>
              <th className="pb-3 font-semibold text-center bg-blue-100 px-2">BC</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {playerStats.map(stat => {
              const efficiency6m = stat.shots6m > 0 ? Math.round((stat.goals6m / stat.shots6m) * 100) : 0;
              const efficiency9m = stat.shots9m > 0 ? Math.round((stat.goals9m / stat.shots9m) * 100) : 0;
              const efficiency7m = stat.shots7m > 0 ? Math.round((stat.goals7m / stat.shots7m) * 100) : 0;
              const isSelected = selectedPlayerId === stat.id;

              return (
                <tr
                  key={stat.id}
                  onClick={() => handlePlayerClick(stat.id)}
                  className={`cursor-pointer transition-colors ${isSelected
                    ? 'bg-green-50 hover:bg-green-100 font-semibold'
                    : 'hover:bg-gray-50'
                    }`}
                >
                  {/* Player name and number */}
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold">
                        {stat.number}
                      </div>
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

                  {/* Sanctions */}
                  <td className="py-3 text-center bg-yellow-50 px-2">
                    <span className="font-mono font-bold text-yellow-600">{stat.twoMinutes > 0 ? stat.twoMinutes : '-'}</span>
                  </td>
                  <td className="py-3 text-center bg-yellow-50 px-2">
                    <span className="font-mono font-bold text-yellow-600">{stat.yellowCards > 0 ? stat.yellowCards : '-'}</span>
                  </td>
                  <td className="py-3 text-center bg-red-100 px-2">
                    <span className="font-mono font-bold text-red-600">{stat.redCards > 0 ? stat.redCards : '-'}</span>
                  </td>
                  <td className="py-3 text-center bg-blue-100 px-2">
                    <span className="font-mono font-bold text-blue-600">{stat.blueCards > 0 ? stat.blueCards : '-'}</span>
                  </td>
                </tr>
              );
            })}
            {playerStats.length === 0 && (
              <tr>
                <td colSpan={15} className="py-8 text-center text-gray-400 italic">
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
