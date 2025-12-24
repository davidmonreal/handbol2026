import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Search } from 'lucide-react';
import { API_BASE_URL } from '../../../config/api';
import { RemoveIconButton, AddIconButton, EditIconButton } from '../../common';
import { TEAM_CATEGORIES } from '../../../utils/teamUtils';
import type { Team, Player } from '../../../types';
import { useSafeTranslation } from '../../../context/LanguageContext';
import { PLAYER_POSITIONS, PLAYER_POSITION_ABBR } from '../../../constants/playerPositions';
import type { PlayerPositionId } from '../../../constants/playerPositions';
import { DropdownSelect } from '../../common/DropdownSelect';

export const TeamPlayersPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useSafeTranslation();

    const [team, setTeam] = useState<Team | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [playerSearch, setPlayerSearch] = useState('');
    const [debouncedPlayerSearch, setDebouncedPlayerSearch] = useState('');
    const [isTeamLoading, setIsTeamLoading] = useState(true);
    const [isPlayersLoading, setIsPlayersLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [playerLoadError, setPlayerLoadError] = useState<string | null>(null);
    const [pendingPositions, setPendingPositions] = useState<Record<string, number>>({});
    const positionOptions = PLAYER_POSITIONS.map((pos) => ({
        value: pos.id,
        label: t(pos.tKey),
    }));

    useEffect(() => {
        const loadTeam = async () => {
            if (!id) return;
            setIsTeamLoading(true);
            try {
                const teamRes = await fetch(`${API_BASE_URL}/api/teams/${id}`);
                if (!teamRes.ok) throw new Error('Team not found');
                const teamData = await teamRes.json();
                setTeam(teamData);
            } catch (err) {
                console.error('Error loading team data:', err);
                setError('Failed to load team data');
            } finally {
                setIsTeamLoading(false);
            }
        };

        loadTeam();
    }, [id]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedPlayerSearch(playerSearch.trim());
        }, 300);
        return () => clearTimeout(timer);
    }, [playerSearch]);

    useEffect(() => {
        if (!id) return;
        const controller = new AbortController();

        const fetchPlayers = async () => {
            if (!debouncedPlayerSearch || debouncedPlayerSearch.length < 2) {
                setPlayers([]);
                setPlayerLoadError(null);
                setIsPlayersLoading(false);
                return;
            }

            setIsPlayersLoading(true);
            setPlayerLoadError(null);

            try {
                const params = new URLSearchParams({
                    search: debouncedPlayerSearch,
                    take: '50',
                    skip: '0',
                });
                const playersRes = await fetch(`${API_BASE_URL}/api/players?${params.toString()}`, {
                    signal: controller.signal,
                });
                if (!playersRes.ok) {
                    throw new Error(`Failed to load players (${playersRes.status})`);
                }
                const data = await playersRes.json();
                const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
                setPlayers(list);
            } catch (err) {
                if ((err as { name?: string }).name === 'AbortError') return;
                console.error('Error loading players:', err);
                setPlayerLoadError('No s\'han pogut carregar els jugadors. Torna-ho a provar.');
            } finally {
                setIsPlayersLoading(false);
            }
        };

        fetchPlayers();
        return () => controller.abort();
    }, [debouncedPlayerSearch, id]);

    const getDefaultPosition = (player: Player) =>
        (player.isGoalkeeper ? PLAYER_POSITIONS.find((p) => p.id === 1)?.id : undefined) ??
        (player.isGoalkeeper ? 1 : 0);

    const renderPositionBadges = (position?: number) => {
        const labels = new Set<string>();
        if (position === 1) {
            labels.add('GK');
        } else {
            const abbr = PLAYER_POSITION_ABBR[(position ?? 0) as PlayerPositionId];
            labels.add(abbr ?? '—');
        }

        return Array.from(labels).map((abbr) => (
            <span
                key={abbr}
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                    abbr === 'GK'
                        ? 'bg-purple-100 text-purple-700 border border-purple-200'
                        : 'bg-indigo-100 text-indigo-800'
                }`}
            >
                {abbr}
            </span>
        ));
    };

    const handleAssignPlayer = async (player: Player & { position?: number }) => {
        if (!id) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/teams/${id}/players`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    playerId: player.id,
                    position:
                        player.position ??
                        pendingPositions[player.id] ??
                        getDefaultPosition(player),
                }),
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
        const isAssigned = team?.players?.some(p => p.player?.id === player.id);
        return !isAssigned;
    });

    const assignedPlayersSorted = (team?.players || [])
        .filter(p => p.player)
        .sort((a, b) => {
            const numA = a.player?.number ?? Number.MAX_SAFE_INTEGER;
            const numB = b.player?.number ?? Number.MAX_SAFE_INTEGER;
            if (numA !== numB) return numA - numB;
            return (a.player?.name || '').localeCompare(b.player?.name || '');
        });

    if (isTeamLoading) {
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
                        {!debouncedPlayerSearch || debouncedPlayerSearch.length < 2 ? (
                            <div className="p-4 text-center text-gray-500">
                                {t('teamPlayers.searchHint')}
                            </div>
                        ) : playerLoadError ? (
                            <div className="p-4 text-center text-red-600">{t('teamPlayers.loadError')}</div>
                        ) : isPlayersLoading ? (
                            <div className="p-4 text-center text-gray-500">{t('teamPlayers.loadingPlayers')}</div>
                        ) : filteredPlayers.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">{t('teamPlayers.noPlayersFound')}</div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {filteredPlayers.map(player => (
                                    <div key={player.id} className="p-4 flex justify-between items-start hover:bg-gray-50 transition-colors">
                                        {renderPlayerItem(player)}
                                        <div className="flex items-center gap-2">
                                            <DropdownSelect
                                                options={positionOptions}
                                                value={pendingPositions[player.id] ?? getDefaultPosition(player)}
                                                onChange={(val) => {
                                                    const value = (val ?? getDefaultPosition(player)) as PlayerPositionId;
                                                    setPendingPositions(prev => ({ ...prev, [player.id]: value }));
                                                }}
                                                placeholder={t('positions.unset')}
                                            />
                                            <AddIconButton
                                                onClick={() =>
                                                    handleAssignPlayer({
                                                        ...player,
                                                        position: pendingPositions[player.id] ?? getDefaultPosition(player),
                                                    })
                                                }
                                                title="Afegir a l'equip"
                                            />
                                        </div>
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
                                {assignedPlayersSorted.map(({ player, position }) => (
                                    <div
                                        key={player.id}
                                        className="p-4 flex justify-between items-center bg-white hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3 flex-1">
                                            <div>{renderPlayerItem(player)}</div>
                                            <div className="flex items-center gap-2">
                                                {renderPositionBadges(position)}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 ml-4">
                                            <EditIconButton
                                                onClick={() =>
                                                    navigate(`/players/${player.id}/edit`, {
                                                        state: { from: `/teams/${id}/players` },
                                                    })
                                                }
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
