import { CrudManager } from './shared/CrudManager';
import type { Club, CrudConfig } from '../../types';

const clubsConfig: CrudConfig<Club> = {
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
};

export const ClubsManagement = () => {
    return <CrudManager<Club> config={clubsConfig} />;
};
