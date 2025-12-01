import { useNavigate } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';
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

        formFields: [
            {
                name: 'name',
                label: 'Player Name',
                type: 'text',
                required: true,
                placeholder: 'e.g. John Doe',
            },
            {
                name: 'number',
                label: 'Number',
                type: 'number',
                required: true,
                placeholder: 'e.g. 7',
            },
            {
                name: 'handedness',
                label: 'Handedness',
                type: 'select',
                required: true,
                options: [
                    { value: 'RIGHT', label: 'Right' },
                    { value: 'LEFT', label: 'Left' },
                ],
            },
            {
                name: 'isGoalkeeper',
                label: 'Is Goalkeeper',
                type: 'checkbox',
            },
        ],

        searchFields: ['name'], // Note: Complex search like club name might need backend support or custom filter logic in CrudManager if strictly client-side

        formatFormData: (data) => ({
            ...data,
            number: typeof data.number === 'string' ? parseInt(data.number, 10) : (data.number as number),
        }),

        customActions: [
            {
                icon: BarChart3,
                label: 'View Statistics',
                onClick: (player) => navigate(`/statistics?playerId=${player.id}`),
                className: 'text-green-600 hover:text-green-900 mr-4',
            },
        ],
    };

    return <CrudManager<Player> config={playersConfig} />;
};
