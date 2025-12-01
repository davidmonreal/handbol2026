import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, BarChart3, Star } from 'lucide-react';
import { CrudManager } from './shared/CrudManager';
import { TeamPlayersModal } from './TeamPlayersModal';
import { API_BASE_URL } from '../../config/api';
import type { Team, Club, Season, CrudConfig } from '../../types';

const CATEGORIES = ['BENJAMI', 'ALEVI', 'INFANTIL', 'CADET', 'JUVENIL', 'SENIOR'];

export const TeamsManagement = () => {
    const navigate = useNavigate();
    const [clubs, setClubs] = useState<Club[]>([]);
    const [seasons, setSeasons] = useState<Season[]>([]);
    const [selectedTeamForPlayers, setSelectedTeamForPlayers] = useState<Team | null>(null);
    const [isPlayersModalOpen, setIsPlayersModalOpen] = useState(false);

    // We need a key to force re-render of CrudManager when we want to refresh data
    // or we can just rely on CrudManager's internal state if we don't need to force refresh from outside
    // But here, when players are updated in the modal, we might want to refresh the main table to show updated player counts
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [clubsRes, seasonsRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/api/clubs`),
                    fetch(`${API_BASE_URL}/api/seasons`)
                ]);

                const clubsData = await clubsRes.json();
                const seasonsData = await seasonsRes.json();

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

        searchFields: ['name'], // Note: 'club' and 'category' search would require client-side filtering logic in CrudManager or backend support

        customActions: [
            {
                icon: BarChart3,
                label: 'View Statistics',
                onClick: (team) => navigate(`/statistics?teamId=${team.id}`),
                className: 'text-green-600 hover:text-green-900 mr-4',
            },
            {
                icon: Users,
                label: 'Manage Players',
                onClick: (team) => {
                    setSelectedTeamForPlayers(team);
                    setIsPlayersModalOpen(true);
                },
                className: 'text-blue-600 hover:text-blue-900 mr-4',
            },
        ],
    };

    return (
        <>
            <CrudManager<Team> key={refreshKey} config={teamsConfig} />

            {selectedTeamForPlayers && (
                <TeamPlayersModal
                    team={selectedTeamForPlayers}
                    isOpen={isPlayersModalOpen}
                    onClose={() => {
                        setIsPlayersModalOpen(false);
                        setSelectedTeamForPlayers(null);
                    }}
                    onUpdate={() => {
                        // Refresh the main table to show updated player counts
                        setRefreshKey(prev => prev + 1);
                    }}
                />
            )}
        </>
    );
};
