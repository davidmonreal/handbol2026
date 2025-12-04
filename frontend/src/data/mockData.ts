export interface Player {
    id: string;
    number: number;
    name: string;
    position: string;
}

export interface Team {
    id: string;
    name: string;
    category?: string;
    club?: { name: string };
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

