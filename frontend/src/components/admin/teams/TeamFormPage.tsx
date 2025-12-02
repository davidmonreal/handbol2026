import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Star } from 'lucide-react';
import { API_BASE_URL } from '../../../config/api';
import { SearchableSelectWithCreate } from '../../common/SearchableSelectWithCreate';
import { TEAM_CATEGORIES } from '../../../utils/teamUtils';
import { toTitleCase } from '../../../utils/textUtils';
import type { Team, Club, Season } from '../../../types';

export const TeamFormPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const isEditMode = !!id;

    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Data
    const [clubs, setClubs] = useState<Club[]>([]);
    const [seasons, setSeasons] = useState<Season[]>([]);

    // Form State
    const [name, setName] = useState('');
    const [category, setCategory] = useState('SENIOR');
    const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
    const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
    const [isMyTeam, setIsMyTeam] = useState(false);

    // Initial Data Loading
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const [clubsRes, seasonsRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/api/clubs`),
                    fetch(`${API_BASE_URL}/api/seasons`)
                ]);

                const clubsData = await clubsRes.json();
                const seasonsData = await seasonsRes.json();

                setClubs(clubsData);
                setSeasons(seasonsData);

                // Set default season (current)
                const now = new Date();
                const currentSeason = seasonsData.find((s: Season) => {
                    const start = new Date(s.startDate);
                    const end = new Date(s.endDate);
                    return now >= start && now <= end;
                });
                if (currentSeason) {
                    setSelectedSeasonId(currentSeason.id);
                } else if (seasonsData.length > 0) {
                    setSelectedSeasonId(seasonsData[0].id);
                }

                // If Edit Mode, Load Team
                if (isEditMode) {
                    const teamRes = await fetch(`${API_BASE_URL}/api/teams/${id}`);
                    if (!teamRes.ok) throw new Error('Team not found');
                    const team: Team = await teamRes.json();

                    setName(team.name);
                    setCategory(team.category || 'SENIOR');
                    setSelectedClubId(team.club?.id || null);
                    setSelectedSeasonId(team.season?.id || null);
                    setIsMyTeam(team.isMyTeam || false);
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
        } catch (err) {
            alert('Error creating club');
        }
    };

    const handleSave = async () => {
        if (!name.trim() || !selectedClubId || !selectedSeasonId || !category) {
            setError('All fields are required');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            const teamData = {
                name: name.trim(),
                category,
                clubId: selectedClubId,
                seasonId: selectedSeasonId,
                isMyTeam
            };

            const method = isEditMode ? 'PUT' : 'POST';
            const url = isEditMode
                ? `${API_BASE_URL}/api/teams/${id}`
                : `${API_BASE_URL}/api/teams`;

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(teamData)
            });

            if (!res.ok) throw new Error('Failed to save team');
            const savedTeam: Team = await res.json();

            const clubName = clubs.find(c => c.id === selectedClubId)?.name || '';
            const successMessage = `${savedTeam.name} ${isEditMode ? 'updated' : 'created'} in ${clubName} ${category}`;

            if (location.state?.from) {
                navigate(location.state.from, { state: { message: successMessage } });
            } else {
                navigate('/teams', { state: { message: successMessage } });
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save team');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-lg text-gray-600">Loading...</div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => {
                        if (location.state?.from) {
                            navigate(location.state.from);
                        } else {
                            navigate('/teams');
                        }
                    }}
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-3xl font-bold text-gray-800">
                    {isEditMode ? 'Edit Team' : 'New Team'}
                </h1>
            </div>

            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* Form */}
            <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
                {/* Team Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Team Name *
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        placeholder="e.g. Cadet A"
                    />
                </div>

                {/* Club */}
                <SearchableSelectWithCreate
                    label="Club *"
                    value={selectedClubId}
                    options={clubs.map(c => ({ value: c.id, label: c.name }))}
                    onChange={setSelectedClubId}
                    onCreate={handleCreateClub}
                    placeholder="Select or create club..."
                />

                {/* Category */}
                <SearchableSelectWithCreate
                    label="Category *"
                    value={category}
                    options={TEAM_CATEGORIES.map(cat => ({
                        value: cat,
                        label: toTitleCase(cat)
                    }))}
                    onChange={setCategory}
                    placeholder="Select category..."
                />

                {/* Season */}
                <SearchableSelectWithCreate
                    label="Season *"
                    value={selectedSeasonId}
                    options={seasons.map(s => ({ value: s.id, label: s.name }))}
                    onChange={setSelectedSeasonId}
                    placeholder="Select season..."
                />

                {/* Is My Team */}
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="isMyTeam"
                        checked={isMyTeam}
                        onChange={(e) => setIsMyTeam(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor="isMyTeam" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Star size={16} className={isMyTeam ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'} />
                        Is My Team
                    </label>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                        onClick={() => navigate('/teams')}
                        className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
                    >
                        <Save size={18} />
                        {isSaving ? 'Saving...' : isEditMode ? 'Update Team' : 'Create Team'}
                    </button>
                </div>
            </div>
        </div>
    );
};
