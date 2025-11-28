export type FlowType = 'Shot' | 'Turnover' | 'Sanction' | null;

export type ShotResult = 'Goal' | 'Save' | 'Miss' | 'Post' | 'Block';
export type TurnoverType = 'Pass' | 'Catch' | 'Dribble' | 'Steps' | 'Area' | 'Offensive Foul';
export type SanctionType = 'Foul' | 'Yellow' | '2min' | 'Red' | 'Blue Card';
export type DefenseType = '6-0' | '5-1' | '3-2-1' | '3-3' | '4-2' | 'Mixed';

export type ZoneType = '6m-LW' | '6m-LB' | '6m-CB' | '6m-RB' | '6m-RW' | '9m-LB' | '9m-CB' | '9m-RB' | '7m';

export interface MatchEvent {
    id: string;
    timestamp: number;
    teamId: string;
    playerId: string;
    category: FlowType;
    action: ShotResult | TurnoverType | SanctionType | string;
    zone?: ZoneType;
    goalTarget?: number; // 1-9
    context?: {
        isCollective?: boolean;
        hasOpposition?: boolean;
        assistPlayerId?: string;
        isCounterAttack?: boolean;
    };
    defenseFormation?: DefenseType;
}
