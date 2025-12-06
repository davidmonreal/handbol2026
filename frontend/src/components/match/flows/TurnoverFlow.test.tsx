import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TurnoverFlow } from './TurnoverFlow';

describe('TurnoverFlow', () => {
    const mockOnActionSelect = vi.fn();
    const mockOnZoneSelect = vi.fn();
    const mockOnFinalizeEvent = vi.fn();

    const defaultProps = {
        selectedAction: null,
        onActionSelect: mockOnActionSelect,
        onZoneSelect: mockOnZoneSelect,
        onFinalizeEvent: mockOnFinalizeEvent,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Action Selection', () => {
        it('should render all turnover action types', () => {
            render(<TurnoverFlow {...defaultProps} />);

            expect(screen.getByText('Bad Pass')).toBeInTheDocument();
            expect(screen.getByText('Dropped Ball')).toBeInTheDocument();
            expect(screen.getByText('Steps')).toBeInTheDocument();
            expect(screen.getByText('Area')).toBeInTheDocument();
            expect(screen.getByText('Offensive Foul')).toBeInTheDocument();
        });

        it('should call onActionSelect when action button is clicked', () => {
            render(<TurnoverFlow {...defaultProps} />);

            fireEvent.click(screen.getByText('Steps'));
            expect(mockOnActionSelect).toHaveBeenCalledWith('Steps');
        });

        it('should highlight selected action', () => {
            render(<TurnoverFlow {...defaultProps} selectedAction="Steps" />);

            const stepsButton = screen.getByText('Steps');
            expect(stepsButton).toHaveClass('bg-orange-500');
        });
    });

    describe('Zone Selection - Non-Area Actions', () => {
        it('should show zone selector when non-Area action is selected', () => {
            render(<TurnoverFlow {...defaultProps} selectedAction="Pass" />);

            expect(screen.getByText('3. Where? (Optional)')).toBeInTheDocument();
        });

        it('should show Skip button', () => {
            render(<TurnoverFlow {...defaultProps} selectedAction="Pass" />);

            expect(screen.getByText('Skip (Midfield / Unknown)')).toBeInTheDocument();
        });

        it('should call onZoneSelect with null and finalize when Skip is clicked', () => {
            render(<TurnoverFlow {...defaultProps} selectedAction="Pass" />);

            fireEvent.click(screen.getByText('Skip (Midfield / Unknown)'));

            expect(mockOnZoneSelect).toHaveBeenCalledWith(null);
            expect(mockOnFinalizeEvent).toHaveBeenCalledWith();
        });
    });

    describe('Zone Selection - Area Action', () => {
        it('should show 6m zone selection for Area action', () => {
            render(<TurnoverFlow {...defaultProps} selectedAction="Area" />);

            expect(screen.getByText('3. Where? (Select 6m Zone)')).toBeInTheDocument();
        });

        it('should only show 6m zones for Area action', () => {
            render(<TurnoverFlow {...defaultProps} selectedAction="Area" />);

            expect(screen.getByText('LW 6m')).toBeInTheDocument();
            expect(screen.getByText('CB 6m')).toBeInTheDocument();
            expect(screen.getByText('RW 6m')).toBeInTheDocument();
        });

        it('should finalize with zone when 6m zone is selected for Area', () => {
            render(<TurnoverFlow {...defaultProps} selectedAction="Area" />);

            fireEvent.click(screen.getByText('CB 6m'));

            expect(mockOnZoneSelect).toHaveBeenCalledWith('6m-CB');
            expect(mockOnFinalizeEvent).toHaveBeenCalledWith(undefined, '6m-CB');
        });
    });

    describe('No Action Selected', () => {
        it('should not show zone selector when no action is selected', () => {
            render(<TurnoverFlow {...defaultProps} selectedAction={null} />);

            expect(screen.queryByText('3. Where?')).not.toBeInTheDocument();
        });
    });
});
