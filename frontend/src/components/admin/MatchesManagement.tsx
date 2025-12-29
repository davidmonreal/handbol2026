import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Calendar, Edit2, Volleyball, Youtube } from 'lucide-react';
import { CrudManager } from './shared/CrudManager';
import { API_BASE_URL } from '../../config/api';
import { useDataRefresh } from '../../context/DataRefreshContext';
import type { Team, CrudConfig } from '../../types';

// Define Match interface locally or import if available
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

export const MatchesManagement = () => {
    const navigate = useNavigate();
    const { refreshToken } = useDataRefresh();
    const [teams, setTeams] = useState<Team[]>([]);

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/teams`);
                const data = await response.json();
                setTeams(data);
            } catch (error) {
                console.error('Error fetching teams:', error);
            }
        };
        fetchTeams();
    }, []);

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

    const matchesConfig: CrudConfig<Match> = {
        entityName: 'Match',
        entityNamePlural: 'Matches',
        apiEndpoint: '/api/matches',

        columns: [
            {
                key: 'date',
                label: 'Date',
                render: (match) => (
                    <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        {formatDate(match.date)}
                    </div>
                ),
            },
            {
                key: 'homeTeam',
                label: 'Home Team',
                render: (match) => (
                    <div className="text-right">
                        <div
                            className={`text-gray-900 ${match.isFinished && (match.homeScore ?? 0) > (match.awayScore ?? 0) ? 'font-extrabold' : 'font-medium'}`}
                        >
                            {match.homeTeam.category && `${match.homeTeam.category} `}{match.homeTeam.name}
                        </div>
                        {match.homeTeam.club && <div className="text-xs text-gray-500">{match.homeTeam.club.name}</div>}
                    </div>
                ),
            },
            {
                key: 'isFinished', // Using isFinished as key for the result column
                label: 'Result',
                render: (match) => (
                    <div className="text-center font-bold">
                        {match.isFinished ? (
                            <span className="inline-flex items-center gap-1 font-bold text-gray-900 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                                <span>{match.homeScore ?? 0}</span>
                                <span className="text-gray-400">:</span>
                                <span>{match.awayScore ?? 0}</span>
                            </span>
                        ) : (
                            <span className="text-gray-400 flex items-center justify-center gap-1">
                                <span>-</span>
                                <span>:</span>
                                <span>-</span>
                            </span>
                        )}
                    </div>
                ),
            },
            {
                key: 'awayTeam',
                label: 'Away Team',
                render: (match) => (
                    <div className="text-left">
                        <div
                            className={`text-gray-900 ${match.isFinished && (match.awayScore ?? 0) > (match.homeScore ?? 0) ? 'font-extrabold' : 'font-medium'}`}
                        >
                            {match.awayTeam.category && `${match.awayTeam.category} `}{match.awayTeam.name}
                        </div>
                        {match.awayTeam.club && <div className="text-xs text-gray-500">{match.awayTeam.club.name}</div>}
                    </div>
                ),
            },
            {
                key: 'status', // Virtual key
                label: 'Status',
                render: (match) => (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${match.isFinished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {match.isFinished ? 'Finished' : 'Scheduled'}
                    </span>
                ),
            },
        ],

        formFields: [
            {
                name: 'date',
                label: 'Date',
                type: 'date',
                required: true,
            },
            {
                name: 'time', // Virtual field, needs handling in formatFormData
                label: 'Time',
                type: 'text', // Using text for time input as 'time' type isn't explicitly supported in FormFieldConfig yet, but we can add it or use text with placeholder
                placeholder: 'HH:MM',
                required: true,
            },
            {
                name: 'homeTeamId',
                label: 'Home Team',
                type: 'select',
                required: true,
                options: teams.map(t => ({
                    value: t.id,
                    label: `${t.category ? t.category + ' ' : ''}${t.name} ${t.club ? '(' + t.club.name + ')' : ''}`
                })),
            },
            {
                name: 'awayTeamId',
                label: 'Away Team',
                type: 'select',
                required: true,
                options: teams.map(t => ({
                    value: t.id,
                    label: `${t.category ? t.category + ' ' : ''}${t.name} ${t.club ? '(' + t.club.name + ')' : ''}`
                })),
            },
        ],

        searchFields: ['homeTeam', 'awayTeam'], // Searching by object keys might need specific handling in CrudManager or backend
        customFilter: (match, searchTerm) => {
            if (!searchTerm) return true;
            const term = searchTerm.toLowerCase();

            const homeHits = [
                match.homeTeam?.name,
                match.homeTeam?.category,
                match.homeTeam?.club?.name,
            ].some(val => val?.toLowerCase().includes(term));

            const awayHits = [
                match.awayTeam?.name,
                match.awayTeam?.category,
                match.awayTeam?.club?.name,
            ].some(val => val?.toLowerCase().includes(term));

            const statusHit = match.isFinished
                ? 'finished'.includes(term)
                : 'scheduled'.includes(term);

            const resultHit = match.isFinished && `${match.homeScore ?? 0}:${match.awayScore ?? 0}`.includes(term);

            const dateHit = new Date(match.date).toLocaleString('ca-ES', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).toLowerCase().includes(term);

            return homeHits || awayHits || statusHit || resultHit || dateHit;
        },

        // Navigate to create/edit pages instead of using modal
        onCreate: () => navigate('/matches/new'),
        onEdit: (match) => navigate(`/matches/${match.id}/edit`),

        formatFormData: (data) => {
            // Combine date and time
            const dateStr = data.date as string;
            const timeStr = (data.time as string) || '12:00';

            const parsedDateTime = new Date(`${dateStr}T${timeStr}`);
            const dateTime = Number.isNaN(parsedDateTime.getTime())
                ? new Date()
                : parsedDateTime;

            return {
                date: dateTime.toISOString(),
                homeTeamId: data.homeTeamId as string,
                awayTeamId: data.awayTeamId as string,
            } as Partial<Match>;
        },

        mapItemToForm: (match) => {
            const dateObj = new Date(match.date);
            // Format date as YYYY-MM-DD for input[type="date"]
            const dateStr = dateObj.toISOString().split('T')[0];
            // Format time as HH:MM for input[type="text"] or input[type="time"]
            const timeStr = dateObj.toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit', hour12: false });

            return {
                date: dateStr,
                time: timeStr,
                homeTeamId: match.homeTeamId,
                awayTeamId: match.awayTeamId,
            };
        },

        customActions: [
            {
                icon: Edit2,
                label: 'Edit Match',
                onClick: (match) => navigate(`/matches/${match.id}/edit`),
                className: 'text-indigo-600 hover:text-indigo-900 mr-3',
            },
            {
                icon: Volleyball,
                label: 'Match Tracker',
                onClick: (match) => navigate(`/match-tracker/${match.id}`),
                className: 'text-orange-600 hover:text-orange-900 mr-3',
            },
            {
                icon: Youtube,
                label: 'Add YouTube Link',
                onClick: (match) => navigate(`/video-tracker/${match.id}`),
                className: 'text-red-600 hover:text-red-900 mr-3',
            },
            {
                icon: BarChart3,
                label: 'View Statistics',
                onClick: (match) => navigate(`/statistics?matchId=${match.id}`),
                className: 'text-green-600 hover:text-green-900',
            },
        ],
        hideDefaultActions: true,
    };

    return <CrudManager<Match> config={matchesConfig} refreshToken={refreshToken} />;
};
