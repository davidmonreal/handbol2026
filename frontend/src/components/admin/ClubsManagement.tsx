import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';

interface Club {
  id: string;
  name: string;
}

export const ClubsManagement = () => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const [formData, setFormData] = useState({ name: '' });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/clubs');
      const data = await response.json();
      setClubs(data);
    } catch (error) {
      console.error('Error fetching clubs:', error);
      setError('Failed to connect to the server. Please ensure the backend is running.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      const url = editingClub 
        ? `http://localhost:3000/api/clubs/${editingClub.id}`
        : 'http://localhost:3000/api/clubs';
        
      const method = editingClub ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save club');
      
      fetchClubs();
      setIsFormOpen(false);
      setEditingClub(null);
      setFormData({ name: '' });
    } catch (error) {
      console.error('Error saving club:', error);
      setError('Failed to save club. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this club?')) return;
    
    try {
      await fetch(`http://localhost:3000/api/clubs/${id}`, { method: 'DELETE' });
      fetchClubs();
    } catch (error) {
      console.error('Error deleting club:', error);
    }
  };

  const handleEdit = (club: Club) => {
    setEditingClub(club);
    setFormData({ name: club.name });
    setIsFormOpen(true);
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingClub(null);
    setFormData({ name: '' });
  };

  const filteredClubs = clubs.filter(club => {
    const searchLower = searchTerm.toLowerCase();
    return club.name.toLowerCase().includes(searchLower);
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Clubs Management</h1>
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={20} />
          New Club
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search clubs by name..."
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
              {editingClub ? 'Edit Club' : 'New Club'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Club Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
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
                  {isLoading ? 'Saving...' : (editingClub ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clubs Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredClubs.map((club) => (
              <tr key={club.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {club.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(club)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(club.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredClubs.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No clubs found. Create your first club!
          </div>
        )}
      </div>
    </div>
  );
};
