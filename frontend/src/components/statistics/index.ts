// Main component
export { StatisticsPanel } from './StatisticsPanel';

// Atomic components (for custom compositions if needed)
export { StatCard } from './StatCard';
export { GoalHeatmap } from './GoalHeatmap';
export { ZoneDistribution } from './ZoneDistribution';
export { StatsTable } from './StatsTable';

// Hooks
export { useStatisticsCalculator } from './hooks/useStatisticsCalculator';

// Types
export type {
    StatisticsContext,
    StatisticsData,
    ComparisonData,
    CalculatedStats,
    ZoneStatistics,
    GoalTargetStatistics,
    PlayerStatistics,
    GoalHeatmapProps,
    ZoneDistributionProps,
    StatsTableProps,
    StatCardProps,
    StatisticsPanelProps,
} from './types';
