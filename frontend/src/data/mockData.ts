export interface Player {
    id: string;
    number: number;
    name: string;
    position: string;
}

export interface Team {
    id: string;
    name: string;
    color: string;
    players: Player[];
}

export const HOME_TEAM: Team = {
    id: 'home',
    name: 'Club Handbol A',
    color: 'blue',
    players: [
        { id: 'h1', number: 1, name: 'Nico', position: 'GK' },
        { id: 'h2', number: 3, name: 'Extrem Esq A', position: 'LW' },
        { id: 'h3', number: 5, name: 'Pol Rossell', position: 'LB' },
        { id: 'h4', number: 10, name: 'Biel Graupera', position: 'CB' },
        { id: 'h5', number: 13, name: 'Guim', position: 'RB' },
        { id: 'h6', number: 7, name: 'Guillem Cuartero', position: 'RW' },
        { id: 'h7', number: 21, name: 'Martí Monreal', position: 'PV' },
        { id: 'h8', number: 22, name: 'Banqueta 1', position: 'LB' },
    ]
};

export const VISITOR_TEAM: Team = {
    id: 'visitor',
    name: 'Club Handbol B',
    color: 'red',
    players: [
        { id: 'v1', number: 12, name: 'Porter B', position: 'GK' },
        { id: 'v2', number: 4, name: 'Extrem Esq B', position: 'LW' },
        { id: 'v3', number: 6, name: 'Lateral Esq B', position: 'LB' },
        { id: 'v4', number: 11, name: 'Central B', position: 'CB' },
        { id: 'v5', number: 14, name: 'Lateral Dret B', position: 'RB' },
        { id: 'v6', number: 8, name: 'Extrem Dret B', position: 'RW' },
        { id: 'v7', number: 19, name: 'Pivot B', position: 'PV' },
        { id: 'v8', number: 24, name: 'Banqueta 1', position: 'RB' },
    ]
};
