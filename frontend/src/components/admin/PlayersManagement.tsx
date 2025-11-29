import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';

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
    </div>
  );
};
