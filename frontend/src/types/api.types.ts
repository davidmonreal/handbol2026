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
    role?: string;
}

export interface ClubApiResponse {
    id?: string;
    name: string;
}

export interface TeamApiResponse {
    id: string;
    name: string;
    category?: string;
    club?: ClubApiResponse;
    players: TeamPlayerApiResponse[];
}

export interface MatchApiResponse {
    id: string;
    date: string;
    homeScore: number;
    awayScore: number;
    isFinished: boolean;
    videoUrl?: string;
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
