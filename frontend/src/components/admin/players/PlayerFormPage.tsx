import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Hand, Shield, Shirt, Trash2, CheckCircle, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../../../config/api';
import { SearchableSelectWithCreate } from '../../common/SearchableSelectWithCreate';
import { ConfirmationModal } from '../../common';
import { toTitleCase } from '../../../utils/textUtils';
import { TEAM_CATEGORIES } from '../../../utils/teamUtils';
import { playerImportService, type DuplicateMatch } from '../../../services/playerImportService';
import type { Player, Club, Team, Season } from '../../../types';

export const PlayerFormPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const isEditMode = !!id;

    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Duplicate Detection State
    const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
    const [duplicateMatches, setDuplicateMatches] = useState<DuplicateMatch[]>([]);
    const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
    const [ignoreDuplicates, setIgnoreDuplicates] = useState(false);

    // Data
    const [clubs, setClubs] = useState<Club[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [seasons, setSeasons] = useState<Season[]>([]);

    // Form State
    // Form State
    const [name, setName] = useState('');
    const [number, setNumber] = useState<number | ''>('');
    const [handedness, setHandedness] = useState<'RIGHT' | 'LEFT'>('RIGHT');
    const [isGoalkeeper, setIsGoalkeeper] = useState(false);
    const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('SENIOR');
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

    // Explicitly define the shape to avoid inference issues
    interface PlayerTeam {
        team: {
            id: string;
            name: string;
            category?: string;
            club: {
                name: string;
            };
        };
    }
    const [playerTeams, setPlayerTeams] = useState<PlayerTeam[]>([]);

    // Confirmation state
    const [removeTeamConfirmation, setRemoveTeamConfirmation] = useState<{ isOpen: boolean; teamId: string | null }>({
        isOpen: false,
        teamId: null,
    });
    const [createClubConfirmation, setCreateClubConfirmation] = useState<{ isOpen: boolean; clubName: string | null }>({
        isOpen: false,
        clubName: null,
    });

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
                    setPlayerTeams((player.teams || []) as PlayerTeam[]);
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

    // Derived State - Filter teams by Club AND Category
    const filteredTeams = teams.filter(t =>
        t.club?.id === selectedClubId &&
        (t.category || 'SENIOR') === selectedCategory
    );

    // Duplicate Detection (debounced)
    useEffect(() => {
        // Don't check for duplicates in edit mode or if name is too short
        if (isEditMode || name.trim().length < 3 || ignoreDuplicates) {
            setDuplicateMatches([]);
            setShowDuplicateWarning(false);
            return;
        }

        const timeoutId = setTimeout(async () => {
            setIsCheckingDuplicates(true);
            try {
                const data = await playerImportService.checkDuplicates([name]);
                if (data.duplicates && data.duplicates[0]) {
                    const duplicateInfo = data.duplicates[0];
                    if (duplicateInfo.hasDuplicates && duplicateInfo.matches.length > 0) {
                        setDuplicateMatches(duplicateInfo.matches);
                        setShowDuplicateWarning(true);
                    } else {
                        setDuplicateMatches([]);
                        setShowDuplicateWarning(false);
                    }
                }
            } catch (err) {
                console.error('Error checking duplicates:', err);
            } finally {
                setIsCheckingDuplicates(false);
            }
        }, 500); // Debounce 500ms

        return () => clearTimeout(timeoutId);
    }, [name, isEditMode, ignoreDuplicates]);

    // Handlers
    const handleNameChange = (val: string) => {
        setName(toTitleCase(val));
        setIgnoreDuplicates(false); // Reset when user changes name
    };

    const handleContinueAnyway = () => {
        setIgnoreDuplicates(true);
        setShowDuplicateWarning(false);
    };

    const handleCancelCreation = () => {
        navigate('/players');
    };

    const handleCreateClub = async (clubName: string) => {
        setCreateClubConfirmation({ isOpen: true, clubName });
    };

    const confirmCreateClub = async () => {
        const clubName = createClubConfirmation.clubName;
        setCreateClubConfirmation({ isOpen: false, clubName: null });
        if (!clubName) return;

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
            return newClub;
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
        // Determine default season (current date or first available)
        const now = new Date();
        const currentSeason = seasons.find(s => {
            const start = new Date(s.startDate);
            const end = new Date(s.endDate);
            return now >= start && now <= end;
        });
        const defaultSeasonId = currentSeason?.id || seasons[0]?.id || '';

        // Use the selected category from the main form
        setPendingTeamName(teamName);
        setPendingTeamCategory(selectedCategory);
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

    const handleRemoveTeam = (teamId: string) => {
        setRemoveTeamConfirmation({ isOpen: true, teamId });
    };

    const confirmRemoveTeam = async () => {
        const teamId = removeTeamConfirmation.teamId;
        setRemoveTeamConfirmation({ isOpen: false, teamId: null });
        if (!teamId) return;

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

            // Construct success message
            let successMessage = `Player "${savedPlayer.name}" ${isEditMode ? 'updated' : 'created'}`;

            if (selectedTeamId && selectedClubId) {
                const clubName = clubs.find(c => c.id === selectedClubId)?.name;
                const teamName = teams.find(t => t.id === selectedTeamId)?.name;
                if (clubName && teamName) {
                    successMessage = `${savedPlayer.name} created in ${clubName} ${selectedCategory} ${teamName}`;
                }
            }

            if (location.state?.from) {
                navigate(location.state.from, { state: { message: successMessage } });
            } else {
                navigate('/players', { state: { message: successMessage } });
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
                                navigate('/players');
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

                                {/* Duplicate Detection UI - Moved outside */}
                                {!isEditMode && name.trim().length >= 3 && (
                                    <div className="mt-2">
                                        {isCheckingDuplicates && (
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Loader2 size={14} className="animate-spin" />
                                                <span>Checking for duplicates...</span>
                                            </div>
                                        )}

                                        {!isCheckingDuplicates && !showDuplicateWarning && !ignoreDuplicates && (
                                            <div className="flex items-center gap-2 text-sm text-green-600">
                                                <CheckCircle size={14} />
                                                <span>Aquest jugador encara no existeix a la BBDD</span>
                                            </div>
                                        )}
                                    </div>
                                )}
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

                        {/* Full Width Duplicate Warning */}
                        {!isEditMode && showDuplicateWarning && !ignoreDuplicates && (
                            <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                {duplicateMatches.map((match, idx) => (
                                    <div key={idx} className="bg-white p-4 flex items-center justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-gray-900 flex items-center gap-2">
                                                {match.name}
                                                {match.number && <span className="text-gray-500">#{match.number}</span>}
                                            </div>
                                            {match.teams && match.teams.length > 0 ? (
                                                <div className="text-sm text-gray-500 mt-0.5">
                                                    {match.teams.map(t => `${t.club} ${toTitleCase(t.name)}`).join(', ')}
                                                </div>
                                            ) : (
                                                <div className="text-sm text-gray-400 italic mt-0.5">No active teams</div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => navigate(`/players/${match.id}/edit`)}
                                                className="px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                            >
                                                View/Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleCancelCreation}
                                                className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleContinueAnyway}
                                                className="px-3 py-1.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"
                                            >
                                                Continue
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
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

                        {/* Current Teams List - Badge Style */}
                        {isEditMode && playerTeams && playerTeams.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-sm font-medium text-gray-700 mb-3">Current Teams</h3>
                                <div className="flex flex-wrap gap-2">
                                    {playerTeams.map((pt) => (
                                        <div
                                            key={pt.team.id}
                                            className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-lg group hover:shadow-sm transition-all"
                                        >
                                            <span className="text-sm">
                                                <span className="font-semibold text-indigo-900">{pt.team.club.name}</span>
                                                {' '}
                                                <span className="text-indigo-700">{toTitleCase(pt.team.category || 'Senior')}</span>
                                                {' '}
                                                <span className="text-indigo-600">{pt.team.name}</span>
                                            </span>
                                            <button
                                                onClick={() => handleRemoveTeam(pt.team.id)}
                                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                title="Remove from team"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <h3 className="text-sm font-medium text-gray-700 mb-3">Add to Team</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <SearchableSelectWithCreate
                                label="Club"
                                value={selectedClubId}
                                options={clubs.map(c => ({ value: c.id, label: c.name }))}
                                onChange={(val) => {
                                    setSelectedClubId(val);
                                    setSelectedTeamId(null); // Reset team when club changes
                                }}
                                onCreate={handleCreateClub}
                                placeholder="Select or create..."
                            />

                            <SearchableSelectWithCreate
                                label="Category"
                                value={selectedCategory}
                                options={Array.from(new Set([
                                    ...TEAM_CATEGORIES,
                                    ...teams.map(t => t.category || 'SENIOR')
                                ])).map(cat => ({
                                    value: cat,
                                    label: toTitleCase(cat)
                                }))}
                                onChange={(val) => {
                                    setSelectedCategory(val);
                                    setSelectedTeamId(null);
                                }}
                                onCreate={(newCat) => {
                                    setSelectedCategory(newCat);
                                    setSelectedTeamId(null);
                                }}
                                placeholder="Select category..."
                            />

                            <SearchableSelectWithCreate
                                label="Team"
                                value={selectedTeamId}
                                options={filteredTeams.map(t => ({
                                    value: t.id,
                                    label: t.name
                                }))}
                                onChange={setSelectedTeamId}
                                onCreate={handleCreateTeamRequest}
                                placeholder={selectedClubId ? "Select or create..." : "Select club first"}
                                disabled={!selectedClubId}
                            />
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                            Select club and category to see available teams. You can create new clubs and teams directly from the dropdowns.
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

            {/* Remove Team Confirmation Modal */}
            <ConfirmationModal
                isOpen={removeTeamConfirmation.isOpen}
                title="Remove from Team"
                message="Are you sure you want to remove this player from the team?"
                confirmLabel="Remove"
                cancelLabel="Cancel"
                variant="danger"
                onConfirm={confirmRemoveTeam}
                onCancel={() => setRemoveTeamConfirmation({ isOpen: false, teamId: null })}
            />

            {/* Create Club Confirmation Modal */}
            <ConfirmationModal
                isOpen={createClubConfirmation.isOpen}
                title="Create New Club"
                message={`Create new club "${createClubConfirmation.clubName}"?`}
                confirmLabel="Create"
                cancelLabel="Cancel"
                variant="info"
                onConfirm={confirmCreateClub}
                onCancel={() => setCreateClubConfirmation({ isOpen: false, clubName: null })}
            />
        </div>
    );
};
