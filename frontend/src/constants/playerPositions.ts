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

export const PLAYER_POSITION_ABBR_KEYS: Record<PlayerPositionId, string> = {
  0: 'positions.abbr.unset',
  1: 'positions.abbr.goalkeeper',
  2: 'positions.abbr.extremEsq',
  3: 'positions.abbr.lateralEsq',
  4: 'positions.abbr.central',
  5: 'positions.abbr.pivot',
  6: 'positions.abbr.lateralDret',
  7: 'positions.abbr.extremDret',
};

const POSITION_LABELS_BY_ID = new Map<PlayerPositionId, string[]>(
  PLAYER_POSITIONS.map((position) => {
    const abbrKey = PLAYER_POSITION_ABBR_KEYS[position.id];
    const labels = Object.values(translations)
      .flatMap((pack) => [pack[position.tKey], pack[abbrKey]])
      .filter((label): label is string => Boolean(label));
    return [position.id, labels];
  }),
);

const normalizePositionLabel = (value: string) => value.trim().toLowerCase();

export const resolvePlayerPositionId = (
  position?: number | string | null,
  isGoalkeeper?: boolean,
): PlayerPositionId => {
  if (typeof position === 'number' && Object.prototype.hasOwnProperty.call(PLAYER_POSITION_ABBR, position)) {
    return position as PlayerPositionId;
  }

  if (typeof position === 'string') {
    const trimmed = position.trim();
    if (trimmed.length > 0) {
      const parsed = Number(trimmed);
      if (!Number.isNaN(parsed) && Object.prototype.hasOwnProperty.call(PLAYER_POSITION_ABBR, parsed)) {
        return parsed as PlayerPositionId;
      }

      const normalized = trimmed.toUpperCase();
      const entry = Object.entries(PLAYER_POSITION_ABBR).find(([, abbr]) => abbr === normalized);
      if (entry) return Number(entry[0]) as PlayerPositionId;

      const byKey = PLAYER_POSITIONS.find((pos) => pos.tKey === trimmed);
      if (byKey) return byKey.id;

      const byAbbrKey = Object.entries(PLAYER_POSITION_ABBR_KEYS).find(([, key]) => key === trimmed);
      if (byAbbrKey) return Number(byAbbrKey[0]) as PlayerPositionId;

      const normalizedLabel = normalizePositionLabel(trimmed);
      for (const [id, labels] of POSITION_LABELS_BY_ID.entries()) {
        if (labels.some((label) => normalizePositionLabel(label) === normalizedLabel)) {
          return id;
        }
      }
    }
  }

  if (isGoalkeeper) return 1;
  return DEFAULT_FIELD_POSITION;
};

export const resolvePlayerPositionLabel = (position?: number | string | null, isGoalkeeper?: boolean): string => {
  const positionId = resolvePlayerPositionId(position, isGoalkeeper);
  return PLAYER_POSITION_ABBR_KEYS[positionId] ?? PLAYER_POSITION_ABBR_KEYS[DEFAULT_FIELD_POSITION];
};
import { translations } from '../i18n/translations';
