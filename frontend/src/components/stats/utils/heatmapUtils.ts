
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
    zoneStats: Map<string | number, { shots: number }>
): Map<string | number, HeatmapColor> {
    // Convert Map to array of [id, stats]
    const statsArray = Array.from(zoneStats.entries());

    // Sort by shots descending
    // We use stable sort principles implicitly, but for identical values order doesn't strictly matter 
    // until we assign the base indices.
    statsArray.sort((a, b) => b[1].shots - a[1].shots);

    const colors = new Map<string | number, HeatmapColor>();

    statsArray.forEach((item, index) => {
        const [id, stats] = item;

        // Determine base color based on index
        let color: HeatmapColor = 'default';

        // Check for 0 shots - usually shouldn't happen if map only has active, but good to check
        if (stats.shots === 0) {
            colors.set(id, 'default');
            return;
        }

        if (index === 0) {
            color = 'red';
        } else if (index >= 1 && index <= 2) {
            color = 'orange';
        } else if (index >= 3 && index <= 4) {
            color = 'yellow';
        }

        // Tie-breaking logic: verify with previous item
        if (index > 0) {
            const prevItem = statsArray[index - 1];
            if (stats.shots === prevItem[1].shots) {
                // Inherit color from previous
                const prevColor = colors.get(prevItem[0]);
                if (prevColor) {
                    color = prevColor;
                }
            }
        }

        colors.set(id, color);
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
