import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { MatchProvider } from '../../../context/MatchContext';
import { EventEditResult } from './EventEditResult';
import type { MatchEvent } from '../../../types';

describe('EventEditResult', () => {
    const mockEvent: MatchEvent = {
        id: 'test-event-1',
        timestamp: 0,
        playerId: 'player-1',
        playerName: 'test-player',
        playerNumber: 21,
        teamId: 'team-1',
        category: 'Shot',
        action: 'Goal',
        isCollective: false,
        hasOpposition: false,
        isCounterAttack: false,
    };

    const mockTeam = {
        id: 'team-1',
        name: 'test-team',
        color: 'bg-blue-500',
        players: [
            { id: 'player-1', number: 21, name: 'test-player', position: 'LW' },
            { id: 'player-2', number: 10, name: 'test-other-player', position: 'CB' }
        ]
    };

    const mockOnSave = vi.fn();
    const mockOnCancel = vi.fn();
    const mockOnDelete = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should display current action', () => {
        render(
            <MatchProvider>
                <EventEditResult
                    event={mockEvent}
                    team={mockTeam}
                    onSave={mockOnSave}
                    onCancel={mockOnCancel}
                    onDelete={mockOnDelete}
                />
            </MatchProvider>
        );

        // Goal button should be selected
        const goalButton = screen.getByRole('button', { name: 'Goal' });
        expect(goalButton).toBeInTheDocument();
    });

    it('should allow changing action to Miss', async () => {
        render(
            <MatchProvider>
                <EventEditResult
                    event={mockEvent}
                    team={mockTeam}
                    onSave={mockOnSave}
                    onCancel={mockOnCancel}
                    onDelete={mockOnDelete}
                />
            </MatchProvider>
        );

        // Click Miss button
        const missButton = screen.getByRole('button', { name: 'Miss' });
        fireEvent.click(missButton);

        // Click Save button - The action button at the bottom
        // We can find it by looking for the button that contains the Save icon or text, 
        // but since there is another "Save" (result), we need to be specific.
        // The result buttons are in a grid, the save button is in the footer.
        // Let's use the text but filter for the one that is likely the submit button.
        const buttons = screen.getAllByText('Save');
        const saveActionButton = buttons[buttons.length - 1]; // Usually the last one in DOM order
        fireEvent.click(saveActionButton);

        await waitFor(() => {
            expect(mockOnSave).toHaveBeenCalled();
        });
    });

    it('should handle context toggles', () => {
        render(
            <MatchProvider>
                <EventEditResult
                    event={mockEvent}
                    team={mockTeam}
                    onSave={mockOnSave}
                    onCancel={mockOnCancel}
                    onDelete={mockOnDelete}
                />
            </MatchProvider>
        );

        // Should show context toggles
        expect(screen.getByText(/Individual/)).toBeInTheDocument();
        expect(screen.getByText(/Free/)).toBeInTheDocument();
        expect(screen.getByText(/Static/)).toBeInTheDocument();
    });

    it('should allow changing player', () => {
        render(
            <MatchProvider>
                <EventEditResult
                    event={mockEvent}
                    team={mockTeam}
                    onSave={mockOnSave}
                    onCancel={mockOnCancel}
                    onDelete={mockOnDelete}
                />
            </MatchProvider>
        );

        // Open player dropdown
        const playerButton = screen.getAllByText('test-player')[0];
        fireEvent.click(playerButton);

        // Select other player
        const otherPlayerButton = screen
            .getAllByText('test-other-player')
            .find(el => el.tagName === 'BUTTON')!;
        fireEvent.click(otherPlayerButton);

        // Save
        const buttons = screen.getAllByText('Save');
        const saveActionButton = buttons[buttons.length - 1];
        fireEvent.click(saveActionButton);

        expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
            playerId: 'player-2'
        }));
    });
});
