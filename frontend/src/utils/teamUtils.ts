import { toTitleCase } from './textUtils';

export const TEAM_CATEGORIES = [
    'SENIOR',
    'JUVENIL',
    'CADET',
    'INFANTIL',
    'ALEVI',
    'BENJAMI',
    'PREBENJAMI'
];

export interface ParsedTeam {
    name: string;
    category: string;
}

export const parseTeamName = (inputName: string): ParsedTeam => {
    let cleanName = inputName.trim();
    let detectedCategory = 'SENIOR';

    // Sort categories by length descending to match "PREBENJAMI" before "BENJAMI" if needed, 
    // though startWith handles it, longer matches are safer.
    const sortedCategories = [...TEAM_CATEGORIES].sort((a, b) => b.length - a.length);

    for (const cat of sortedCategories) {
        // Check if input starts with the category (case insensitive)
        if (cleanName.toLowerCase().startsWith(cat.toLowerCase())) {
            detectedCategory = cat;
            // Remove the category prefix
            cleanName = cleanName.substring(cat.length).trim();

            // If the name is now empty or just special chars, maybe we shouldn't have stripped it?
            // But usually "Juvenil A" -> cat: JUVENIL, name: "A"
            break;
        }
    }

    // If name is empty after stripping (e.g. input was just "Juvenil"), 
    // maybe revert name to original or keep it empty? 
    // Let's keep it empty, the user can type the name. 
    // Or better, if it's empty, maybe the name IS the category? No, that's confusing.
    // Let's return the stripped name. If empty, the user will see empty name field.

    // Capitalize the remaining name properly
    cleanName = toTitleCase(cleanName);

    return {
        name: cleanName || inputName, // If stripped name is empty, return original? No, user wants to enter name.
        // Actually if I type "Juvenil", I probably want category Juvenil and Name empty to fill out.
        // But if I return empty string, the input will be empty.
        // If I return inputName, it will be "Juvenil".
        // Let's return empty if it was just the category.
        category: detectedCategory
    };
};
