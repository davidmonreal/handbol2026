import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MatchProvider } from '../../../context/MatchContext';
import { EventEditResult } from './EventEditResult';
import type { MatchEvent } from '../../../types';

describe('EventEditResult', () => {
    const mockEvent: MatchEvent = {
        id: 'test-event-1',
        timestamp: 0,
        playerId: 'player-1',
        playerName: 'Test Player',
        playerNumber: 21,
        teamId: 'team-1',
        category: 'Shot',
        action: 'Goal',
        isCollective: false,
        hasOpposition: false,
        isCounterAttack: false,
    };

    const mockOnSave = vi.fn();
    const mockOnCancel = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should display current action', () => {
        render(
            <MatchProvider>
                <EventEditResult
                    event={mockEvent}
                    onSave={mockOnSave}
                    onCancel={mockOnCancel}
                />
            </MatchProvider>
        );

        // Goal button should be selected
        const goalButton = screen.getByText('Goal');
        expect(goalButton).toBeInTheDocument();
    });

    it('should allow changing action to Miss', async () => {
        const { updateEvent } = require('../../../context/MatchContext');
        const mockUpdateEvent = vi.fn();

        render(
            <MatchProvider>
                <EventEditResult
                    event={mockEvent}
                    onSave={mockOnSave}
                    onCancel={mockOnCancel}
                />
            </MatchProvider>
        );

        // Click Miss button
        const missButton = screen.getByText('Miss');
        fireEvent.click(missButton);

        // Click Save button
        const saveButton = screen.getByText('Save');
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(mockOnSave).toHaveBeenCalled();
        });
    });

    it('should handle context toggles', () => {
        render(
            <MatchProvider>
                <EventEditResult
                    event={mockEvent}
                    onSave={mockOnSave}
                    onCancel={mockOnCancel}
                />
            </MatchProvider>
        );

        // Should show context toggles
        expect(screen.getByText(/Individual/)).toBeInTheDocument();
        expect(screen.getByText(/Free/)).toBeInTheDocument();
        expect(screen.getByText(/Static/)).toBeInTheDocument();
    });
});
