import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { EventForm } from '../EventForm';

const baseProps = {
  team: { id: 'team-1', name: 'Home', color: '', players: [] },
  opponentTeam: { id: 'team-2', name: 'Away', color: '', players: [] },
  onSave: vi.fn(),
  onCancel: vi.fn(),
  onDelete: vi.fn(),
};

describe('EventForm goal target selection', () => {
  it('preselects goal target when editing an event with goalZone/goalTarget', () => {
    render(
      <EventForm
        {...baseProps}
        event={{
          id: 'e1',
          playerId: 'p1',
          teamId: 'team-1',
          category: 'Shot',
          action: 'Goal',
          timestamp: 0,
          goalZoneTag: 'TL',
          goalTarget: 1,
        }}
      />,
    );

    // The first target button should be selected (aria-pressed or class check)
    const buttons = screen.getAllByRole('button').filter(b => b.title === '');
    const firstTarget = buttons.find(b => b.className.includes('bg-indigo-600'));
    expect(firstTarget).toBeDefined();
  });

  it('saves the selected goal target when clicking a target cell', () => {
    const handleSave = vi.fn();
    const user = userEvent.setup();
    render(
      <EventForm
        {...baseProps}
        onSave={handleSave}
        event={{
          id: 'e2',
          playerId: 'p1',
          teamId: 'team-1',
          category: 'Shot',
          action: 'Goal',
          timestamp: 0,
          goalZoneTag: 'TL',
          goalTarget: 1,
        }}
      />,
    );

    // Click another target (e.g., middle = 5)
    const middle = screen.getByLabelText('goal-target-5');
    fireEvent.click(middle);

    // Save
    user.click(screen.getByRole('button', { name: /save changes/i }));

    waitFor(() => {
      expect(handleSave).toHaveBeenCalled();
      const savedEvent = handleSave.mock.calls[0][0];
      expect(savedEvent.goalTarget).toBe(5);
      expect(savedEvent.goalZoneTag).toBe('MM');
    });
  });
});
