import { ArrowUp, ArrowDown } from 'lucide-react';
import type { StatsTableProps } from './types';

/**
 * StatsTable - Displays detailed statistics table
 * For match context: shows player-by-player breakdown with comparison arrows
 * For player/team context: shows aggregate statistics
 */
export function StatsTable({ stats, context, className = '' }: StatsTableProps) {
  if (context === 'match' && stats.playerStats.size > 0) {
    // Match view: show player-by-player breakdown
    const players = Array.from(stats.playerStats.values())
      .sort((a, b) => b.efficiency - a.efficiency); // Sort by efficiency desc

    return (
      <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Player</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Shots</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Goals</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Efficiency</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Saves</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Misses</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Posts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {players.map(player => (
              <tr key={player.playerId} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900">
                      {player.playerName || 'Unknown'}
                    </span>
                    {player.playerNumber && (
                      <span className="ml-2 text-sm text-gray-500">#{player.playerNumber}</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                  {player.shots}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold text-green-900">
                  {player.goals}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-sm font-semibold text-purple-900">
                      {player.efficiency.toFixed(1)}%
                    </span>
                    {player.comparison && player.comparison.delta !== 0 && (
                      <div className="flex items-center">
                        {player.comparison.delta > 0 ? (
                          <ArrowUp size={14} className="text-green-600" />
                        ) : (
                          <ArrowDown size={14} className="text-red-600" />
                        )}
                        <span className={`text-xs ml-0.5 ${
                          player.comparison.delta > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {Math.abs(player.comparison.delta).toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                  {player.saves}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                  {player.misses}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                  {player.posts}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Player or Team view: show aggregate statistics
  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statistic</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Value</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          <tr>
            <td className="px-6 py-4 text-sm text-gray-900">Total Events</td>
            <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">
              {stats.totalShots + stats.totalSaves + stats.totalMisses + stats.totalPosts}
            </td>
          </tr>
          <tr>
            <td className="px-6 py-4 text-sm text-gray-900">Total Shots</td>
            <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">{stats.totalShots}</td>
          </tr>
          <tr className="bg-green-50">
            <td className="px-6 py-4 text-sm font-semibold text-green-900">Goals</td>
            <td className="px-6 py-4 text-sm text-green-900 text-right font-bold">{stats.totalGoals}</td>
          </tr>
          <tr>
            <td className="px-6 py-4 text-sm text-gray-900">Goals vs Goalkeeper (Saves)</td>
            <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">{stats.totalSaves}</td>
          </tr>
          <tr>
            <td className="px-6 py-4 text-sm text-gray-900">Missed Shots</td>
            <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">{stats.totalMisses}</td>
          </tr>
          <tr>
            <td className="px-6 py-4 text-sm text-gray-900">Posts</td>
            <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">{stats.totalPosts}</td>
          </tr>
          <tr className="bg-purple-50">
            <td className="px-6 py-4 text-sm font-semibold text-purple-900">Shooting Efficiency</td>
            <td className="px-6 py-4 text-sm text-purple-900 text-right font-bold">
              {stats.efficiency.toFixed(1)}%
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
