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

export function normalizePlayerPosition(value: unknown): PlayerPosition | undefined {
  if (typeof value !== 'number') return undefined;
  return isValidPlayerPosition(value) ? value : undefined;
}

export function resolvePlayerPosition(
  value: unknown,
  fallback?: { isGoalkeeper?: boolean; defaultPosition?: PlayerPosition },
): PlayerPosition {
  const normalized = normalizePlayerPosition(value);
  if (normalized !== undefined) return normalized;
  if (fallback?.isGoalkeeper) return PLAYER_POSITION.GOALKEEPER;
  return fallback?.defaultPosition ?? PLAYER_POSITION.UNSET;
}

export function isGoalkeeperPosition(position: number | null | undefined): boolean {
  return position === PLAYER_POSITION.GOALKEEPER;
}

export function hasGoalkeeperPosition(positions: Array<number | null | undefined>): boolean {
  return positions.some((position) => position === PLAYER_POSITION.GOALKEEPER);
}
