import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { EventForm } from '../EventForm';

const baseProps = {
  team: { id: 'team-1', name: 'Home', color: '', players: [] },
  opponentTeam: {
    id: 'team-2',
    name: 'Away',
    color: '',
    players: [
      { id: 'gk-1', name: 'Goalkeeper One', number: 1, position: 'GK', isGoalkeeper: true },
    ],
  },
  initialState: { opponentGoalkeeperId: 'gk-1' },
  onSave: vi.fn(),
  onCancel: vi.fn(),
  onDelete: vi.fn(),
};

const mockStorage = () => {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn(),
    clear: vi.fn(() => {
      Object.keys(store).forEach(k => delete store[k]);
    }),
  };
};

describe('EventForm goal target selection', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: mockStorage(),
      writable: true,
      configurable: true,
    });
  });

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

    const targetButton = screen.getByLabelText('goal-target-1');
    expect(targetButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('saves the selected goal target when clicking a target cell', async () => {
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
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalled();
      const savedEvent = handleSave.mock.calls[0][0];
      expect(savedEvent.goalTarget).toBe(5);
      expect(savedEvent.goalZoneTag).toBe('MM');
    });
  });
});
