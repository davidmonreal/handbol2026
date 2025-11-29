export const POSITIONS = {
    LW: 'LW',
    LB: 'LB',
    CB: 'CB',
    RB: 'RB',
    RW: 'RW',
    PIVOT: 'PIVOT',
    GK: 'GK'
} as const;

export const DISTANCES = {
    SIX_M: '6m',
    NINE_M: '9m',
    SEVEN_M: '7m'
} as const;

export const GOAL_ZONES = {
    TL: 'TL', TM: 'TM', TR: 'TR',
    ML: 'ML', MM: 'MM', MR: 'MR',
    BL: 'BL', BM: 'BM', BR: 'BR'
} as const;

export const GOAL_TARGET_MAP: Record<number, string> = {
    1: GOAL_ZONES.TL, 2: GOAL_ZONES.TM, 3: GOAL_ZONES.TR,
    4: GOAL_ZONES.ML, 5: GOAL_ZONES.MM, 6: GOAL_ZONES.MR,
    7: GOAL_ZONES.BL, 8: GOAL_ZONES.BM, 9: GOAL_ZONES.BR
};

export const REVERSE_GOAL_TARGET_MAP: Record<string, number> = Object.entries(GOAL_TARGET_MAP).reduce((acc, [k, v]) => {
    acc[v as string] = Number(k);
    return acc;
}, {} as Record<string, number>);

export const ACTIONS = {
    GOAL: 'Goal',
    SAVE: 'Save',
    MISS: 'Miss',
    POST: 'Post',
    BLOCK: 'Block'
} as const;
