export const TEAM_CATEGORIES = [
    'Senior M',
    'Senior F',
    'Juvenil M',
    'Juvenil F',
    'Cadet M',
    'Cadet F',
    'Infantil M',
    'Infantil F',
    'Aleví M',
    'Aleví F'
];

export interface ParsedTeam {
    name: string;
    category: string;
}

const LEGACY_CATEGORY_MAP: Record<string, string> = {
    SENIOR: 'Senior M',
    JUVENIL: 'Juvenil M',
    CADET: 'Cadet M',
    INFANTIL: 'Infantil M',
    ALEVI: 'Aleví M',
    'ALEVÍ': 'Aleví M'
};

export const parseTeamName = (inputName: string): ParsedTeam => {
    let cleanName = inputName.trim();
    let detectedCategory = TEAM_CATEGORIES[0];

    // Sort categories by length descending for safer prefix matches.
    const sortedCategories = [...TEAM_CATEGORIES].sort((a, b) => b.length - a.length);

    for (const cat of sortedCategories) {
        // Check if input starts with the category (case insensitive)
        if (cleanName.toLowerCase().startsWith(cat.toLowerCase())) {
            detectedCategory = cat;
            // Remove the category prefix
            cleanName = cleanName.substring(cat.length).trim();

            // If the name is now empty or just special chars, maybe we shouldn't have stripped it?
            // But usually "Juvenil M A" -> cat: Juvenil M, name: "A"
            break;
        }
    }

    if (detectedCategory === TEAM_CATEGORIES[0]) {
        for (const legacy of Object.keys(LEGACY_CATEGORY_MAP)) {
            if (cleanName.toLowerCase().startsWith(legacy.toLowerCase())) {
                detectedCategory = LEGACY_CATEGORY_MAP[legacy];
                cleanName = cleanName.substring(legacy.length).trim();
                break;
            }
        }
    }

    // If name is empty after stripping (e.g. input was just "Juvenil"), 
    // maybe revert name to original or keep it empty? 
    // Let's keep it empty, the user can type the name. 
    // Or better, if it's empty, maybe the name IS the category? No, that's confusing.
    // Let's return the stripped name. If empty, the user will see empty name field.

    // Keep the team name as entered by the user
    // Do NOT apply toTitleCase - teams may have specific formatting (e.g., "FC BARCELONA", "CE Handbol")

    return {
        name: cleanName || inputName, // If stripped name is empty, return original? No, user wants to enter name.
        // Actually if I type "Juvenil", I probably want category Juvenil and Name empty to fill out.
        // But if I return empty string, the input will be empty.
        // If I return inputName, it will be "Juvenil".
        // Let's return empty if it was just the category.
        category: detectedCategory
    };
};
