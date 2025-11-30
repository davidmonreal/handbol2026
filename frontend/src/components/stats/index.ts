// Complete view (recommended - includes filters, cards, heatmap, zones, table)
export { StatisticsView } from './StatisticsView';

// Main component
export { StatisticsPanel } from './StatisticsPanel';

// Atomic components (for custom compositions if needed)
export { StatCard } from './StatCard';
export { GoalHeatmap } from './GoalHeatmap';
export { ZoneDistribution } from './ZoneDistribution';
export { StatsTable } from './StatsTable';
export { PlayerStatisticsTable } from './PlayerStatisticsTable';
export { FiltersBar } from './FiltersBar';

// Hooks
export { useStatisticsCalculator } from './hooks/useStatisticsCalculator';
export { usePlayerBaselines } from './hooks/usePlayerBaselines';

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
