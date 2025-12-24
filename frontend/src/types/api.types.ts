/**
 * API Response Types
 * Explicit types for backend API responses to replace 'any' usage
 */

export interface PlayerApiResponse {
    id: string;
    number: number;
    name: string;
    isGoalkeeper?: boolean;
}

export interface TeamPlayerApiResponse {
    player: PlayerApiResponse;
    position?: number;
}

export interface ClubApiResponse {
    id?: string;
    name: string;
}

// Players are optional for summary endpoints (e.g. dashboard) to keep payload small.
export interface TeamApiResponse {
    id: string;
    name: string;
    category?: string;
    club?: ClubApiResponse;
    isMyTeam?: boolean;
    players?: TeamPlayerApiResponse[];
}

// Dashboard responses use a reduced match payload; optional fields are present when needed.
export interface MatchApiResponse {
    id: string;
    date: string;
    homeScore: number;
    awayScore: number;
    isFinished: boolean;
    videoUrl?: string;
    homeEventsLocked?: boolean;
    awayEventsLocked?: boolean;
    location?: string;
    firstHalfVideoStart?: number;
    secondHalfVideoStart?: number;
    homeTeam: TeamApiResponse;
    awayTeam: TeamApiResponse;
    events?: GameEventApiResponse[];
}

export interface GameEventApiResponse {
    id: string;
    timestamp: number;
    playerId: string;
    teamId: string;
    type: string; // 'Shot' | 'Turnover' | 'Sanction'
    subtype?: string;
    position?: string;
    distance?: string;
    goalZone?: string;
    isCollective?: boolean;
    hasOpposition?: boolean;
    isCounterAttack?: boolean;
    sanctionType?: string;
    activeGoalkeeperId?: string;
    player?: PlayerApiResponse;
}

export interface WeeklyInsightsPlayer {
    playerId: string;
    playerName: string;
    teamId: string;
    teamName: string;
    teamCategory: string;
    clubName: string;
    goals: number;
}

export interface WeeklyInsightsTeam {
    teamId: string;
    teamName: string;
    teamCategory: string;
    clubName: string;
    count: number;
}

export interface WeeklyInsightsGoalkeeper {
    playerId: string;
    playerName: string;
    teamId: string;
    teamName: string;
    teamCategory: string;
    clubName: string;
    saves: number;
    shotsFaced: number;
    savePercentage: number;
}

export interface WeeklyInsightsTeamPercentage {
    teamId: string;
    teamName: string;
    teamCategory: string;
    clubName: string;
    percentage: number;
    successes: number;
    attempts: number;
}

export interface WeeklyInsightsResponse {
    range: { start: string; end: string };
    generatedAt: string;
    metrics: {
        totalEvents: number;
        topScorerOverall: WeeklyInsightsPlayer | null;
        topScorersByCategory: WeeklyInsightsPlayer[];
        topIndividualScorer: WeeklyInsightsPlayer | null;
        teamWithMostCollectiveGoals: WeeklyInsightsTeam | null;
        teamWithMostFouls: WeeklyInsightsTeam | null;
        bestGoalkeeper: WeeklyInsightsGoalkeeper | null;
        mostEfficientTeam: WeeklyInsightsTeamPercentage | null;
        mostAttackingTeam: WeeklyInsightsTeamPercentage | null;
    };
}

// Dashboard snapshot references lightweight team objects, not the full Team domain model.
export interface DashboardSnapshotResponse {
    pendingMatches: MatchApiResponse[];
    pastMatches: MatchApiResponse[];
    myTeams: TeamApiResponse[];
    weeklyInsights: WeeklyInsightsResponse;
}
