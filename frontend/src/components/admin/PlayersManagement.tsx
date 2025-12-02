import { useNavigate } from 'react-router-dom';
import { BarChart3, Upload } from 'lucide-react';
import { CrudManager } from './shared/CrudManager';
import type { Player, CrudConfig } from '../../types';

export const PlayersManagement = () => {
    const navigate = useNavigate();

    const playersConfig: CrudConfig<Player> = {
        entityName: 'Player',
        entityNamePlural: 'Players',
        apiEndpoint: '/api/players',

        columns: [
            {
                key: 'name',
                label: 'Name',
            },
            {
                key: 'number',
                label: 'Number',
                render: (player) => `#${player.number}`,
            },
            {
                key: 'teams',
                label: 'Club(s)',
                render: (player) => {
                    if (!player.teams || player.teams.length === 0) {
                        return <span className="text-gray-400 italic">No club</span>;
                    }
                    const uniqueClubs = Array.from(new Set(player.teams.map(t => t.team.club.name)));
                    return (
                        <div className="flex flex-wrap gap-1">
                            {uniqueClubs.map(clubName => (
                                <span key={clubName} className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                    {clubName}
                                </span>
                            ))}
                        </div>
                    );
                },
            },
            {
                key: 'handedness',
                label: 'Handedness',
            },
            {
                key: 'isGoalkeeper',
                label: 'Goalkeeper',
                render: (player) => player.isGoalkeeper ? (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                        GK
                    </span>
                ) : (
                    <span className="text-gray-400">-</span>
                ),
            },
        ],

        // No formFields = no modal, we navigate to a dedicated page instead
        formFields: [],

        searchFields: ['name'],

        customFilter: (player: Player, searchTerm: string) => {
            const term = searchTerm.toLowerCase();
            // Check name
            if (player.name.toLowerCase().includes(term)) return true;

            // Check clubs
            if (player.teams && player.teams.length > 0) {
                return player.teams.some(t => t.team.club.name.toLowerCase().includes(term));
            }

            return false;
        },

        // Navigate to edit page instead of opening modal
        onEdit: (player) => navigate(`/players/${player.id}/edit`),

        // Navigate to create page instead of opening modal
        onCreate: () => navigate('/players/new'),

        customActions: [
            {
                icon: BarChart3,
                label: 'View Statistics',
                onClick: (player) => navigate(`/statistics?playerId=${player.id}`),
                className: 'text-green-600 hover:text-green-900 mr-4',
            },
        ],

        headerActions: (
            <button
                onClick={() => navigate('/players/import')}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
                <Upload size={20} />
                Import Players
            </button>
        ),
    };

    return <CrudManager<Player> config={playersConfig} />;
};
