import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Search } from 'lucide-react';
import { API_BASE_URL } from '../../../config/api';
import { RemoveIconButton, EditIconButton, AddIconButton } from '../../common';
import { TEAM_CATEGORIES } from '../../../utils/teamUtils';
import type { Team, Player } from '../../../types';

export const TeamPlayersPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [team, setTeam] = useState<Team | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [playerSearch, setPlayerSearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            if (!id) return;
            setIsLoading(true);
            try {
                const [teamRes, playersRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/api/teams/${id}`),
                    fetch(`${API_BASE_URL}/api/players`)
                ]);

                if (!teamRes.ok) throw new Error('Team not found');

                const teamData = await teamRes.json();
                const playersData = await playersRes.json();

                setTeam(teamData);
                setPlayers(playersData);
            } catch (err) {
                console.error('Error loading data:', err);
                setError('Failed to load team data');
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [id]);

    const handleAssignPlayer = async (playerId: string) => {
        if (!id) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/teams/${id}/players`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId, role: 'Player' }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to assign player');
            }

            // Refresh team state
            const updatedTeamRes = await fetch(`${API_BASE_URL}/api/teams/${id}`);
            const updatedTeam = await updatedTeamRes.json();
            setTeam(updatedTeam);
        } catch (err) {
            console.error('Error assigning player:', err);
            alert(err instanceof Error ? err.message : 'Failed to assign player');
        }
    };

    const handleUnassignPlayer = async (playerId: string) => {
        if (!id) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/teams/${id}/players/${playerId}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to unassign player');

            // Refresh team state
            const updatedTeamRes = await fetch(`${API_BASE_URL}/api/teams/${id}`);
            const updatedTeam = await updatedTeamRes.json();
            setTeam(updatedTeam);
        } catch (err) {
            console.error('Error unassigning player:', err);
            alert('Failed to unassign player');
        }
    };

    const filteredPlayers = players.filter(player => {
        const searchLower = playerSearch.toLowerCase();
        const matchesSearch =
            player.name.toLowerCase().includes(searchLower) ||
            player.number.toString().includes(searchLower);

        // Filter out players already assigned to this team
        const isAssigned = team?.players?.some(p => p.player?.id === player.id);

        return matchesSearch && !isAssigned;
    });

    const assignedPlayersSorted = (team?.players || [])
        .filter(p => p.player)
        .sort((a, b) => {
            const numA = a.player?.number ?? Number.MAX_SAFE_INTEGER;
            const numB = b.player?.number ?? Number.MAX_SAFE_INTEGER;
            if (numA !== numB) return numA - numB;
            return (a.player?.name || '').localeCompare(b.player?.name || '');
        });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                    <span className="text-lg text-gray-600">Loading team data...</span>
                </div>
            </div>
        );
    }

    if (error || !team) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error || 'Team not found'}
                </div>
                <button
                    onClick={() => navigate('/teams')}
                    className="mt-4 text-indigo-600 hover:text-indigo-800"
                >
                    ← Back to Teams
                </button>
            </div>
        );
    }

    // Helper to render player item content
    const renderPlayerItem = (player: Player) => (
        <div className="flex-1">
            <div className="font-medium flex items-center gap-2 text-lg text-gray-900">
                #{player.number} • {player.name}
                {player.isGoalkeeper && (
                    <span className="px-1.5 py-0.5 text-xs font-bold rounded bg-purple-100 text-purple-700 border border-purple-200">
                        GK
                    </span>
                )}
            </div>
            {player.teams && player.teams.length > 0 && (
                <div className="mt-1 flex flex-col gap-0.5">
                    {player.teams.map((pt, idx) => (
                        <div key={idx} className="text-sm text-gray-500">
                            {pt.team.club.name} · {pt.team.category} · {pt.team.name}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto p-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/teams')}
                        className="text-gray-600 hover:text-gray-900 transition-colors"
                        title="Back to Teams"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">
                            Gestionar Plantilla
                        </h1>
                        <p className="text-gray-600 mt-1">
                            {team.club?.name} · {team.category} · {team.name}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/players/import', { state: { preselectedTeamId: id } })}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                    >
                        <Upload size={20} />
                        Import Players
                    </button>

                    <button
                        onClick={() => navigate('/players/new', {
                            state: {
                                from: `/teams/${id}/players`,
                                preselectClubId: team.club?.id || null,
                                preselectCategory: team.category || TEAM_CATEGORIES[0],
                                preselectTeamId: team.id
                            }
                        })}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
                    >
                        Create a player
                    </button>
                </div>
            </div>

            {/* Main Content - Two Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Available Players */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-xl font-semibold mb-4">Available Players</h2>
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            value={playerSearch}
                            onChange={(e) => setPlayerSearch(e.target.value)}
                            placeholder="Search by name or number..."
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>
                    <div className="max-h-[60vh] overflow-y-auto border border-gray-200 rounded-lg">
                        {filteredPlayers.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">No players found</div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {filteredPlayers.map(player => (
                                    <div key={player.id} className="p-4 flex justify-between items-start hover:bg-gray-50 transition-colors">
                                        {renderPlayerItem(player)}
                                        <AddIconButton
                                            onClick={() => handleAssignPlayer(player.id)}
                                            title="Afegir a l'equip"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Assigned Players */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        Assigned Players
                        <span className="px-2.5 py-0.5 text-sm font-medium bg-indigo-100 text-indigo-800 rounded-full">
                            {assignedPlayersSorted.length}
                        </span>
                    </h2>

                    <div className="max-h-[60vh] overflow-y-auto border border-gray-200 rounded-lg bg-gray-50">
                        {assignedPlayersSorted.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <p>No players assigned yet.</p>
                                <p className="text-sm mt-1">Use the buttons above or the list on the left to add players.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200">
                                {assignedPlayersSorted.map(({ player }) => (
                                    <div key={player.id} className="p-4 flex justify-between items-start bg-white hover:bg-gray-50 transition-colors">
                                        {renderPlayerItem(player)}
                                        <div className="flex items-center gap-2 ml-4">
                                            <EditIconButton
                                                onClick={() => navigate(`/players/${player.id}/edit`, { state: { from: `/teams/${id}/players` } })}
                                                title="Editar jugador"
                                            />
                                            <RemoveIconButton
                                                onClick={() => handleUnassignPlayer(player.id)}
                                                title="Treure de l'equip"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
