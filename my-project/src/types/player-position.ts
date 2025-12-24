export const PLAYER_POSITION = {
  UNSET: 0,
  GOALKEEPER: 1,
  EXTREM_ESQ: 2,
  LATERAL_ESQ: 3,
  CENTRAL: 4,
  PIVOT: 5,
  LATERAL_DRET: 6,
  EXTREM_DRET: 7,
} as const;

export type PlayerPosition = (typeof PLAYER_POSITION)[keyof typeof PLAYER_POSITION];

export const PLAYER_POSITION_VALUES: PlayerPosition[] = Object.values(PLAYER_POSITION);

export function isValidPlayerPosition(value: number): value is PlayerPosition {
  return PLAYER_POSITION_VALUES.includes(value as PlayerPosition);
}
