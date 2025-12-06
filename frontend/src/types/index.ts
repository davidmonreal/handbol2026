// =============================================================================
// SINGLE SOURCE OF TRUTH FOR ALL APPLICATION TYPES
// =============================================================================
// This file is the canonical location for all shared types.
// Do NOT create duplicate type definitions elsewhere in the codebase.
// =============================================================================

// ============ Core Value Types ============

export type FlowType = 'Shot' | 'Turnover' | 'Sanction' | null;
export type ShotResult = 'Goal' | 'Save' | 'Miss' | 'Post' | 'Block';
export type TurnoverType = 'Pass' | 'Catch' | 'Dribble' | 'Steps' | 'Area' | 'Offensive Foul';
export type SanctionType = 'Foul' | 'Yellow' | '2min' | 'Red' | 'Blue Card';
export type DefenseType = '6-0' | '5-1' | '3-2-1' | '3-3' | '4-2' | 'Mixed';
export type ZoneType = '6m-LW' | '6m-LB' | '6m-CB' | '6m-RB' | '6m-RW' | '9m-LB' | '9m-CB' | '9m-RB' | '7m';

// ============ Entity Types ============

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
                id: string;
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
    // Players with their role in this specific team
    players?: { player: Player; role?: string }[];
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

export interface MatchEvent {
    id: string;
    timestamp: number;
    videoTimestamp?: number;
    playerId: string | null;
    playerName?: string;
    playerNumber?: number;
    teamId: string;
    category: string; // 'Shot', 'Turnover', 'Sanction'
    action: string; // 'Goal', 'Save', 'Miss', 'Post', 'Pass', 'Steps', etc.
    zone?: ZoneType;
    position?: string;
    distance?: string;
    goalTarget?: number; // 1-9
    goalZoneTag?: string; // 'TL', 'TM', 'TR', etc.
    isCollective?: boolean;
    hasOpposition?: boolean;
    isCounterAttack?: boolean;
    sanctionType?: SanctionType;
    context?: {
        isCollective?: boolean;
        hasOpposition?: boolean;
        isCounterAttack?: boolean;
    };
    defenseFormation?: string;
    activeGoalkeeperId?: string;
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

// ============ API Types ============

export interface ApiResponse<T> {
    data?: T;
    error?: string;
}

export type ListResponse<T> = T[];

// ============ CRUD Manager Types ============

export interface FormFieldConfig {
    name: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'checkbox' | 'date';
    required?: boolean;
    options?: { value: string | number; label: string }[];
    placeholder?: string;
    transform?: (value: unknown) => unknown;
}

export interface ColumnConfig<T> {
    key: keyof T | string;
    label: string;
    render?: (item: T) => React.ReactNode;
    sortable?: boolean;
}

export interface CrudConfig<T> {
    entityName: string;
    entityNamePlural: string;
    apiEndpoint: string;
    columns: ColumnConfig<T>[];
    formFields: FormFieldConfig[];
    searchFields: (keyof T)[];
    formatFormData?: (data: Record<string, unknown>) => Partial<T>;
    mapItemToForm?: (item: T) => Record<string, unknown>;
    customActions?: Array<{
        icon: React.ComponentType<{ size?: number }>;
        label: string;
        onClick: (item: T) => void;
        className?: string;
    }>;
    headerActions?: React.ReactNode;
    customFilter?: (item: T, searchTerm: string) => boolean;
    onEdit?: (item: T) => void;
    onCreate?: () => void;
    pagination?: boolean;
    filterSlot?: React.ReactNode;
    serverFilters?: Record<string, string>;
}
