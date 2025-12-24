export const PLAYER_POSITIONS = [
  { id: 1, tKey: 'positions.goalkeeper' },
  { id: 2, tKey: 'positions.extremEsq' },
  { id: 3, tKey: 'positions.lateralEsq' },
  { id: 4, tKey: 'positions.central' },
  { id: 5, tKey: 'positions.pivot' },
  { id: 6, tKey: 'positions.lateralDret' },
  { id: 7, tKey: 'positions.extremDret' },
  { id: 0, tKey: 'positions.unset' },
] as const;

export type PlayerPositionId = (typeof PLAYER_POSITIONS)[number]['id'];

export const DEFAULT_FIELD_POSITION: PlayerPositionId = 0;

export const PLAYER_POSITION_ABBR: Record<PlayerPositionId, string> = {
  0: '—',
  1: 'GK',
  2: 'LW',
  3: 'LB',
  4: 'CB',
  5: 'PV',
  6: 'RB',
  7: 'RW',
};
