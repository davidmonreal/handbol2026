import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Upload } from 'lucide-react';
import { CrudManager } from './shared/CrudManager';
import { SearchableSelectWithCreate } from '../common/SearchableSelectWithCreate';
import { API_BASE_URL } from '../../config/api';
import type { Player, Club, CrudConfig } from '../../types';

export const PlayersManagement = () => {
    const navigate = useNavigate();
    const [clubs, setClubs] = useState<Club[]>([]);
    const [selectedClubId, setSelectedClubId] = useState<string>('');

    useEffect(() => {
        const fetchClubs = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/clubs`);
                const data = await response.json();
                if (Array.isArray(data)) {
                    // Sort clubs alphabetically
                    data.sort((a: Club, b: Club) => a.name.localeCompare(b.name));
                    setClubs(data);
                }
            } catch (error) {
                console.error('Error fetching clubs:', error);
            }
        };
        fetchClubs();
    }, []);

    const clubOptions = [
        { value: '', label: 'All Clubs' },
        ...clubs.map(club => ({ value: club.id, label: club.name }))
    ];

    const playersConfig: CrudConfig<Player> = {
        entityName: 'Player',
        entityNamePlural: 'Players',
        apiEndpoint: '/api/players',
        pagination: true,
        defaultSort: { key: 'name', direction: 'asc' },

        columns: [
            {
                key: 'name',
                label: 'Name',
                render: (player) => (
                    <div className="flex items-center gap-2">
                        <span className="font-medium">{player.name}</span>
                        {player.isGoalkeeper && (
                            <span className="px-1.5 py-0.5 text-xs font-semibold rounded bg-purple-100 text-purple-800">
                                GK
                            </span>
                        )}
                    </div>
                ),
            },
            {
                key: 'number',
                label: 'Number',
                render: (player) => `#${player.number}`,
            },
            {
                key: 'clubDisplay',
                label: 'Club',
                render: (player) => {
                    if (!player.teams || player.teams.length === 0) {
                        return <span className="text-gray-400 italic">-</span>;
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
                key: 'categoryDisplay',
                label: 'Category',
                render: (player) => {
                    if (!player.teams || player.teams.length === 0) {
                        return <span className="text-gray-400 italic">-</span>;
                    }
                    const uniqueCategories = Array.from(new Set(player.teams.map(t => t.team.category).filter(Boolean)));
                    return (
                        <div className="flex flex-wrap gap-1">
                            {uniqueCategories.map(category => (
                                <span key={category} className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700">
                                    {category}
                                </span>
                            ))}
                        </div>
                    );
                },
            },
            {
                key: 'teamDisplay',
                label: 'Team',
                render: (player) => {
                    if (!player.teams || player.teams.length === 0) {
                        return <span className="text-gray-400 italic">-</span>;
                    }
                    return (
                        <div className="flex flex-wrap gap-1">
                            {player.teams.map((t, idx) => (
                                <span key={idx} className="text-sm text-gray-700">
                                    {t.team.name}
                                </span>
                            ))}
                        </div>
                    );
                },
            },
        ],

        formFields: [],

        searchFields: ['name'],
        requireSearchBeforeFetch: true,
        minSearchLength: 2,
        allowFetchWithoutSearchIfFilters: true,

        // Server-side filtering by clubId
        serverFilters: selectedClubId ? { clubId: selectedClubId } : undefined,

        requireSearchToCreate: true,

        onEdit: (player) => navigate(`/players/${player.id}/edit`),
        onCreate: () => navigate('/players/new'),

        customActions: [
            {
                icon: BarChart3,
                label: 'View Statistics',
                onClick: (player) => navigate(`/statistics?playerId=${player.id}`),
                className: 'text-green-600 hover:text-green-900 mr-4',
            },
        ],

        headerActions: ({ searchTerm }) => (
            <button
                onClick={() => navigate('/players/import')}
                disabled={!searchTerm}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={!searchTerm ? "Search to enable import" : "Import Players"}
            >
                <Upload size={20} />
                Import Players
            </button>
        ),

        // Club filter aligned with search bar
        filterSlot: (
            <div className="w-64 flex items-center">
                <SearchableSelectWithCreate
                    label=""
                    value={selectedClubId}
                    options={clubOptions}
                    onChange={(value) => setSelectedClubId(value)}
                    placeholder="Filter by Club..."
                    className="w-full"
                />
            </div>
        ),
    };

    return <CrudManager<Player> key={selectedClubId} config={playersConfig} />;
};
