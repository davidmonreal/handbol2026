import { type MatchEvent, type ZoneType } from '../../types';

/**
 * Context for statistics display
 * - player: Individual player statistics
 * - team: Team-wide statistics
 * - match: Single match statistics
 */
export type StatisticsContext = 'player' | 'team' | 'match';

/**
 * Main statistics data interface
 */
export interface StatisticsData {
    events: MatchEvent[];
    /** Optional alternative event set to compute foul distribution (e.g., opponent plays) */
    foulEvents?: MatchEvent[];
    title: string;
    subtitle?: string;
    context: StatisticsContext;
    isGoalkeeper?: boolean;
}

/**
 * Comparison data for showing performance deltas
 * Used to show arrows (↑/↓) when player performance differs from baseline
 */
export interface ComparisonData {
    /** Map of playerId -> baseline efficiency percentage for that player */
    playerAverages?: Map<string, number>;
}

/**
 * Calculated statistics from events
 */
export interface CalculatedStats {
    totalShots: number;
    totalGoals: number;
    totalSaves: number;
    totalMisses: number;
    totalPosts: number;
    totalFouls: number;
    totalTurnovers: number;
    foulRate: number; // % of plays that are fouls
    efficiency: number;
    foulsPercentage: number;
    turnoversPercentage: number;
    missesPercentage: number;
    goalsPercentage: number;
    goalsConceded: number;

    /** Map of zone -> { shots, goals, efficiency } */
    zoneStats: Map<ZoneType | '7m', ZoneStatistics>;
    /** Map of zone -> fouls (stored in shots) for sanction heatmap */
    /** Map of zone -> fouls (stored in shots) for sanction heatmap */
    foulZoneStats: Map<ZoneType | '7m', ZoneStatistics>;
    /** Map of zone -> fouls received & (fouls + shots) for Foul Efficiency heatmap */
    foulReceivedZoneStats: Map<ZoneType | '7m', ZoneStatistics>;
    /** Map of zone -> turnovers & total plays for Turnover heatmap */
    turnoverZoneStats: Map<ZoneType | '7m', ZoneStatistics>;
    /** Map of zone -> goals & total plays for Danger heatmap */
    dangerZoneStats: Map<ZoneType | '7m', ZoneStatistics>;

    /** Map of playerId -> player statistics */
    playerStats: Map<string, PlayerStatistics>;

    /** Map of goalTarget (1-9) -> { goals, shots, efficiency } */
    goalTargetStats: Map<number, GoalTargetStatistics>;
}

/**
 * Statistics for a specific zone
 */
export interface ZoneStatistics {
    shots: number;
    goals: number;
    efficiency: number;
}

/**
 * Statistics for a specific goal target (1-9)
 */
export interface GoalTargetStatistics {
    goals: number;
    saves: number;
    shots: number;
    efficiency: number;
}

/**
 * Statistics for an individual player
 */
export interface PlayerStatistics {
    playerId: string;
    playerName?: string;
    playerNumber?: number;
    shots: number;
    goals: number;
    saves: number;
    misses: number;
    posts: number;
    efficiency: number;

    /** Comparison with player's baseline (if available) */
    comparison?: {
        baselineEfficiency: number;
        delta: number; // positive = above average, negative = below
    };

    // Detailed breakdown (matching PlayerStatisticsTable requirements)
    shots6m: number;
    goals6m: number;
    shots9m: number;
    goals9m: number;
    shots7m: number;
    goals7m: number;

    shotsWithOpp: number;
    goalsWithOpp: number;
    shotsNoOpp: number;
    goalsNoOpp: number;

    shotsCollective: number;
    goalsCollective: number;
    shotsIndividual: number;
    goalsIndividual: number;

    shotsCounter: number;
    goalsCounter: number;
    shotsStatic: number;
    goalsStatic: number;

    turnovers: number;

    // Sanctions
    yellowCards: number;
    twoMinutes: number;
    redCards: number;
    blueCards: number;
    commonFouls: number;

    // Goalkeeper specific
    goalsConceded: number;
}

/**
 * Props for GoalHeatmap component
 */
export interface GoalHeatmapProps {
    goalTargetStats: Map<number, GoalTargetStatistics>;
    className?: string;
    isGoalkeeper?: boolean;
}

/**
 * Props for ZoneDistribution component
 */
export interface ZoneDistributionProps {
    zoneStats: Map<ZoneType | '7m', ZoneStatistics>;
    foulZoneStats?: Map<ZoneType | '7m', ZoneStatistics>;
    /** Renamed from playZoneStats */
    foulReceivedZoneStats?: Map<ZoneType | '7m', ZoneStatistics>;
    turnoverZoneStats?: Map<ZoneType | '7m', ZoneStatistics>;
    dangerZoneStats?: Map<ZoneType | '7m', ZoneStatistics>;
    disableFoulToggle?: boolean;
    onZoneClick?: (zone: ZoneType | '7m' | null) => void;
    selectedZone?: ZoneType | '7m' | null;
    className?: string;
    isGoalkeeper?: boolean;
    title?: string;
}

/**
 * Props for StatCard component
 */
export interface StatCardProps {
    label: string;
    value: string | number;
    color?: 'blue' | 'green' | 'purple' | 'yellow' | 'orange' | 'gray' | 'red';
    className?: string;
}

/**
 * Props for StatisticsPanel (main container)
 */
export interface StatisticsPanelProps {
    data: StatisticsData;
    disableFoulToggle?: boolean;
    comparison?: ComparisonData;
    className?: string;
    onZoneFilter?: (zone: ZoneType | '7m' | null) => void;
}

export interface StatisticsViewProps {
    events: MatchEvent[];
    foulEvents?: MatchEvent[];
    context: StatisticsContext;
    title?: React.ReactNode;
    subtitle?: string;
    disableFoulToggle?: boolean;
    onPlayerClick?: (playerId: string | null) => void;
    selectedPlayerId?: string | null;
    showComparison?: boolean;
    teamId?: string | null;
    playerData?: any;
    matchData?: {
        homeTeam: { id: string; name: string; club?: { name: string }; category?: string; players: any[] };
        awayTeam: { id: string; name: string; club?: { name: string }; category?: string; players: any[] };
        homeTeamId: string;
        awayTeamId: string;
        realTimeFirstHalfStart?: number | null;
        realTimeSecondHalfStart?: number | null;
        realTimeFirstHalfEnd?: number | null;
        realTimeSecondHalfEnd?: number | null;
    };
    teamData?: { players: any[] };
    onTeamChange?: (teamId: string) => void;
    onBack?: () => void;
}
