import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlayerSelector } from './PlayerSelector';

describe('PlayerSelector', () => {
    const mockOnPlayerSelect = vi.fn();

    const mockTeam = {
        id: 'home',
        name: 'test-team',
        color: 'blue',
        players: [
            { id: 'p1', number: 7, name: 'Player Seven' },
            { id: 'p2', number: 1, name: 'Player One' },
            { id: 'p3', number: 15, name: 'Player Fifteen' },
            { id: 'p4', number: 3, name: 'Player Three' },
            { id: 'p5', number: 99, name: 'Player Ninety Nine' },
        ],
    };

    const defaultProps = {
        team: mockTeam,
        selectedPlayerId: null,
        onPlayerSelect: mockOnPlayerSelect,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render all players', () => {
            render(<PlayerSelector {...defaultProps} />);

            expect(screen.getByText('Player Seven')).toBeInTheDocument();
            expect(screen.getByText('Player One')).toBeInTheDocument();
            expect(screen.getByText('Player Fifteen')).toBeInTheDocument();
            expect(screen.getByText('Player Three')).toBeInTheDocument();
            expect(screen.getByText('Player Ninety Nine')).toBeInTheDocument();
        });

        it('should display jersey numbers', () => {
            render(<PlayerSelector {...defaultProps} />);

            expect(screen.getByText('1')).toBeInTheDocument();
            expect(screen.getByText('3')).toBeInTheDocument();
            expect(screen.getByText('7')).toBeInTheDocument();
            expect(screen.getByText('15')).toBeInTheDocument();
            expect(screen.getByText('99')).toBeInTheDocument();
        });

        it('should show header with Players title', () => {
            render(<PlayerSelector {...defaultProps} />);

            expect(screen.getByText('Players')).toBeInTheDocument();
        });
    });

    describe('Sorting', () => {
        it('should sort players by jersey number ascending', () => {
            render(<PlayerSelector {...defaultProps} />);

            const buttons = screen.getAllByRole('button');
            const playerButtons = buttons.filter(btn =>
                btn.textContent?.includes('Player')
            );

            // Extract jersey numbers from button text (first number in each)
            const jerseyNumbers = playerButtons.map(btn => {
                const match = btn.textContent?.match(/^(\d+)/);
                return match ? parseInt(match[1], 10) : 0;
            });

            // Verify sorted ascending
            const sortedNumbers = [...jerseyNumbers].sort((a, b) => a - b);
            expect(jerseyNumbers).toEqual(sortedNumbers);
        });
    });

    describe('Selection', () => {
        it('should call onPlayerSelect when player is clicked', () => {
            render(<PlayerSelector {...defaultProps} />);

            // Find button containing jersey number 7
            const playerButton = screen.getByText('Player Seven').closest('button');
            fireEvent.click(playerButton!);

            expect(mockOnPlayerSelect).toHaveBeenCalledWith('p1');
        });

        it('should highlight selected player', () => {
            render(<PlayerSelector {...defaultProps} selectedPlayerId="p2" />);

            const selectedButton = screen.getByText('Player One').closest('button');

            // Home team uses blue-500 for selected
            expect(selectedButton).toHaveClass('border-blue-500');
            expect(selectedButton).toHaveClass('bg-blue-50');
        });

        it('should use red color for away team selection', () => {
            const awayTeam = { ...mockTeam, id: 'away' };
            render(
                <PlayerSelector
                    {...defaultProps}
                    team={awayTeam}
                    selectedPlayerId="p1"
                />
            );

            const selectedButton = screen.getByText('Player Seven').closest('button');

            expect(selectedButton).toHaveClass('border-red-500');
            expect(selectedButton).toHaveClass('bg-red-50');
        });
    });

    describe('Empty State', () => {
        it('should handle team with no players', () => {
            const emptyTeam = { ...mockTeam, players: [] };
            render(<PlayerSelector {...defaultProps} team={emptyTeam} />);

            expect(screen.getByText('Players')).toBeInTheDocument();
            // Should not crash, just show empty grid
        });
    });

    describe('Team Icon Color', () => {
        it('should use blue icon for home team', () => {
            render(<PlayerSelector {...defaultProps} />);

            // Users icon should have blue color class for home team
            const icon = document.querySelector('.text-blue-600');
            expect(icon).toBeInTheDocument();
        });

        it('should use red icon for away team', () => {
            const awayTeam = { ...mockTeam, id: 'away' };
            render(<PlayerSelector {...defaultProps} team={awayTeam} />);

            const icon = document.querySelector('.text-red-600');
            expect(icon).toBeInTheDocument();
        });
    });
});
