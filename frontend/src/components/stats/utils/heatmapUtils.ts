
/**
 * Types of colors for heatmap zones based on user rank requirements
 */
export type HeatmapColor = 'red' | 'orange' | 'yellow' | 'default';

/**
 * Calculates the color for each zone based on the shot count distribution.
 * 
 * Rules:
 * - Sort zones by shot count (descending).
 * - Rank 0 (1st highest): Red
 * - Rank 1-2 (2nd, 3rd highest): Orange
 * - Rank 3-4 (4th, 5th highest): Yellow
 * - Others: Default
 * 
 * Tie-breaking:
 * - If a zone has the same shot count as the previous zone, it inherits the previous zone's color.
 * 
 * @param zoneStats Map of zone ID to stats object containing { shots: number }
 * @returns Map of zone ID to HeatmapColor strings
 */
export function calculateZoneColors(
    zoneStats: Map<string | number, { shots: number; efficiency?: number }>,
    getValue: (stats: { shots: number; efficiency?: number }) => number = (stats) => stats.shots
): Map<string | number, HeatmapColor> {
    const colors = new Map<string | number, HeatmapColor>();

    // Build a list of unique, non-zero values (shots or efficiency) in descending order to rank ties as a single bucket.
    const uniqueCounts = Array.from(
        new Set(
            Array.from(zoneStats.values())
                .map((stats) => getValue(stats))
                .filter((value) => value > 0)
        )
    ).sort((a, b) => b - a);

    // Helper to get color based on the rank of the value bucket
    const getColorForValue = (value: number): HeatmapColor => {
        if (value === 0) return 'default';
        const rank = uniqueCounts.indexOf(value);
        if (rank === 0) return 'red';       // Highest bucket
        if (rank === 1) return 'orange';    // Second bucket
        if (rank === 2) return 'yellow';    // Third bucket
        return 'default';
    };

    zoneStats.forEach((stats, id) => {
        const value = getValue(stats);
        colors.set(id, getColorForValue(value));
    });

    return colors;
}

/**
 * Helper to get Tailwind classes for a given heatmap color
 */
export function getHeatmapColorClasses(color: HeatmapColor): string {
    switch (color) {
        case 'red':
            return 'bg-red-200 border-red-300 text-red-900';
        case 'orange':
            return 'bg-orange-200 border-orange-300 text-orange-900';
        case 'yellow':
            return 'bg-yellow-200 border-yellow-300 text-yellow-900';
        default:
            return 'bg-gray-50 border-gray-200 text-gray-800'; // Default styling
    }
}
