type TestEntity = 'club' | 'season' | 'team' | 'player' | 'match' | 'event' | 'timer' | 'score';

// Centralized naming helper for tests: use these helpers instead of hand-building names.
const sanitizeSegment = (segment: string) =>
  segment
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const buildSuffix = () => `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const buildTestName = (entity: string, label?: string, suffix?: string) => {
  const entitySegment = sanitizeSegment(entity || 'item') || 'item';
  const labelSegment = label ? sanitizeSegment(label) : '';
  const unique = suffix ?? buildSuffix();
  return ['test', entitySegment, labelSegment, unique].filter(Boolean).join('-');
};

export const testName = (entity: TestEntity, label?: string, suffix?: string) =>
  buildTestName(entity, label, suffix);

export const testClubName = (label?: string, suffix?: string) => testName('club', label, suffix);
export const testSeasonName = (label?: string, suffix?: string) =>
  testName('season', label, suffix);
export const testTeamName = (label?: string, suffix?: string) => testName('team', label, suffix);
export const testPlayerName = (label?: string, suffix?: string) =>
  testName('player', label, suffix);
export const testMatchName = (label?: string, suffix?: string) => testName('match', label, suffix);
export const testEventName = (label?: string, suffix?: string) => testName('event', label, suffix);
