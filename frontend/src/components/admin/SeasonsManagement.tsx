import { CrudManager } from './shared/CrudManager';
import type { Season, CrudConfig } from '../../types';

const seasonsConfig: CrudConfig<Season> = {
    entityName: 'Season',
    entityNamePlural: 'Seasons',
    apiEndpoint: '/api/seasons',

    columns: [
        {
            key: 'name',
            label: 'Name',
        },
        {
            key: 'startDate',
            label: 'Start Date',
            render: (season) => new Date(season.startDate).toLocaleDateString(),
        },
        {
            key: 'endDate',
            label: 'End Date',
            render: (season) => new Date(season.endDate).toLocaleDateString(),
        },
    ],

    formFields: [
        {
            name: 'name',
            label: 'Season Name',
            type: 'text',
            required: true,
            placeholder: 'e.g. 2024-2025',
        },
        {
            name: 'startDate',
            label: 'Start Date',
            type: 'date',
            required: true,
        },
        {
            name: 'endDate',
            label: 'End Date',
            type: 'date',
            required: true,
        },
    ],

    searchFields: ['name'],

    formatFormData: (data) => ({
        ...data,
        // Ensure dates are in the correct format if needed, though input type="date" usually handles YYYY-MM-DD
    }),
};

export const SeasonsManagement = () => {
    return <CrudManager<Season> config={seasonsConfig} />;
};

