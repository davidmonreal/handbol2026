import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Calendar, Trash2 } from 'lucide-react';
import { API_BASE_URL } from '../../../config/api';
import { SearchableSelectWithCreate } from '../../common/SearchableSelectWithCreate';
import type { Team } from '../../../types';

interface Match {
    id: string;
    date: string;
    homeTeamId: string;
    awayTeamId: string;
    homeTeam: { id: string; name: string; category?: string; club?: { name: string } };
    awayTeam: { id: string; name: string; category?: string; club?: { name: string } };
    isFinished: boolean;
    homeScore?: number;
    awayScore?: number;
}

export const MatchFormPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const isEditMode = !!id;
    const fromPath = (location.state as { from?: string } | undefined)?.from;

    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Data
    const [teams, setTeams] = useState<Team[]>([]);

    // Form State
    const [dateValue, setDateValue] = useState('');
    const [timeValue, setTimeValue] = useState('12:00');
    const [selectedHomeTeamId, setSelectedHomeTeamId] = useState<string | null>(null);
    const [selectedAwayTeamId, setSelectedAwayTeamId] = useState<string | null>(null);
    const [status, setStatus] = useState<'SCHEDULED' | 'FINISHED'>('SCHEDULED');
    const [homeScore, setHomeScore] = useState<string>('');
    const [awayScore, setAwayScore] = useState<string>('');

    // Initial Data Loading
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const teamsRes = await fetch(`${API_BASE_URL}/api/teams`);
                const teamsData = await teamsRes.json();
                setTeams(teamsData);

                // If Edit Mode, Load Match
                if (isEditMode) {
                    const matchRes = await fetch(`${API_BASE_URL}/api/matches/${id}`);
                    if (!matchRes.ok) throw new Error('Match not found');
                    const match: Match = await matchRes.json();

                    const dateObj = new Date(match.date);
                    setDateValue(dateObj.toISOString().split('T')[0]);
                    setTimeValue(dateObj.toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit', hour12: false }));
                    setSelectedHomeTeamId(match.homeTeamId);
                    setSelectedAwayTeamId(match.awayTeamId);
                    setStatus(match.isFinished ? 'FINISHED' : 'SCHEDULED');
                    setHomeScore(match.homeScore?.toString() ?? '');
                    setAwayScore(match.awayScore?.toString() ?? '');
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

    const handleSave = async () => {
        if (!dateValue || !timeValue || !selectedHomeTeamId || !selectedAwayTeamId) {
            setError('All fields are required');
            return;
        }

        if (selectedHomeTeamId === selectedAwayTeamId) {
            setError('Home and Away teams must be different');
            return;
        }

        // Validate that finished matches have a result set
        if (status === 'FINISHED') {
            const homeScoreNum = homeScore !== '' ? parseInt(homeScore) : 0;
            const awayScoreNum = awayScore !== '' ? parseInt(awayScore) : 0;
            
            if (homeScoreNum === 0 && awayScoreNum === 0) {
                setError('Finished matches must have a result (score cannot be 0-0)');
                return;
            }
        }

        setIsSaving(true);
        setError(null);

        try {
            const dateTime = new Date(`${dateValue}T${timeValue}`);

            const matchData = {
                date: dateTime.toISOString(),
                homeTeamId: selectedHomeTeamId,
                awayTeamId: selectedAwayTeamId,
                isFinished: status === 'FINISHED',
                homeScore: status === 'FINISHED' ? parseInt(homeScore || '0') : undefined,
                awayScore: status === 'FINISHED' ? parseInt(awayScore || '0') : undefined
            };

            const method = isEditMode ? 'PUT' : 'POST';
            const url = isEditMode
                ? `${API_BASE_URL}/api/matches/${id}`
                : `${API_BASE_URL}/api/matches`;

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(matchData)
            });

            if (!res.ok) throw new Error('Failed to save match');

            const homeTeam = teams.find(t => t.id === selectedHomeTeamId);
            const awayTeam = teams.find(t => t.id === selectedAwayTeamId);
            const successMessage = `Match ${isEditMode ? 'updated' : 'created'}: ${homeTeam?.name || 'Team'} vs ${awayTeam?.name || 'Team'}`;

            if (fromPath) {
                navigate(fromPath, { state: { message: successMessage } });
            } else if (window.history.length > 1) {
                navigate(-1);
            } else {
                navigate('/matches', { state: { message: successMessage } });
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save match');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!isEditMode || !id) return;
        const confirmed = window.confirm('Delete this match? This cannot be undone.');
        if (!confirmed) return;
        setIsDeleting(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE_URL}/api/matches/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete match');
            navigate('/matches', { state: { message: 'Match deleted' } });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete match');
        } finally {
            setIsDeleting(false);
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
                        if (fromPath) {
                            navigate(fromPath);
                        } else if (window.history.length > 1) {
                            navigate(-1);
                        } else {
                            navigate('/matches');
                        }
                    }}
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-3xl font-bold text-gray-800">
                    {isEditMode ? 'Edit Match' : 'New Match'}
                </h1>
            </div>

            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* Form */}
            <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Date *
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="date"
                                value={dateValue}
                                onChange={(e) => setDateValue(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Time *
                        </label>
                        <input
                            type="time"
                            value={timeValue}
                            onChange={(e) => setTimeValue(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        />
                    </div>
                </div>

                {/* Home Team */}
                <SearchableSelectWithCreate
                    label="Home Team *"
                    value={selectedHomeTeamId}
                    options={teams.map(t => ({
                        value: t.id,
                        label: [t.club?.name, t.category, t.name].filter(Boolean).join(' ') || t.name,
                    }))}
                    onChange={setSelectedHomeTeamId}
                    placeholder="Select home team..."
                />

                {/* Away Team */}
                <SearchableSelectWithCreate
                    label="Away Team *"
                    value={selectedAwayTeamId}
                    options={teams.map(t => ({
                        value: t.id,
                        label: [t.club?.name, t.category, t.name].filter(Boolean).join(' ') || t.name,
                    }))}
                    onChange={setSelectedAwayTeamId}
                    placeholder="Select away team..."
                />

                {/* Match Status & Score */}
                <div className="border-t border-gray-100 pt-6">
                    <div className="flex items-center justify-between mb-4">
                        <label className="text-sm font-medium text-gray-700">Match Status</label>
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button
                                type="button"
                                onClick={() => setStatus('SCHEDULED')}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${status === 'SCHEDULED' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Scheduled
                            </button>
                            <button
                                type="button"
                                onClick={() => setStatus('FINISHED')}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${status === 'FINISHED' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Finished
                            </button>
                        </div>
                    </div>

                    {status === 'FINISHED' && (
                        <div className="grid grid-cols-2 gap-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="text-right">
                                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">
                                    Home Score
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={homeScore}
                                    onChange={(e) => setHomeScore(e.target.value)}
                                    placeholder="0"
                                    className="w-24 text-center text-2xl font-bold text-gray-900 border-b-2 border-gray-300 focus:border-indigo-500 bg-transparent outline-none p-2"
                                />
                            </div>
                            <div className="text-left">
                                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">
                                    Away Score
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={awayScore}
                                    onChange={(e) => setAwayScore(e.target.value)}
                                    placeholder="0"
                                    className="w-24 text-center text-2xl font-bold text-gray-900 border-b-2 border-gray-300 focus:border-red-500 bg-transparent outline-none p-2"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Preview */}
                {selectedHomeTeamId && selectedAwayTeamId && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-semibold text-blue-900 mb-2">Match Preview</h3>
                        <div className="flex items-center justify-center gap-4 text-lg">
                            <div className="text-right flex-1">
                                <div className="font-bold">
                                    {(() => {
                                        const t = teams.find(team => team.id === selectedHomeTeamId);
                                        return t ? `${t.category ? t.category + ' ' : ''}${t.name}` : '';
                                    })()}
                                </div>
                                <div className="text-sm text-gray-500">
                                    {teams.find(t => t.id === selectedHomeTeamId)?.club?.name}
                                </div>
                            </div>

                            <div className="flex flex-col items-center min-w-[80px]">
                                {status === 'FINISHED' ? (
                                    <div className="flex items-center gap-2 text-3xl font-bold text-gray-900 px-3 py-1">
                                        <span>{homeScore || '0'}</span>
                                        <span className="text-gray-400 text-2xl">:</span>
                                        <span>{awayScore || '0'}</span>
                                    </div>
                                ) : (
                                    <span className="text-gray-400 font-bold px-2 text-xl">vs</span>
                                )}
                            </div>

                            <div className="text-left flex-1">
                                <div className="font-bold">
                                    {(() => {
                                        const t = teams.find(team => team.id === selectedAwayTeamId);
                                        return t ? `${t.category ? t.category + ' ' : ''}${t.name}` : '';
                                    })()}
                                </div>
                                <div className="text-sm text-gray-500">
                                    {teams.find(t => t.id === selectedAwayTeamId)?.club?.name}
                                </div>
                            </div>
                        </div>
                        {dateValue && timeValue && (
                            <p className="text-sm text-gray-600 text-center mt-2">
                                {new Date(`${dateValue}T${timeValue}`).toLocaleString('ca-ES', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-between items-center pt-4 border-t">
                    {isEditMode ? (
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="inline-flex items-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                            <Trash2 size={18} />
                            {isDeleting ? 'Deleting...' : 'Delete Match'}
                        </button>
                    ) : <div /> }
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate('/matches')}
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
                            {isSaving ? 'Saving...' : isEditMode ? 'Update Match' : 'Create Match'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
