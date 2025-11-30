import type { ZoneType } from '../types';

export interface ZoneConfig {
    zone: ZoneType;
    label: string;
    shortLabel: string;
}

export const ZONE_CONFIG = {
    // 6m Line
    sixMeter: [
        { zone: '6m-LW' as ZoneType, label: 'LW 6m', shortLabel: 'LW' },
        { zone: '6m-LB' as ZoneType, label: 'LB 6m', shortLabel: 'LB' },
        { zone: '6m-CB' as ZoneType, label: 'CB 6m', shortLabel: 'CB' },
        { zone: '6m-RB' as ZoneType, label: 'RB 6m', shortLabel: 'RB' },
        { zone: '6m-RW' as ZoneType, label: 'RW 6m', shortLabel: 'RW' },
    ],
    // 9m Line
    nineMeter: [
        { zone: '9m-LB' as ZoneType, label: 'LB 9m', shortLabel: 'LB' },
        { zone: '9m-CB' as ZoneType, label: 'CB 9m', shortLabel: 'CB' },
        { zone: '9m-RB' as ZoneType, label: 'RB 9m', shortLabel: 'RB' },
    ],
    // 7m Penalty
    penalty: { zone: '7m' as ZoneType, label: 'Penalty 7m', shortLabel: '7m' },
} as const;

// Helper to get all zones in order
export const getAllZones = (): ZoneConfig[] => [
    ...ZONE_CONFIG.sixMeter,
    ...ZONE_CONFIG.nineMeter,
    ZONE_CONFIG.penalty,
];

// Helper to get zone label
export const getZoneLabel = (zone: ZoneType, short: boolean = false): string => {
    const allZones = getAllZones();
    const config = allZones.find(z => z.zone === zone);
    return config ? (short ? config.shortLabel : config.label) : zone;
};
