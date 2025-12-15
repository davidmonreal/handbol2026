import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, BarChart3, Star } from 'lucide-react';
import { CrudManager } from './shared/CrudManager';
import { API_BASE_URL } from '../../config/api';
import type { Team, Club, Season, CrudConfig } from '../../types';

const CATEGORIES = ['BENJAMI', 'ALEVI', 'INFANTIL', 'CADET', 'JUVENIL', 'SENIOR'];

export const sortTeamsByOwnership = (teams: Team[]) => {
    return [...teams].sort((a, b) => {
        const aMine = Boolean(a.isMyTeam);
        const bMine = Boolean(b.isMyTeam);
        if (aMine !== bMine) {
            return aMine ? -1 : 1;
        }
        const clubCompare = (a.club?.name || '').localeCompare(b.club?.name || '');
        if (clubCompare !== 0) {
            return clubCompare;
        }
        return a.name.localeCompare(b.name);
    });
};

export const TeamsManagement = () => {
    const navigate = useNavigate();
    const [clubs, setClubs] = useState<Club[]>([]);
    const [seasons, setSeasons] = useState<Season[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [clubsRes, seasonsRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/api/clubs`),
                    fetch(`${API_BASE_URL}/api/seasons`)
                ]);

                const clubsData = await clubsRes.json();
                const seasonsData = await seasonsRes.json();

                // Sort data for dropdowns
                clubsData.sort((a: Club, b: Club) => a.name.localeCompare(b.name));
                seasonsData.sort((a: Season, b: Season) => a.name.localeCompare(b.name));

                setClubs(clubsData);
                setSeasons(seasonsData);
            } catch (error) {
                console.error('Error fetching dependencies:', error);
            }
        };

        fetchData();
    }, []);

    const teamsConfig: CrudConfig<Team> = {
        entityName: 'Team',
        entityNamePlural: 'Teams',
        apiEndpoint: '/api/teams',
        defaultSort: { key: 'name', direction: 'asc' },

        sortItems: sortTeamsByOwnership,
        columns: [
            {
                key: 'club',
                label: 'Club',
                render: (team) => team.club?.name || '-',
            },
            {
                key: 'category',
                label: 'Category',
                render: (team) => (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        {team.category || 'SENIOR'}
                    </span>
                ),
            },
            {
                key: 'name',
                label: 'Team',
                render: (team) => (
                    <div className="flex items-center gap-2 font-medium">
                        {team.name}
                        {team.isMyTeam && <Star size={16} className="text-yellow-500 fill-yellow-500" />}
                    </div>
                ),
            },
            {
                key: 'season',
                label: 'Season',
                render: (team) => team.season?.name || '-',
            },
            {
                key: 'players',
                label: 'Players',
                render: (team) => (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {team.players?.length || 0} players
                    </span>
                ),
            },
        ],

        formFields: [
            {
                name: 'name',
                label: 'Team Name',
                type: 'text',
                required: true,
                placeholder: 'e.g. Cadet A',
            },
            {
                name: 'category',
                label: 'Category',
                type: 'select',
                required: true,
                options: CATEGORIES.map(cat => ({ value: cat, label: cat })),
            },
            {
                name: 'clubId',
                label: 'Club',
                type: 'select',
                required: true,
                options: clubs.map(c => ({ value: c.id, label: c.name })),
            },
            {
                name: 'seasonId',
                label: 'Season',
                type: 'select',
                required: true,
                options: seasons.map(s => ({ value: s.id, label: s.name })),
            },
            {
                name: 'isMyTeam',
                label: 'Is My Team',
                type: 'checkbox',
            },
        ],

        searchFields: ['name'],

        customFilter: (team: Team, searchTerm: string) => {
            // Search by team name
            if (team.name.toLowerCase().includes(searchTerm)) return true;
            // Search by club name
            if (team.club?.name.toLowerCase().includes(searchTerm)) return true;
            // Search by category
            if (team.category?.toLowerCase().includes(searchTerm)) return true;
            // Search by season
            if (team.season?.name.toLowerCase().includes(searchTerm)) return true;
            return false;
        },

        // Navigate to create/edit pages instead of using modal
        onCreate: () => navigate('/teams/new'),
        onEdit: (team) => navigate(`/teams/${team.id}/edit`),

        customActions: [
            {
                icon: BarChart3,
                label: 'View Statistics',
                onClick: (team) => navigate(`/statistics?teamId=${team.id}`),
            },
            {
                icon: Users,
                label: 'Manage Players',
                onClick: (team) => navigate(`/teams/${team.id}/players`),
                className: 'text-blue-600 hover:text-blue-900 mr-4',
            },
        ],
    };

    return <CrudManager<Team> config={teamsConfig} />;
};
