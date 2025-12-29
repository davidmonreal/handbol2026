import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { MatchFormFields } from './MatchFormFields';

describe('MatchFormFields', () => {
    const baseProps = {
        teams: [{ id: 'team-1', name: 'Team 1', color: '#000000' }],
        dateValue: '2024-01-01',
        timeValue: '12:00',
        selectedHomeTeamId: null,
        selectedAwayTeamId: null,
        status: 'SCHEDULED' as const,
        homeScore: '0',
        awayScore: '0',
        onDateChange: vi.fn(),
        onTimeChange: vi.fn(),
        onHomeTeamChange: vi.fn(),
        onAwayTeamChange: vi.fn(),
        onStatusChange: vi.fn(),
        onHomeScoreChange: vi.fn(),
        onAwayScoreChange: vi.fn(),
    };

    it('calls change handlers for date and time', () => {
        render(<MatchFormFields {...baseProps} />);

        fireEvent.change(screen.getByLabelText('Date *'), { target: { value: '2024-02-02' } });
        fireEvent.change(screen.getByLabelText('Time *'), { target: { value: '18:30' } });

        expect(baseProps.onDateChange).toHaveBeenCalledWith('2024-02-02');
        expect(baseProps.onTimeChange).toHaveBeenCalledWith('18:30');
    });

    it('switches status and captures score changes', () => {
        render(<MatchFormFields {...baseProps} status="FINISHED" />);

        fireEvent.click(screen.getByRole('button', { name: 'Scheduled' }));
        fireEvent.click(screen.getByRole('button', { name: 'Finished' }));

        expect(baseProps.onStatusChange).toHaveBeenCalledWith('SCHEDULED');
        expect(baseProps.onStatusChange).toHaveBeenCalledWith('FINISHED');

        fireEvent.change(screen.getByLabelText('Home Score'), { target: { value: '12' } });
        fireEvent.change(screen.getByLabelText('Away Score'), { target: { value: '10' } });

        expect(baseProps.onHomeScoreChange).toHaveBeenCalledWith('12');
        expect(baseProps.onAwayScoreChange).toHaveBeenCalledWith('10');
    });
});
