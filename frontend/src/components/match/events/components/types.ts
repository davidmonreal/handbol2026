export type Translator = (key: string) => string;

// Lightweight versions aligned with MatchContext structures used by EventForm.
export interface Player {
    id: string;
    number: number;
    name: string;
    position: string;
    isGoalkeeper?: boolean;
}

export interface Team {
    id: string;
    name: string;
    color: string;
    players: Player[];
}
