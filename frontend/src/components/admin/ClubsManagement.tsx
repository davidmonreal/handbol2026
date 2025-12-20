import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CrudManager } from './shared/CrudManager';
import type { Club, CrudConfig } from '../../types';

export const ClubsManagement = () => {
    const navigate = useNavigate();

    const clubsConfig: CrudConfig<Club> = useMemo(() => ({
        entityName: 'Club',
        entityNamePlural: 'Clubs',
        apiEndpoint: '/api/clubs',
        defaultSort: { key: 'name', direction: 'asc' },

        columns: [
            {
                key: 'name',
                label: 'Name',
            },
        ],

        formFields: [
            {
                name: 'name',
                label: 'Club Name',
                type: 'text',
                required: true,
                placeholder: 'Enter club name',
            },
        ],

        searchFields: ['name'],
        onAfterSave: (club) => {
            // Offer quick follow-up to create a team for the new club.
            const goToTeam = window.confirm('Create a team for this club now?');
            if (goToTeam) {
                navigate('/teams/new', {
                    state: {
                        prefillClubId: club.id,
                        from: '/clubs',
                        next: 'team-players',
                    },
                    replace: true,
                });
            }
        },
    }), [navigate]);

    return <CrudManager<Club> config={clubsConfig} />;
};
