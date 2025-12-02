/**
 * Filters an array of items based on a search term and a list of fields.
 * Supports deep search using dot notation (e.g., 'homeTeam.club.name').
 * 
 * @param items The array of items to filter.
 * @param searchTerm The search string.
 * @param searchFields The fields to search in. Can be keys of T or dot-notation strings.
 * @returns The filtered array of items.
 */
export function filterItems<T>(items: T[], searchTerm: string, searchFields: (keyof T | string)[]): T[] {
    if (!searchTerm) return items;

    const searchLower = searchTerm.toLowerCase();

    return items.filter((item) => {
        return searchFields.some((field) => {
            const path = String(field);
            // Deep access using reduce to traverse the object path
            const value = path.split('.').reduce((obj: any, key) => obj?.[key], item);

            return value?.toString().toLowerCase().includes(searchLower);
        });
    });
}
