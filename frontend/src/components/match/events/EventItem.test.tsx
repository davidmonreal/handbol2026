import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventItem } from './EventItem';
import type { MatchEvent } from '../../../types';

// Mock MatchContext to provide team data
vi.mock('../../../context/MatchContext', () => ({
    useMatch: () => ({
        homeTeam: {
            id: 'home-team-1',
            name: 'Home Team',
            players: [
                { id: 'p1', number: 7, name: 'John Doe', position: 'LB' },
                { id: 'p2', number: 13, name: 'Jane Smith', position: 'CB' },
            ],
        },
        visitorTeam: {
            id: 'away-team-1',
            name: 'Away Team',
            players: [
                { id: 'ap1', number: 1, name: 'Away Player', position: 'RW' },
            ],
        },
    }),
    MatchProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('EventItem', () => {
    const mockOnEdit = vi.fn();
    const mockOnSeekToVideo = vi.fn();

    const baseEvent: MatchEvent = {
        id: 'event-1',
        timestamp: 305, // 5:05
        teamId: 'home-team-1',
        playerId: 'p1',
        category: 'Shot',
        action: 'Goal',
        zone: '6m-LW',
    };

    const defaultProps = {
        event: baseEvent,
        onEdit: mockOnEdit,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Time Display', () => {
        it('should display match time correctly', () => {
            render(<EventItem {...defaultProps} />);

            // 305 seconds = 05:05
            expect(screen.getByText('05:05')).toBeInTheDocument();
            expect(screen.getByText('1H')).toBeInTheDocument();
        });

        it('should format single digit seconds with leading zero', () => {
            const event = { ...baseEvent, timestamp: 61 }; // 1:01
            render(<EventItem {...defaultProps} event={event} />);

            expect(screen.getByText('01:01')).toBeInTheDocument();
            expect(screen.getByText('1H')).toBeInTheDocument();
        });

        it('should handle zero timestamp', () => {
            const event = { ...baseEvent, timestamp: 0 };
            render(<EventItem {...defaultProps} event={event} />);

            expect(screen.getByText('00:00')).toBeInTheDocument();
            expect(screen.getByText('1H')).toBeInTheDocument();
        });
    });

    describe('Player Info', () => {
        it('should display player number and name', () => {
            render(<EventItem {...defaultProps} />);

            expect(screen.getByText('7')).toBeInTheDocument();
            expect(screen.getByText('John Doe (LB)')).toBeInTheDocument();
        });

        it('should show Unknown for missing player', () => {
            const event = { ...baseEvent, playerId: 'non-existent' };
            render(<EventItem {...defaultProps} event={event} />);

            expect(screen.getByText('?')).toBeInTheDocument();
            expect(screen.getByText('Unknown')).toBeInTheDocument();
        });
    });

    describe('Event Category', () => {
        it('should display Shot category with label', () => {
            render(<EventItem {...defaultProps} />);

            expect(screen.getByText('Shot')).toBeInTheDocument();
        });

        it('should display Turnover category', () => {
            const event = { ...baseEvent, category: 'Turnover' as const, action: 'Pass' };
            render(<EventItem {...defaultProps} event={event} />);

            expect(screen.getByText('Turnover')).toBeInTheDocument();
        });

        it('should display Sanction category', () => {
            const event = { ...baseEvent, category: 'Sanction' as const, action: '2min' };
            render(<EventItem {...defaultProps} event={event} />);

            expect(screen.getByText('Foul')).toBeInTheDocument();
        });
    });

    describe('Shot Results', () => {
        it('should show Goal with label and zone tag', () => {
            render(<EventItem {...defaultProps} />);

            expect(screen.getByText('Goal')).toBeInTheDocument();
        });

        it('should show Save with label', () => {
            const event = { ...baseEvent, action: 'Save' };
            render(<EventItem {...defaultProps} event={event} />);

            expect(screen.getByText('Save')).toBeInTheDocument();
        });

        it('should show goal zone tag when present', () => {
            const event = { ...baseEvent, goalTarget: 1, goalZoneTag: 'TL' };
            render(<EventItem {...defaultProps} event={event} />);

            expect(screen.getByText('TL')).toBeInTheDocument();
        });
    });

    describe('Zone Display', () => {
        it('should format zone correctly', () => {
            render(<EventItem {...defaultProps} />);

            // '6m-LW' should become 'LW 6m'
            expect(screen.getByText('LW 6m')).toBeInTheDocument();
        });

        it('should show 7m Penalty for penalty zone', () => {
            const event = { ...baseEvent, zone: '7m' as const };
            render(<EventItem {...defaultProps} event={event} />);

            expect(screen.getByText('7m Penalty')).toBeInTheDocument();
        });
    });

    describe('Edit Functionality', () => {
        it('should call onEdit when clicked', () => {
            render(<EventItem {...defaultProps} />);

            const button = screen.getByRole('button');
            fireEvent.click(button);

            expect(mockOnEdit).toHaveBeenCalledWith(baseEvent);
        });
    });

    describe('Video Seek Button', () => {
        it('should not show video seek button when no videoTimestamp', () => {
            render(<EventItem {...defaultProps} />);

            // Play button should not be present
            const playButtons = screen.queryAllByTitle(/Go to video/);
            expect(playButtons.length).toBe(0);
        });

        it('should not show video seek button when video is not loaded', () => {
            const event = { ...baseEvent, videoTimestamp: 500 };
            render(
                <EventItem
                    {...defaultProps}
                    event={event}
                    isVideoLoaded={false}
                />
            );

            const playButtons = screen.queryAllByTitle(/Go to video/);
            expect(playButtons.length).toBe(0);
        });

        it('should show video seek button when videoTimestamp exists and video is loaded', () => {
            const event = { ...baseEvent, videoTimestamp: 500 };
            render(
                <EventItem
                    {...defaultProps}
                    event={event}
                    onSeekToVideo={mockOnSeekToVideo}
                    isVideoLoaded={true}
                />
            );

            const playButton = screen.getByTitle(/Go to video/);
            expect(playButton).toBeInTheDocument();
        });

        it('should call onSeekToVideo when video seek button is clicked', () => {
            const event = { ...baseEvent, videoTimestamp: 500 };
            render(
                <EventItem
                    {...defaultProps}
                    event={event}
                    onSeekToVideo={mockOnSeekToVideo}
                    isVideoLoaded={true}
                />
            );

            const playButton = screen.getByTitle(/Go to video/);
            fireEvent.click(playButton);

            // Expects 497 because the component seeks 3 seconds before the event for context
            expect(mockOnSeekToVideo).toHaveBeenCalledWith(497);
        });

        it('should not trigger onEdit when video seek button is clicked', () => {
            const event = { ...baseEvent, videoTimestamp: 500 };
            render(
                <EventItem
                    {...defaultProps}
                    event={event}
                    onSeekToVideo={mockOnSeekToVideo}
                    isVideoLoaded={true}
                />
            );

            const playButton = screen.getByTitle(/Go to video/);
            fireEvent.click(playButton);

            // onEdit should not be called because we stop propagation
            expect(mockOnEdit).not.toHaveBeenCalled();
        });

        it('should format video timestamp in tooltip', () => {
            const event = { ...baseEvent, videoTimestamp: 3665 }; // 1:01:05
            render(
                <EventItem
                    {...defaultProps}
                    event={event}
                    onSeekToVideo={mockOnSeekToVideo}
                    isVideoLoaded={true}
                />
            );

            const playButton = screen.getByTitle(/Go to video 1:01:05/);
            expect(playButton).toBeInTheDocument();
        });
    });

    describe('Context Tags', () => {
        it('should show Coll tag when isCollective is true', () => {
            const event = { ...baseEvent, isCollective: true };
            render(<EventItem {...defaultProps} event={event} />);

            expect(screen.getByText('Coll')).toBeInTheDocument();
        });

        it('should show Opp tag when hasOpposition is true', () => {
            const event = { ...baseEvent, hasOpposition: true };
            render(<EventItem {...defaultProps} event={event} />);

            expect(screen.getByText('Opp')).toBeInTheDocument();
        });

        it('should show Counter tag when isCounterAttack is true', () => {
            const event = { ...baseEvent, isCounterAttack: true };
            render(<EventItem {...defaultProps} event={event} />);

            expect(screen.getByText('Counter')).toBeInTheDocument();
        });

        it('should show multiple context tags', () => {
            const event = {
                ...baseEvent,
                isCollective: true,
                hasOpposition: true,
            };
            render(<EventItem {...defaultProps} event={event} />);

            expect(screen.getByText('Coll')).toBeInTheDocument();
            expect(screen.getByText('Opp')).toBeInTheDocument();
        });
    });
});
