export type FlowType = 'Shot' | 'Turnover' | 'Sanction' | null;

export type ShotResult = 'Goal' | 'Save' | 'Miss' | 'Post' | 'Block';
export type TurnoverType = 'Pass' | 'Catch' | 'Dribble' | 'Steps' | 'Area' | 'Offensive Foul';
export type SanctionType = 'Foul' | 'Yellow' | '2min' | 'Red' | 'Blue Card';
export type DefenseType = '6-0' | '5-1' | '3-2-1' | '3-3' | '4-2' | 'Mixed';

export type ZoneType = '6m-LW' | '6m-LB' | '6m-CB' | '6m-RB' | '6m-RW' | '9m-LB' | '9m-CB' | '9m-RB' | '7m';

export interface MatchEvent {
    id: string;
    timestamp: number;
    playerId: string | null;
    playerName?: string;
    playerNumber?: number;
    teamId: string;
    category: string; // 'Shot', 'Turnover', 'Sanction'
    action: string; // 'Goal', 'Save', 'Miss', 'Post', 'Pass', 'Steps', 'Double', 'Area', 'Yellow', '2min', 'Red', 'Blue'
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
    activeGoalkeeperId?: string; // ID of the goalkeeper who was active during this event
}

// ========== Entity Types ==========

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
    players?: { player: Player; role?: string }[];
    isMyTeam?: boolean;
}

// ========== CRUD Manager Types (Type-Safe, no `any`) ==========

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
    onEdit?: (item: T) => void; // Custom edit handler (e.g., navigate to page instead of modal)
    onCreate?: () => void; // Custom create handler (e.g., navigate to page instead of modal)
}
