// Shared types for all entities across the application
// Single source of truth for data structures

export interface Club {
    id: string;
    name: string;
}

export interface Season {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
}

export interface Player {
    id: string;
    name: string;
    number: number;
    handedness: string;
    isGoalkeeper: boolean;
    teams?: {
        team: {
            id: string;
            name: string;
            category?: string;
            club: {
                name: string;
            };
        };
    }[];
}

export interface Team {
    id: string;
    name: string;
    category?: string;
    club?: { id: string; name: string };
    season?: { id: string; name: string };
    color: string;
    players?: Player[];
    isMyTeam?: boolean;
}

export interface Match {
    id: string;
    date: string;
    location?: string;
    homeTeamId: string;
    awayTeamId: string;
    homeTeam?: Team;
    awayTeam?: Team;
    homeScore?: number;
    awayScore?: number;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface GameEvent {
    id: string;
    matchId: string;
    playerId: string | null;
    teamId: string;
    type: string;
    subtype: string | null;
    timestamp: number;
    position?: string | null;
    distance?: string | null;
    isCollective?: boolean;
    hasOpposition?: boolean;
    isCounterAttack?: boolean;
    goalZone?: string | null;
    sanctionType?: string | null;
    activeGoalkeeperId?: string | null;
}

// API Response types
export interface ApiResponse<T> {
    data?: T;
    error?: string;
}

// Generic list response
export type ListResponse<T> = T[];

// Form field configuration for generic CRUD
export interface FormFieldConfig {
    name: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'checkbox' | 'date';
    required?: boolean;
    options?: { value: string | number; label: string }[];
    placeholder?: string;
    validation?: (value: any) => string | undefined;
}

// Table column configuration for generic CRUD
export interface ColumnConfig<T> {
    key: keyof T | string;
    label: string;
    render?: (item: T) => React.ReactNode;
    sortable?: boolean;
}

// Generic CRUD configuration
export interface CrudConfig<T> {
    entityName: string;          // "Club", "Player"
    entityNamePlural: string;    // "Clubs", "Players"
    apiEndpoint: string;          // "/api/clubs"
    columns: ColumnConfig<T>[];   // Table columns
    formFields: FormFieldConfig[]; // Form inputs
    searchFields: (keyof T)[];    // Fields to search in
    formatFormData?: (data: any) => any;  // Transform before sending
    formatDisplayData?: (item: T) => any; // Transform for display
    customActions?: Array<{
        icon: React.ComponentType<any>;
        label: string;
        onClick: (item: T) => void;
        className?: string;
    }>;
    headerActions?: React.ReactNode; // Custom buttons in header
    customFilter?: (item: T, searchTerm: string) => boolean; // Custom search logic
    mapItemToForm?: (item: T) => any; // Transform item to form data
}
