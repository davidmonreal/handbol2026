type TeamOverride = Partial<{
  name: string;
  category: string;
  clubId: string;
  seasonId: string;
  isMyTeam: boolean;
}>;

export function makeTeamPayload(overrides: TeamOverride = {}) {
  return {
    name: 'Team A',
    category: 'Senior M',
    clubId: 'club-1',
    seasonId: 'season-1',
    isMyTeam: false,
    ...overrides,
  };
}
