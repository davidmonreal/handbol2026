import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Users, Search, X, Star, BarChart3 } from 'lucide-react';

interface Team {
  id: string;
  name: string;
  category: string;
  clubId: string;
  seasonId: string;
  club: { id: string; name: string };
  season: { id: string; name: string };
  players: { player: Player; role: string }[];
  isMyTeam: boolean;
}

interface Club {
  id: string;
  name: string;
}

interface Season {
  id: string;
  name: string;
}

interface Player {
  id: string;
  name: string;
  number: number;
  handedness: string;
}

export const TeamsManagement = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPlayersModalOpen, setIsPlayersModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [selectedTeamForPlayers, setSelectedTeamForPlayers] = useState<Team | null>(null);




  const [formData, setFormData] = useState({
    name: '',
    category: 'SENIOR',
    clubId: '',
    seasonId: '',
    isMyTeam: false
  });

  const CATEGORIES = ['BENJAMI', 'ALEVI', 'INFANTIL', 'CADET', 'JUVENIL', 'SENIOR'];

  const [playerSearch, setPlayerSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchTeams();
    fetchClubs();
    fetchSeasons();
    fetchPlayers();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/teams');
      const data = await response.json();
      setTeams(data);
    } catch (error) {
      console.error('Error fetching teams:', error);
      setError('Failed to fetch teams');
    }
  };

  const fetchClubs = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/clubs');
      const data = await response.json();
      setClubs(data);
    } catch (error) {
      console.error('Error fetching clubs:', error);
    }
  };

  const fetchSeasons = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/seasons');
      const data = await response.json();
      setSeasons(data);
    } catch (error) {
      console.error('Error fetching seasons:', error);
    }
  };

  const fetchPlayers = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/players');
      const data = await response.json();
      setPlayers(data);
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const url = editingTeam
        ? `http://localhost:3000/api/teams/${editingTeam.id}`
        : 'http://localhost:3000/api/teams';

      const method = editingTeam ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save team');
      }

      fetchTeams();
      handleCancel();
    } catch (error) {
      console.error('Error saving team:', error);
      setError(error instanceof Error ? error.message : 'Failed to save team');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this team?')) return;

    try {
      const response = await fetch(`http://localhost:3000/api/teams/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete team');
      fetchTeams();
    } catch (error) {
      console.error('Error deleting team:', error);
      setError('Failed to delete team');
    }
  };

  const [searchTerm, setSearchTerm] = useState('');

  // ... (useEffect and fetch functions)

  const filteredTeams = teams.filter(team => {
    const searchLower = searchTerm.toLowerCase();
    return (
      team.name.toLowerCase().includes(searchLower) ||
      team.club.name.toLowerCase().includes(searchLower) ||
      (team.category && team.category.toLowerCase().includes(searchLower))
    );
  });

  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      category: team.category || 'SENIOR',
      clubId: team.clubId,
      seasonId: team.seasonId,
      isMyTeam: team.isMyTeam
    });
    setIsFormOpen(true);
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingTeam(null);
    setFormData({ name: '', category: 'SENIOR', clubId: '', seasonId: '', isMyTeam: false });
    setError(null);
  };

  const openPlayersModal = (team: Team) => {
    setSelectedTeamForPlayers(team);
    setIsPlayersModalOpen(true);
    setPlayerSearch('');
  };

  const handleAssignPlayer = async (playerId: string) => {
    if (!selectedTeamForPlayers) return;

    try {
      const response = await fetch(`http://localhost:3000/api/teams/${selectedTeamForPlayers.id}/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, role: 'Player' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign player');
      }

      // Refresh teams to get updated players list
      await fetchTeams();

      // Update local state for the modal
      const updatedTeam = await fetch(`http://localhost:3000/api/teams/${selectedTeamForPlayers.id}`).then(res => res.json());
      setSelectedTeamForPlayers(updatedTeam);

    } catch (error) {
      console.error('Error assigning player:', error);
      alert(error instanceof Error ? error.message : 'Failed to assign player');
    }
  };

  const handleUnassignPlayer = async (playerId: string) => {
    if (!selectedTeamForPlayers) return;

    try {
      const response = await fetch(`http://localhost:3000/api/teams/${selectedTeamForPlayers.id}/players/${playerId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to unassign player');

      // Refresh teams
      await fetchTeams();

      // Update local state
      const updatedTeam = await fetch(`http://localhost:3000/api/teams/${selectedTeamForPlayers.id}`).then(res => res.json());
      setSelectedTeamForPlayers(updatedTeam);

    } catch (error) {
      console.error('Error unassigning player:', error);
      alert('Failed to unassign player');
    }
  };

  const handleViewStats = (team: Team) => {
    navigate(`/statistics?teamId=${team.id}`);
  };

  const filteredPlayers = players.filter(player => {
    const searchLower = playerSearch.toLowerCase();
    const matchesSearch =
      player.name.toLowerCase().includes(searchLower) ||
      player.number.toString().includes(searchLower);

    // Filter out players already assigned to this team
    const isAssigned = selectedTeamForPlayers?.players.some(p => p.player.id === player.id);

    return matchesSearch && !isAssigned;
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Teams Management</h1>
        <button
          onClick={() => {
            setEditingTeam(null);
            setFormData({ name: '', category: 'SENIOR', clubId: '', seasonId: '', isMyTeam: false });
            setIsFormOpen(true);
          }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={20} />
          New Team
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search teams by name, club or category..."
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

      {/* Team Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">{editingTeam ? 'Edit Team' : 'New Team'}</h2>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Cadet A"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Club
                </label>
                <select
                  value={formData.clubId}
                  onChange={(e) => setFormData({ ...formData, clubId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a Club</option>
                  {clubs.map(club => (
                    <option key={club.id} value={club.id}>{club.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Season
                </label>
                <select
                  value={formData.seasonId}
                  onChange={(e) => setFormData({ ...formData, seasonId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a Season</option>
                  {seasons.map(season => (
                    <option key={season.id} value={season.id}>{season.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isMyTeam"
                  checked={formData.isMyTeam}
                  onChange={(e) => setFormData({ ...formData, isMyTeam: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="isMyTeam" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  Is My Team <Star size={14} className="text-yellow-500 fill-yellow-500" />
                </label>
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
                  {isLoading ? 'Saving...' : (editingTeam ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Players Assignment Modal */}
      {isPlayersModalOpen && selectedTeamForPlayers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl h-[80vh] flex flex-col p-6 overflow-hidden">
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
              <h2 className="text-xl font-bold">Manage Players - {selectedTeamForPlayers.name}</h2>
              <button onClick={() => setIsPlayersModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6 flex-1 min-h-0">
              {/* Available Players */}
              <div className="flex flex-col h-full">
                <h3 className="font-semibold mb-2">Available Players</h3>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={playerSearch}
                    onChange={(e) => setPlayerSearch(e.target.value)}
                    placeholder="Search by name or number..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg">
                  {filteredPlayers.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No players found</div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {filteredPlayers.map(player => (
                        <div key={player.id} className="p-3 flex justify-between items-center hover:bg-gray-50">
                          <div>
                            <div className="font-medium">{player.name}</div>
                            <div className="text-sm text-gray-500">#{player.number} • {player.handedness}</div>
                          </div>
                          <button
                            onClick={() => handleAssignPlayer(player.id)}
                            className="text-indigo-600 hover:bg-indigo-50 p-1 rounded"
                          >
                            <Plus size={20} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Assigned Players */}
              <div className="flex flex-col h-full">
                <h3 className="font-semibold mb-2">Assigned Players ({selectedTeamForPlayers.players.length})</h3>
                <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg bg-gray-50">
                  {selectedTeamForPlayers.players.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No players assigned yet</div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {selectedTeamForPlayers.players.map(({ player }) => (
                        <div key={player.id} className="p-3 flex justify-between items-center bg-white">
                          <div>
                            <div className="font-medium">{player.name}</div>
                            <div className="text-sm text-gray-500">#{player.number} • {player.handedness}</div>
                          </div>
                          <button
                            onClick={() => handleUnassignPlayer(player.id)}
                            className="text-red-600 hover:bg-red-50 p-1 rounded"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Teams Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Club</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Season</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Players</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredTeams.map((team) => (
              <tr key={team.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center gap-2">
                  {team.name}
                  {team.isMyTeam && <Star size={16} className="text-yellow-500 fill-yellow-500" />}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                    {team.category || 'SENIOR'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{team.club.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{team.season.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {team.players.length} players
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleViewStats(team)}
                    className="text-green-600 hover:text-green-900 mr-4"
                    title="View Statistics"
                  >
                    <BarChart3 size={18} />
                  </button>
                  <button
                    onClick={() => openPlayersModal(team)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                    title="Manage Players"
                  >
                    <Users size={18} />
                  </button>
                  <button
                    onClick={() => handleEdit(team)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                    title="Edit Team"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(team.id)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete Team"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredTeams.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No teams found matching your filters.
          </div>
        )}
      </div>


    </div>
  );
};
