import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom'; // Fix: Import jest-dom for toBeInTheDocument
import { CrudManager } from '../../components/admin/shared/CrudManager';
import type { CrudConfig } from '../../types';

// Mock API globally
const mockFetch = vi.fn();
globalThis.fetch = mockFetch as any;

// Mock Config
interface TestItem {
    id: string;
    name: string;
}

const testConfig: CrudConfig<TestItem> = {
    entityName: 'Test Item',
    entityNamePlural: 'Test Items',
    apiEndpoint: '/api/test',
    columns: [
        { key: 'name', label: 'Name' },
    ],
    formFields: [
        { name: 'name', label: 'Name', type: 'text', required: true },
    ],
    searchFields: ['name'],
};

describe('Basic Flow Verification', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default mock for loading items
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => [],
        });
    });

    describe('CrudManager Delete Flow', () => {
        it('should show confirmation modal when delete is clicked and proceed on confirm', async () => {
            // Setup: Component with one item
            const mockItems = [{ id: '1', name: 'Item to Delete' }];
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockItems,
            });

            render(<CrudManager config={testConfig} />);

            // Verify item is loaded
            await waitFor(() => {
                expect(screen.getByText('Item to Delete')).toBeInTheDocument();
            });

            // 1. Click Delete Button on the row
            // Note: We need to find the delete button. Usually it has a trash icon or "Delete" text/aria-label.
            // Based on CrudManager implementation, it might trigger the modal.
            // Let's look for a button that looks like a delete action near the item.
            const deleteButtons = screen.getAllByRole('button'); // This might be too generic, let's try to be specific if we can, or just find the one in the row.
            // In CrudManager.tsx, the delete button usually has the Trash2 icon.
            // We can look for the button inside the row.
            const row = screen.getByText('Item to Delete').closest('tr');
            expect(row).not.toBeNull();

            // Assuming the last button in the row is delete, or better, finding by icon/text if accessible.
            // Let's assume there is a button with reasonable accessibility or just click the one in the actions cell.
            const rowButtons = row?.querySelectorAll('button');
            const deleteBtn = rowButtons ? rowButtons[rowButtons.length - 1] : null; // Typically edit is first, delete is second

            expect(deleteBtn).toBeDefined();
            fireEvent.click(deleteBtn!);

            // 2. Verify Modal Appears
            expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
            expect(screen.getByText(/Are you sure you want to delete this test item/i)).toBeInTheDocument();

            // 3. Click "Cancel" first to verify it doesn't delete
            const cancelButton = screen.getByText('Cancel');
            fireEvent.click(cancelButton);

            expect(screen.queryByText('Confirm Delete')).not.toBeInTheDocument();
            // Verify NO delete call was made
            expect(mockFetch).not.toHaveBeenCalledWith(expect.stringContaining('/api/test/1'), expect.objectContaining({ method: 'DELETE' }));

            // 4. Click Delete again to actually delete
            fireEvent.click(deleteBtn!);
            expect(screen.getByText('Confirm Delete')).toBeInTheDocument();

            // Mock the delete response
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true }),
            });

            // 5. Click "Delete" in the modal
            // The modal has a button with text "Delete" (confirmLabel)
            // Since there are multiple "Delete" texts (title, button), getting by role button with name "Delete" is safer.
            const confirmDeleteBtn = screen.getByRole('button', { name: 'Delete' });
            fireEvent.click(confirmDeleteBtn);

            // 6. Verify Delete API performed
            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledWith(
                    expect.stringContaining('/api/test/1'),
                    expect.objectContaining({ method: 'DELETE' })
                );
            });

            // 7. Verify item is removed from view (optimistic update or re-fetch)
            // CrudManager usually re-fetches or updates local state.
            await waitFor(() => {
                expect(screen.queryByText('Item to Delete')).not.toBeInTheDocument();
            });
        });
    });
});
