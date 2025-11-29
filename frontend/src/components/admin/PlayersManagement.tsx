import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, BarChart3, X } from 'lucide-react';
import { REVERSE_GOAL_TARGET_MAP } from '../../config/constants';
import { ZONE_CONFIG } from '../../config/zones';

interface Player {
  id: string;
  name: string;
  number: number;
  handedness: string;
  teams?: {
    team: {
      club: {
        name: string;
      }
    }
  }[];
}

export const PlayersManagement = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    number: '', 
    handedness: 'RIGHT' 
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [selectedPlayerForStats, setSelectedPlayerForStats] = useState<Player | null>(null);
  const [playerStats, setPlayerStats] = useState<any>(null);

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/players');
      const data = await response.json();
      console.log('Players API response:', data);
      
      if (Array.isArray(data)) {
        setPlayers(data);
      } else {
        console.error('Expected array of players but got:', data);
        setPlayers([]);
        if (data.error) {
          setError(data.error);
        }
      }
    } catch (error) {
      console.error('Error fetching players:', error);
      setError('Failed to connect to the server. Please ensure the backend is running.');
      setPlayers([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      const url = editingPlayer 
        ? `http://localhost:3000/api/players/${editingPlayer.id}`
        : 'http://localhost:3000/api/players';
        
      const method = editingPlayer ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save player');
      }
      
      fetchPlayers();
      handleCancel();
    } catch (error) {
      console.error('Error saving player:', error);
      setError(error instanceof Error ? error.message : 'Failed to save player. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this player?')) return;
    
    try {
      const response = await fetch(`http://localhost:3000/api/players/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete player');
      fetchPlayers();
    } catch (error) {
      console.error('Error deleting player:', error);
      setError('Failed to delete player. Please try again.');
    }
  };

  const handleEdit = (player: Player) => {
    setEditingPlayer(player);
    setFormData({ 
      name: player.name,
      number: player.number.toString(),
      handedness: player.handedness
    });
    setIsFormOpen(true);
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingPlayer(null);
    setFormData({ name: '', number: '', handedness: 'RIGHT' });
    setError(null);
  };

  const fetchPlayerStats = async (playerId: string) => {
    try {
      // Fetch all game events for this player
      const response = await fetch(`http://localhost:3000/api/game-events`);
      const allEvents = await response.json();
      
      // Helper function to convert goalZone to goalTarget (1-9)
      const goalZoneToTarget = (zone: string | null): number | undefined => {
        if (!zone) return undefined;
        return REVERSE_GOAL_TARGET_MAP[zone];
      };

      // Helper function to convert position+distance to zone format
      const positionDistanceToZone = (position: string | null, distance: string | null): any => {
        if (!position || !distance) return undefined;
        
        // Map backend position+distance to frontend zone format
        if (distance === '7M') return '7m';
        
        const distancePrefix = distance === '6M' ? '6m' : '9m';
        return `${distancePrefix}-${position}` as any;
      };

      // Filter and transform events for this specific player
      const playerBackendEvents = allEvents.filter((e: any) => e.playerId === playerId);
      
      // Transform to frontend format (same as Statistics.tsx)
      const transformedEvents = playerBackendEvents.map((e: any) => ({
        id: e.id,
        timestamp: e.timestamp,
        playerId: e.playerId,
        playerName: e.player?.name,
        playerNumber: e.player?.number,
        teamId: e.teamId,
        category: e.type, // 'Shot', 'Turnover', 'Sanction'
        action: e.subtype || e.type, // 'Goal', 'Save', 'Miss', etc.
        zone: positionDistanceToZone(e.position, e.distance), // Convert position+distance to zone
        goalTarget: goalZoneToTarget(e.goalZone), // Convert goalZone to number 1-9
        context: {
          isCollective: e.isCollective,
          hasOpposition: e.hasOpposition,
          isCounterAttack: e.isCounterAttack,
        },
        defenseFormation: undefined,
      }));
      
      // Calculate statistics using transformed events
      const shots = transformedEvents.filter((e: any) => e.category === 'Shot');
      const goals = shots.filter((e: any) => e.action === 'Goal');
      const saves = shots.filter((e: any) => e.action === 'Save');
      const misses = shots.filter((e: any) => e.action === 'Miss');
      const posts = shots.filter((e: any) => e.action === 'Post');
      
      setPlayerStats({
        events: transformedEvents, // Store transformed events
        shots: shots.length,
        goals: goals.length,
        saves: saves.length,
        misses: misses.length,
        posts: posts.length,
        efficiency: shots.length > 0 ? ((goals.length / shots.length) * 100).toFixed(1) : '0'
      });
    } catch (error) {
      console.error('Error fetching player stats:', error);
      setPlayerStats(null);
    }
  };

  const handleViewStats = async (player: Player) => {
    setSelectedPlayerForStats(player);
    setIsStatsModalOpen(true);
    await fetchPlayerStats(player.id);
  };

  const filteredPlayers = players.filter(player => {
    const searchLower = searchTerm.toLowerCase();
    const clubName = player.teams?.[0]?.team?.club?.name || '';
    return (
      player.name.toLowerCase().includes(searchLower) ||
      player.number.toString().includes(searchLower) ||
      clubName.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Players Management</h1>
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={20} />
          New Player
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search players by name, number or club..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">
              {editingPlayer ? 'Edit Player' : 'New Player'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Player Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number
                  </label>
                  <input
                    type="number"
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                    placeholder="e.g. 7"
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Handedness
                  </label>
                  <select
                    value={formData.handedness}
                    onChange={(e) => setFormData({ ...formData, handedness: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="RIGHT">Right</option>
                    <option value="LEFT">Left</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : (editingPlayer ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Players Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Club(s)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Handedness
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredPlayers.map((player) => (
              <tr key={player.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {player.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  #{player.number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {player.teams && player.teams.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {Array.from(new Set(player.teams.map(t => t.team.club.name))).map(clubName => (
                        <span key={clubName} className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {clubName}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400 italic">No club</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {player.handedness}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleViewStats(player)}
                    className="text-green-600 hover:text-green-900 mr-4"
                    title="View Statistics"
                  >
                    <BarChart3 size={18} />
                  </button>
                  <button
                    onClick={() => handleEdit(player)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(player.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {players.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No players found. Create your first player!
          </div>
        )}
      </div>

      {/* Player Statistics Modal */}
      {isStatsModalOpen && selectedPlayerForStats && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {selectedPlayerForStats.name} - Statistics
                </h2>
                <p className="text-sm text-gray-500">#{selectedPlayerForStats.number} • All Time Stats</p>
              </div>
              <button
                onClick={() => {
                  setIsStatsModalOpen(false);
                  setSelectedPlayerForStats(null);
                  setPlayerStats(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {playerStats ? (
                <div className="space-y-6">
                  {/* Stats Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-sm text-blue-600 font-medium">Shots</div>
                      <div className="text-2xl font-bold text-blue-800">{playerStats.shots}</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-sm text-green-600 font-medium">Goals</div>
                      <div className="text-2xl font-bold text-green-800">{playerStats.goals}</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="text-sm text-purple-600 font-medium">Efficiency</div>
                      <div className="text-2xl font-bold text-purple-800">{playerStats.efficiency}%</div>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <div className="text-sm text-yellow-600 font-medium">Saves</div>
                      <div className="text-2xl font-bold text-yellow-800">{playerStats.saves}</div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4">
                      <div className="text-sm text-orange-600 font-medium">Misses</div>
                      <div className="text-2xl font-bold text-orange-800">{playerStats.misses}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 font-medium">Posts</div>
                      <div className="text-2xl font-bold text-gray-800">{playerStats.posts}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Goal Heatmap */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-4">Goal Distribution (Target Zones)</h3>
                      <div className="grid grid-cols-3 grid-rows-3 gap-1 h-64 relative">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(target => {
                          const goals = playerStats.events.filter((e: any) => 
                            e.category === 'Shot' && 
                            e.action === 'Goal' && 
                            e.goalTarget === target
                          ).length;
                          
                          const shots = playerStats.events.filter((e: any) => 
                            e.category === 'Shot' && 
                            e.goalTarget === target
                          ).length;
                          
                          const efficiency = shots > 0 ? (goals / shots) * 100 : 0;
                          const bgOpacity = Math.min(efficiency / 100, 0.8);
                          
                          return (
                            <div
                              key={target}
                              className="border-2 border-gray-300 rounded-lg flex flex-col items-center justify-center relative"
                              style={{
                                backgroundColor: `rgba(34, 197, 94, ${bgOpacity})`
                              }}
                            >
                              <span className="text-2xl font-bold text-gray-800">{goals}</span>
                              <span className="text-xs text-gray-600">{shots > 0 ? `${efficiency.toFixed(0)}%` : '-'}</span>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-xs text-gray-500 mt-2 text-center">Goal view (shooter perspective)</p>
                    </div>

                    {/* Zone Distribution (Court Zones) */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-4">Shot Distribution (Court Zones)</h3>
                      <div className="space-y-3">
                        {/* 6m Line */}
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-2">6 METRE LINE</p>
                          <div className="grid grid-cols-5 gap-2">
                            {ZONE_CONFIG.sixMeter.map(({ zone, label }) => {
                              const zoneShots = playerStats.events.filter((e: any) => 
                                e.category === 'Shot' && e.zone === zone
                              );
                              const zoneGoals = zoneShots.filter((e: any) => e.action === 'Goal');
                              const efficiency = zoneShots.length > 0 ? (zoneGoals.length / zoneShots.length) * 100 : 0;
                              const percentage = playerStats.shots > 0 ? Math.round((zoneShots.length / playerStats.shots) * 100) : 0;
                              
                              return (
                                <div
                                  key={zone}
                                  className="p-3 rounded-lg border-2 border-gray-200 bg-gray-50 flex flex-col items-center"
                                >
                                  <span className="text-xs font-bold text-gray-500 mb-1">{label}</span>
                                  <span className="text-xl font-bold text-gray-800">{percentage}%</span>
                                  <span className="text-xs text-gray-400">({zoneShots.length})</span>
                                  {zoneShots.length > 0 && (
                                    <span className="text-xs text-green-600 mt-1">{efficiency.toFixed(0)}% eff</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* 9m Line */}
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-2">9 METRE LINE</p>
                          <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
                            {ZONE_CONFIG.nineMeter.map(({ zone, label }) => {
                              const zoneShots = playerStats.events.filter((e: any) => 
                                e.category === 'Shot' && e.zone === zone
                              );
                              const zoneGoals = zoneShots.filter((e: any) => e.action === 'Goal');
                              const efficiency = zoneShots.length > 0 ? (zoneGoals.length / zoneShots.length) * 100 : 0;
                              const percentage = playerStats.shots > 0 ? Math.round((zoneShots.length / playerStats.shots) * 100) : 0;
                              
                              return (
                                <div
                                  key={zone}
                                  className="p-3 rounded-lg border-2 border-gray-200 bg-gray-50 flex flex-col items-center"
                                >
                                  <span className="text-xs font-bold text-gray-500 mb-1">{label}</span>
                                  <span className="text-xl font-bold text-gray-800">{percentage}%</span>
                                  <span className="text-xs text-gray-400">({zoneShots.length})</span>
                                  {zoneShots.length > 0 && (
                                    <span className="text-xs text-green-600 mt-1">{efficiency.toFixed(0)}% eff</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* 7m Penalty */}
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-2">PENALTY</p>
                          <div className="max-w-xs mx-auto">
                            {(() => {
                              const penaltyShots = playerStats.events.filter((e: any) => 
                                e.category === 'Shot' && e.zone === '7m'
                              );
                              const penaltyGoals = penaltyShots.filter((e: any) => e.action === 'Goal');
                              const efficiency = penaltyShots.length > 0 ? (penaltyGoals.length / penaltyShots.length) * 100 : 0;
                              const percentage = playerStats.shots > 0 ? Math.round((penaltyShots.length / playerStats.shots) * 100) : 0;
                              
                              return (
                                <div className="p-3 rounded-lg border-2 border-gray-200 bg-gray-50 flex flex-col items-center">
                                  <span className="text-xs font-bold text-gray-500 mb-1">{ZONE_CONFIG.penalty.label}</span>
                                  <span className="text-xl font-bold text-gray-800">{percentage}%</span>
                                  <span className="text-xs text-gray-400">({penaltyShots.length})</span>
                                  {penaltyShots.length > 0 && (
                                    <span className="text-xs text-green-600 mt-1">{efficiency.toFixed(0)}% eff</span>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Stats Table */}
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden">
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
                          <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">{playerStats.events.length}</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 text-sm text-gray-900">Total Shots</td>
                          <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">{playerStats.shots}</td>
                        </tr>
                        <tr className="bg-green-50">
                          <td className="px-6 py-4 text-sm font-semibold text-green-900">Goals</td>
                          <td className="px-6 py-4 text-sm text-green-900 text-right font-bold">{playerStats.goals}</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 text-sm text-gray-900">Goals vs Goalkeeper (Saves)</td>
                          <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">{playerStats.saves}</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 text-sm text-gray-900">Missed Shots</td>
                          <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">{playerStats.misses}</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 text-sm text-gray-900">Posts</td>
                          <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">{playerStats.posts}</td>
                        </tr>
                        <tr className="bg-purple-50">
                          <td className="px-6 py-4 text-sm font-semibold text-purple-900">Shooting Efficiency</td>
                          <td className="px-6 py-4 text-sm text-purple-900 text-right font-bold">{playerStats.efficiency}%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Loading statistics...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
