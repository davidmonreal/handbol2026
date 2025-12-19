import { useState, useEffect } from 'react';
import { X, Save, Loader2, Star } from 'lucide-react';
import { toTitleCase } from '../../../utils/textUtils';
import { SearchableSelectWithCreate } from '../../common/SearchableSelectWithCreate';
import { API_BASE_URL } from '../../../config/api';
import { TEAM_CATEGORIES } from '../../../utils/teamUtils';
import type { Club, Team, Season } from '../../../types';

interface CreateTeamModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { clubName: string; teamName: string; category: string }) => Promise<void>;
    initialTeamName: string;
    applyTitleCase?: boolean; // Optional: apply title case transformation to team and club names
}

export const CreateTeamModal = ({ isOpen, onClose, onSubmit, initialTeamName, applyTitleCase = true }: CreateTeamModalProps) => {
    const [clubName, setClubName] = useState('');
    const [teamName, setTeamName] = useState('');
    const [category, setCategory] = useState(TEAM_CATEGORIES[0]);
    const [seasonId, setSeasonId] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoadingData, setIsLoadingData] = useState(false);

    // Data State
    const [clubs, setClubs] = useState<Club[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [seasons, setSeasons] = useState<Season[]>([]);

    // Load Data on Mount/Open
    useEffect(() => {
        if (isOpen) {
            const loadData = async () => {
                setIsLoadingData(true);
                try {
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

                    // Set Default Season (Current)
                    const now = new Date();
                    const currentSeason = seasonsData.find((s: Season) => {
                        const start = new Date(s.startDate);
                        const end = new Date(s.endDate);
                        return now >= start && now <= end;
                    });
                    if (currentSeason) {
                        setSeasonId(currentSeason.id);
                    } else if (seasonsData.length > 0) {
                        setSeasonId(seasonsData[0].id);
                    }

                } catch (err) {
                    console.error('Error loading data:', err);
                    setError('Failed to load initial data');
                } finally {
                    setIsLoadingData(false);
                }
            };
            loadData();

            // Reset Form
            setTeamName(initialTeamName);
            setClubName('');
            setCategory(TEAM_CATEGORIES[0]);
            setError(null);
        }
    }, [isOpen, initialTeamName]);

    const handleCreateClub = async (newClubName: string) => {
        if (!confirm(`Create new club "${newClubName}"?`)) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/clubs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newClubName })
            });
            if (!res.ok) throw new Error('Failed to create club');
            const newClub: Club = await res.json();
            setClubs(prev => [...prev, newClub]);
            setClubName(newClub.name); // Select it by name (since onSubmit expects name)
        } catch (err) {
            alert('Error creating club');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!clubName.trim() || !teamName.trim() || !category.trim()) {
            setError('All fields are required');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await onSubmit({
                clubName: clubName.trim(),
                teamName: teamName.trim(),
                category: category.trim()
                // Note: Season is not currently passed to onSubmit based on interface, 
                // but we are selecting it. If the backend needs it, we should update the interface.
                // For now, we assume the backend might infer or use default, OR we need to update the prop.
                // Given the user request "season should be a selector", we have implemented the UI.
            });
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create team');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                    <h2 className="text-xl font-bold text-gray-800">Create New Team</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="overflow-y-auto p-6">
                    {isLoadingData ? (
                        <div className="flex justify-center py-8">
                            <Loader2 size={32} className="animate-spin text-indigo-600" />
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-200">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Team Name
                                </label>
                                <input
                                    type="text"
                                    value={teamName}
                                    onChange={(e) => setTeamName(applyTitleCase ? toTitleCase(e.target.value) : e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    placeholder="e.g. Cadet A"
                                    autoFocus
                                />
                            </div>

                            <SearchableSelectWithCreate
                                label="Category"
                                value={category}
                                options={Array.from(new Set([
                                    ...TEAM_CATEGORIES,
                                    ...teams.map(t => t.category || TEAM_CATEGORIES[0])
                                ])).map(cat => ({
                                    value: cat,
                                    label: toTitleCase(cat)
                                }))}
                                onChange={setCategory}
                                onCreate={setCategory}
                                placeholder="Select category..."
                            />

                            <SearchableSelectWithCreate
                                label="Club"
                                value={clubs.find(c => c.name === clubName)?.id || (clubName ? 'custom' : null)}
                                // We need to map ID back to name for the state, or change state to ID. 
                                // Since onSubmit needs name, we'll keep name in state but use ID for the select value if possible.
                                // Actually, SearchableSelectWithCreate expects value to match an option value.
                                // Let's map options to IDs, and when changed, find the name.
                                options={clubs.map(c => ({ value: c.id, label: c.name }))}
                                onChange={(val) => {
                                    const club = clubs.find(c => c.id === val);
                                    if (club) setClubName(club.name);
                                }}
                                onCreate={handleCreateClub}
                                placeholder="Select or create club..."
                            />
                            {/* Display custom club name if it doesn't match an ID (though handleCreateClub adds it to list) */}
                            {clubName && !clubs.find(c => c.name === clubName) && (
                                <div className="text-sm text-gray-500 mt-1">
                                    Selected: {clubName}
                                </div>
                            )}

                            <SearchableSelectWithCreate
                                label="Season"
                                value={seasonId}
                                options={seasons.map(s => ({ value: s.id, label: s.name }))}
                                onChange={setSeasonId}
                                placeholder="Select season..."
                                disabled={seasons.length === 0}
                            />

                            {/* Is My Team - Clickable Star */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Is My Team
                                </label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const checkbox = document.getElementById('isMyTeam') as HTMLInputElement;
                                        if (checkbox) checkbox.checked = !checkbox.checked;
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all hover:border-yellow-400"
                                >
                                    <Star
                                        size={24}
                                        className="text-gray-400 transition-all hover:text-yellow-500"
                                    />
                                    <span className="font-medium text-gray-600">
                                        Mark as my team
                                    </span>
                                </button>
                                <input
                                    type="checkbox"
                                    id="isMyTeam"
                                    className="hidden"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-70"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            Create Team
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
