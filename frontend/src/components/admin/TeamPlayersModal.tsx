import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, X } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';
import type { Team, Player } from '../../types';

interface TeamPlayersModalProps {
    team: Team;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void; // Callback to refresh parent data
}

export const TeamPlayersModal = ({ team, isOpen, onClose, onUpdate }: TeamPlayersModalProps) => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [playerSearch, setPlayerSearch] = useState('');
    const [localTeam, setLocalTeam] = useState<Team>(team);

    useEffect(() => {
        if (isOpen) {
            fetchPlayers();
            setLocalTeam(team); // Reset local team state when opening
        }
    }, [isOpen, team]);

    const fetchPlayers = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/players`);
            const data = await response.json();
            setPlayers(data);
        } catch (error) {
            console.error('Error fetching players:', error);
        }
    };

    const handleAssignPlayer = async (playerId: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/teams/${localTeam.id}/players`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId, role: 'Player' }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to assign player');
            }

            // Refresh local team state
            const updatedTeamRes = await fetch(`${API_BASE_URL}/api/teams/${localTeam.id}`);
            const updatedTeam = await updatedTeamRes.json();
            setLocalTeam(updatedTeam);
            onUpdate(); // Notify parent
        } catch (error) {
            console.error('Error assigning player:', error);
            alert(error instanceof Error ? error.message : 'Failed to assign player');
        }
    };

    const handleUnassignPlayer = async (playerId: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/teams/${localTeam.id}/players/${playerId}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to unassign player');

            // Refresh local team state
            const updatedTeamRes = await fetch(`${API_BASE_URL}/api/teams/${localTeam.id}`);
            const updatedTeam = await updatedTeamRes.json();
            setLocalTeam(updatedTeam);
            onUpdate(); // Notify parent
        } catch (error) {
            console.error('Error unassigning player:', error);
            alert('Failed to unassign player');
        }
    };

    const filteredPlayers = players.filter(player => {
        const searchLower = playerSearch.toLowerCase();
        const matchesSearch =
            player.name.toLowerCase().includes(searchLower) ||
            player.number.toString().includes(searchLower);

        // Filter out players already assigned to this team
        const isAssigned = localTeam.players?.some(p => p.player.id === player.id);

        return matchesSearch && !isAssigned;
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl h-[80vh] flex flex-col p-6 overflow-hidden">
                <div className="flex justify-between items-center mb-6 flex-shrink-0">
                    <h2 className="text-xl font-bold">Manage Players - {localTeam.name}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
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
                                                <div className="font-medium flex items-center gap-2">
                                                    {player.name}
                                                    {player.isGoalkeeper && (
                                                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-purple-100 text-purple-700 border border-purple-200">
                                                            GK
                                                        </span>
                                                    )}
                                                </div>
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
                        <h3 className="font-semibold mb-2">Assigned Players ({localTeam.players?.length || 0})</h3>
                        <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg bg-gray-50">
                            {!localTeam.players || localTeam.players.length === 0 ? (
                                <div className="p-4 text-center text-gray-500">No players assigned yet</div>
                            ) : (
                                <div className="divide-y divide-gray-200">
                                    {localTeam.players.map(({ player }) => (
                                        <div key={player.id} className="p-3 flex justify-between items-center bg-white">
                                            <div>
                                                <div className="font-medium flex items-center gap-2">
                                                    {player.name}
                                                    {player.isGoalkeeper && (
                                                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-purple-100 text-purple-700 border border-purple-200">
                                                            GK
                                                        </span>
                                                    )}
                                                </div>
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
    );
};
