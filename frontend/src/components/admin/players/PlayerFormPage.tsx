import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Hand, Shield, Shirt, Trash2 } from 'lucide-react';
import { API_BASE_URL } from '../../../config/api';
import { SearchableSelectWithCreate } from '../../common/SearchableSelectWithCreate';
import { toTitleCase } from '../../../utils/textUtils';
import { parseTeamName, TEAM_CATEGORIES } from '../../../utils/teamUtils';
import type { Player, Club, Team, Season } from '../../../types';

export const PlayerFormPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const isEditMode = !!id;

    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Data
    const [clubs, setClubs] = useState<Club[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [seasons, setSeasons] = useState<Season[]>([]);

    // Form State
    const [name, setName] = useState('');
    const [number, setNumber] = useState<number | ''>('');
    const [handedness, setHandedness] = useState<'RIGHT' | 'LEFT'>('RIGHT');
    const [isGoalkeeper, setIsGoalkeeper] = useState(false);
    const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
    const [playerTeams, setPlayerTeams] = useState<Player['teams']>([]);

    // Initial Data Loading
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                // Load Clubs, Teams, and Seasons
                const [clubsRes, teamsRes, seasonsRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/api/clubs`),
                    fetch(`${API_BASE_URL}/api/teams`),
                    fetch(`${API_BASE_URL}/api/seasons`)
                ]);

                const clubsData = await clubsRes.json();
                const teamsData = await teamsRes.json();
                const seasonsData = await seasonsRes.json();

                setClubs(clubsData);
                setTeams(teamsData);
                setSeasons(seasonsData);

                // If Edit Mode, Load Player
                if (isEditMode) {
                    const playerRes = await fetch(`${API_BASE_URL}/api/players/${id}`);
                    if (!playerRes.ok) throw new Error('Player not found');
                    const player: Player = await playerRes.json();

                    setName(player.name);
                    setNumber(player.number);
                    setHandedness(player.handedness as 'RIGHT' | 'LEFT');
                    setIsGoalkeeper(player.isGoalkeeper);
                    setPlayerTeams(player.teams || []);
                }
            } catch (err) {
                console.error('Error loading data:', err);
                setError('Failed to load data');
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [id, isEditMode]);

    // Derived State
    const filteredTeams = teams.filter(t => t.club?.id === selectedClubId);

    // Handlers
    const handleNameChange = (val: string) => {
        setName(toTitleCase(val));
    };

    const handleCreateClub = async (clubName: string) => {
        if (!confirm(`Create new club "${clubName}"?`)) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/clubs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: clubName })
            });
            if (!res.ok) throw new Error('Failed to create club');
            const newClub: Club = await res.json();
            setClubs(prev => [...prev, newClub]);
            setSelectedClubId(newClub.id);
            return newClub; // Return for the searchable select to use if needed
        } catch (err) {
            alert('Error creating club');
        }
    };

    // Team Creation Modal State
    const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
    const [pendingTeamName, setPendingTeamName] = useState('');
    const [pendingTeamCategory, setPendingTeamCategory] = useState('SENIOR');
    const [pendingTeamSeasonId, setPendingTeamSeasonId] = useState('');

    const handleCreateTeamRequest = (teamName: string) => {
        // Even if no club is selected, we can allow opening the modal and selecting one there
        const { name: cleanName, category: detectedCategory } = parseTeamName(teamName);

        // Determine default season (current date or first available)
        const now = new Date();
        const currentSeason = seasons.find(s => {
            const start = new Date(s.startDate);
            const end = new Date(s.endDate);
            return now >= start && now <= end;
        });
        const defaultSeasonId = currentSeason?.id || seasons[0]?.id || '';

        setPendingTeamName(cleanName);
        setPendingTeamCategory(detectedCategory);
        setPendingTeamSeasonId(defaultSeasonId);
        setIsTeamModalOpen(true);
    };

    const confirmCreateTeam = async () => {
        if (!selectedClubId) {
            alert('Please select a club');
            return;
        }
        if (!pendingTeamSeasonId) {
            alert('Please select a season');
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/api/teams`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: pendingTeamName,
                    clubId: selectedClubId,
                    seasonId: pendingTeamSeasonId,
                    category: pendingTeamCategory,
                    isMyTeam: false
                })
            });

            if (!res.ok) throw new Error('Failed to create team');
            const newTeam: Team = await res.json();
            setTeams(prev => [...prev, newTeam]);
            setSelectedTeamId(newTeam.id);
            setIsTeamModalOpen(false);
        } catch (err) {
            console.error(err);
            alert('Error creating team');
        }
    };

    const handleRemoveTeam = async (teamId: string) => {
        if (!confirm('Are you sure you want to remove this player from the team?')) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/teams/${teamId}/players/${id}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Failed to remove team assignment');

            // Update local state
            setPlayerTeams(prev => prev?.filter(pt => pt.team.id !== teamId));
        } catch (err) {
            console.error(err);
            alert('Error removing team assignment');
        }
    };

    const handleSave = async () => {
        if (!name || !number) {
            alert('Name and Number are required');
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                name,
                number: Number(number),
                handedness,
                isGoalkeeper
            };

            let savedPlayer: Player;

            if (isEditMode) {
                const res = await fetch(`${API_BASE_URL}/api/players/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) throw new Error('Failed to update player');
                savedPlayer = await res.json();
            } else {
                const res = await fetch(`${API_BASE_URL}/api/players`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) throw new Error('Failed to create player');
                savedPlayer = await res.json();
            }

            // Handle Team Assignment
            if (selectedTeamId) {
                await fetch(`${API_BASE_URL}/api/teams/${selectedTeamId}/players`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        playerId: savedPlayer.id,
                        role: 'Player'
                    })
                });
            }

            if (location.state?.from) {
                navigate(location.state.from);
            } else {
                navigate('/admin/players');
            }
        } catch (err) {
            console.error(err);
            alert('Error saving player');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="p-8 text-center">Loading...</div>;
    if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

    return (
        <div className="max-w-3xl mx-auto p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => {
                            if (location.state?.from) {
                                navigate(location.state.from);
                            } else {
                                navigate('/admin/players');
                            }
                        }}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft size={24} className="text-gray-600" />
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {isEditMode ? 'Edit Player' : 'New Player'}
                    </h1>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium shadow-sm"
                >
                    <Save size={20} />
                    {isSaving ? 'Saving...' : 'Save Player'}
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="p-8 space-y-8">

                    {/* Basic Info Section */}
                    <section>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Shirt size={20} className="text-indigo-500" />
                            Basic Information
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    placeholder="e.g. Jordi Casanovas"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Number</label>
                                <input
                                    type="number"
                                    value={number}
                                    onChange={(e) => setNumber(e.target.value === '' ? '' : Number(e.target.value))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-center font-mono text-lg"
                                    placeholder="#"
                                />
                            </div>
                        </div>
                    </section>

                    <hr className="border-gray-100" />

                    {/* Attributes Section */}
                    <section>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Shield size={20} className="text-indigo-500" />
                            Attributes
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Handedness Selector */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">Handedness</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setHandedness('LEFT')}
                                        className={`
                                            p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all relative
                                            ${handedness === 'LEFT'
                                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                                                : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'}
                                        `}
                                    >
                                        <Hand size={32} strokeWidth={1.5} className="transform scale-x-[-1]" />
                                        <span className="font-medium">Left Handed</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setHandedness('RIGHT')}
                                        className={`
                                            p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all relative
                                            ${handedness === 'RIGHT'
                                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                                                : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'}
                                        `}
                                    >
                                        <Hand size={32} strokeWidth={1.5} />
                                        <span className="font-medium">Right Handed</span>
                                    </button>
                                </div>
                            </div>

                            {/* Position/Role Selector */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">Role</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsGoalkeeper(false)}
                                        className={`
                                            p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all
                                            ${!isGoalkeeper
                                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                                                : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'}
                                        `}
                                    >
                                        <Shirt size={32} strokeWidth={1.5} />
                                        <span className="font-medium">Field Player</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsGoalkeeper(true)}
                                        className={`
                                            p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all
                                            ${isGoalkeeper
                                                ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-sm'
                                                : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'}
                                        `}
                                    >
                                        <Shield size={32} strokeWidth={1.5} />
                                        <span className="font-medium">Goalkeeper</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    <hr className="border-gray-100" />

                    {/* Team Assignment Section */}
                    <section>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Shirt size={20} className="text-indigo-500" />
                            Team Assignments
                        </h2>

                        {/* Current Teams List */}
                        {isEditMode && playerTeams && playerTeams.length > 0 && (
                            <div className="mb-6 space-y-3">
                                <h3 className="text-sm font-medium text-gray-700">Current Teams</h3>
                                <div className="grid gap-3">
                                    {playerTeams.map((pt) => (
                                        <div key={pt.team.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                            <div>
                                                <div className="font-medium text-gray-900">
                                                    {toTitleCase(pt.team.category || 'Senior')} {pt.team.name}
                                                </div>
                                                <div className="text-sm text-gray-500">{pt.team.club.name}</div>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveTeam(pt.team.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Remove from team"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <h3 className="text-sm font-medium text-gray-700 mb-3">Add to Team</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <SearchableSelectWithCreate
                                label="Club"
                                value={selectedClubId}
                                options={clubs.map(c => ({ value: c.id, label: c.name }))}
                                onChange={(val) => {
                                    setSelectedClubId(val);
                                    setSelectedTeamId(null); // Reset team when club changes
                                }}
                                onCreate={handleCreateClub}
                                placeholder="Select or create a club..."
                            />

                            <SearchableSelectWithCreate
                                label="Team"
                                value={selectedTeamId}
                                options={filteredTeams.map(t => ({
                                    value: t.id,
                                    label: `${toTitleCase(t.category || 'Senior')} ${t.name}`
                                }))}
                                onChange={setSelectedTeamId}
                                onCreate={handleCreateTeamRequest}
                                placeholder={selectedClubId ? "Select or create a team..." : "Select a club first"}
                                disabled={!selectedClubId}
                            />
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                            Select a club to see its teams. You can create new clubs and teams directly from the dropdowns.
                        </p>
                    </section>

                </div>
            </div>
            {/* Team Creation Modal */}
            {isTeamModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">Create New Team</h3>
                        <div className="space-y-4">
                            {/* 1. Club (Searchable) */}
                            <SearchableSelectWithCreate
                                label="Club"
                                value={selectedClubId}
                                options={clubs.map(c => ({ value: c.id, label: c.name }))}
                                onChange={setSelectedClubId}
                                onCreate={handleCreateClub}
                                placeholder="Select or create a club..."
                            />

                            {/* 2. Category */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select
                                    value={pendingTeamCategory}
                                    onChange={(e) => setPendingTeamCategory(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                >
                                    {TEAM_CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{toTitleCase(cat)}</option>
                                    ))}
                                </select>
                            </div>

                            {/* 3. Season */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Season</label>
                                <select
                                    value={pendingTeamSeasonId}
                                    onChange={(e) => setPendingTeamSeasonId(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                >
                                    {seasons.map(season => (
                                        <option key={season.id} value={season.id}>{season.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* 4. Team Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
                                <input
                                    type="text"
                                    value={pendingTeamName}
                                    onChange={(e) => setPendingTeamName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="e.g. A, Negre, 1"
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => setIsTeamModalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmCreateTeam}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                >
                                    Create Team
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
