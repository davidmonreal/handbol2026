export type Translator = (key: string) => string;

// Lightweight versions aligned with MatchContext structures used by EventForm.
export interface EventFormPlayer {
    id: string;
    number: number;
    name: string;
    position: string;
    isGoalkeeper?: boolean;
}

export interface EventFormTeam {
    id: string;
    name: string;
    color: string;
    players: EventFormPlayer[];
}
