import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CrudManager } from './CrudManager';
import type { CrudConfig } from '../../../types';

// Mock API
const mockFetch = vi.fn();
globalThis.fetch = mockFetch as any;


// Mock Config
interface TestItem {
    id: string;
    name: string;
    value: number;
}

const testConfig: CrudConfig<TestItem> = {
    entityName: 'Test Item',
    entityNamePlural: 'Test Items',
    apiEndpoint: '/api/test',
    columns: [
        { key: 'name', label: 'Name' },
        { key: 'value', label: 'Value' },
    ],
    formFields: [
        { name: 'name', label: 'Name', type: 'text', required: true },
        { name: 'value', label: 'Value', type: 'number', required: true },
    ],
    searchFields: ['name'],
};

describe('CrudManager', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => [],
        });
    });

    it('renders the component title', async () => {
        render(<CrudManager config={testConfig} />);
        expect(screen.getByText('Test Items Management')).toBeInTheDocument();
    });

    it('fetches items on mount', async () => {
        render(<CrudManager config={testConfig} />);
        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/test'));
    });

    it('opens the form when "New" button is clicked', async () => {
        render(<CrudManager config={testConfig} />);

        // Wait for loading to complete
        await waitFor(() => {
            expect(screen.getByText('New Test Item')).toBeInTheDocument();
        });

        const newButton = screen.getByText('New Test Item');
        fireEvent.click(newButton);

        expect(screen.getByText('New Test Item', { selector: 'h2' })).toBeInTheDocument();
        expect(screen.getByLabelText('Name')).toBeInTheDocument();
    });

    it('displays items in the table', async () => {
        const mockItems = [
            { id: '1', name: 'Item 1', value: 100 },
            { id: '2', name: 'Item 2', value: 200 },
        ];

        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => mockItems,
        });

        render(<CrudManager config={testConfig} />);

        await waitFor(() => {
            expect(screen.getByText('Item 1')).toBeInTheDocument();
            expect(screen.getByText('Item 2')).toBeInTheDocument();
        });
    });

    it('filters items based on search', async () => {
        const mockItems = [
            { id: '1', name: 'Apple', value: 10 },
            { id: '2', name: 'Banana', value: 20 },
        ];

        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => mockItems,
        });

        render(<CrudManager config={testConfig} />);

        await waitFor(() => {
            expect(screen.getByText('Apple')).toBeInTheDocument();
        });

        const searchInput = screen.getByPlaceholderText('Search test items...');
        fireEvent.change(searchInput, { target: { value: 'Ban' } });

        expect(screen.queryByText('Apple')).not.toBeInTheDocument();
        expect(screen.getByText('Banana')).toBeInTheDocument();
    });
});
