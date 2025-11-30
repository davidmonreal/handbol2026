import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Calendar, Search, BarChart3 } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';


interface Match {
  id: string;
  date: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeam: { id: string; name: string };
  awayTeam: { id: string; name: string };
  isFinished: boolean;
  homeScore?: number;
  awayScore?: number;
}

interface Team {
  id: string;
  name: string;
}

export const MatchesManagement = () => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    homeTeamId: '',
    awayTeamId: '',
    time: '12:00'
  });

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');



  useEffect(() => {
    fetchMatches();
    fetchTeams();
  }, []);

  const fetchMatches = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/matches`);
      const data = await response.json();
      setMatches(data);
    } catch (error) {
      console.error('Error fetching matches:', error);
      setError('Failed to fetch matches');
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/teams`);
      const data = await response.json();
      setTeams(data);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const url = editingMatch
        ? `${API_BASE_URL}/api/matches/${editingMatch.id}`
        : `${API_BASE_URL}/api/matches`;

      const method = editingMatch ? 'PUT' : 'POST';

      // Combine date and time
      const dateTime = new Date(`${formData.date}T${formData.time}`);

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dateTime.toISOString(),
          homeTeamId: formData.homeTeamId,
          awayTeamId: formData.awayTeamId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save match');
      }

      fetchMatches();
      handleCancel();
    } catch (error) {
      console.error('Error saving match:', error);
      setError(error instanceof Error ? error.message : 'Failed to save match');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this match?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/matches/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete match');
      fetchMatches();
    } catch (error) {
      console.error('Error deleting match:', error);
      setError('Failed to delete match');
    }
  };

  const handleEdit = (match: Match) => {
    setEditingMatch(match);
    const dateObj = new Date(match.date);
    setFormData({
      date: dateObj.toISOString().split('T')[0],
      time: dateObj.toTimeString().slice(0, 5),
      homeTeamId: match.homeTeamId,
      awayTeamId: match.awayTeamId
    });
    setIsFormOpen(true);
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingMatch(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      homeTeamId: '',
      awayTeamId: '',
      time: '12:00'
    });
    setError(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ca-ES', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewStats = (match: Match) => {
    navigate(`/statistics?matchId=${match.id}`);
  };

  const filteredMatches = matches.filter(match => {
    const searchLower = searchTerm.toLowerCase();
    const dateFormatted = formatDate(match.date).toLowerCase();
    return (
      match.homeTeam.name.toLowerCase().includes(searchLower) ||
      match.awayTeam.name.toLowerCase().includes(searchLower) ||
      dateFormatted.includes(searchLower)
    );
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Matches Management</h1>
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={20} />
          New Match
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search matches by team name or date..."
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

      {/* Match Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">
              {editingMatch ? 'Edit Match' : 'New Match'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Home Team
                </label>
                <select
                  value={formData.homeTeamId}
                  onChange={(e) => setFormData({ ...formData, homeTeamId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Home Team</option>
                  {teams.map(team => (
                    <option
                      key={team.id}
                      value={team.id}
                      disabled={team.id === formData.awayTeamId}
                    >
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Away Team
                </label>
                <select
                  value={formData.awayTeamId}
                  onChange={(e) => setFormData({ ...formData, awayTeamId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Away Team</option>
                  {teams.map(team => (
                    <option
                      key={team.id}
                      value={team.id}
                      disabled={team.id === formData.homeTeamId}
                    >
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 justify-end mt-6">
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
                  {isLoading ? 'Saving...' : (editingMatch ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Matches Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Home Team</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Away Team</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredMatches.map((match) => (
              <tr key={match.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" />
                    {formatDate(match.date)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{match.homeTeam.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-center">
                  {match.isFinished ? (
                    <span className="bg-gray-100 px-2 py-1 rounded">
                      {match.homeScore ?? 0} : {match.awayScore ?? 0}
                    </span>
                  ) : (
                    <span className="text-gray-400">-:-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-left">{match.awayTeam.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${match.isFinished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {match.isFinished ? 'Finished' : 'Scheduled'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleViewStats(match)}
                    className="text-green-600 hover:text-green-900 mr-4"
                    title="View Statistics"
                  >
                    <BarChart3 size={18} />
                  </button>
                  <button
                    onClick={() => handleEdit(match)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                    title="Edit Match"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(match.id)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete Match"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredMatches.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No matches found. Schedule your first match!
          </div>
        )}
      </div>


    </div>
  );
};
