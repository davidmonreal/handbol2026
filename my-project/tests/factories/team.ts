type TeamOverride = Partial<{
  name: string;
  category: string;
  clubId: string;
  seasonId: string;
  isMyTeam: boolean;
}>;

let teamSequence = 1;

const baseTeam = () => {
  const seq = teamSequence++;
  return {
    name: `Team ${seq}`,
    category: 'Senior M',
    clubId: `club-${seq}`,
    seasonId: `season-${seq}`,
    isMyTeam: false,
  };
};

class TeamBuilder {
  constructor(private payload: ReturnType<typeof baseTeam>) {}

  withMyTeam() {
    this.payload.isMyTeam = true;
    return this;
  }

  withClub(clubId: string) {
    this.payload.clubId = clubId;
    return this;
  }

  withSeason(seasonId: string) {
    this.payload.seasonId = seasonId;
    return this;
  }

  withName(name: string) {
    this.payload.name = name;
    return this;
  }

  withCategory(category: string) {
    this.payload.category = category;
    return this;
  }

  build(overrides: TeamOverride = {}) {
    return { ...this.payload, ...overrides };
  }
}

export const makeTeamBuilder = (overrides: TeamOverride = {}) =>
  new TeamBuilder({ ...baseTeam(), ...overrides });

export function makeTeamPayload(overrides: TeamOverride = {}) {
  return makeTeamBuilder(overrides).build();
}
