import type { ZoneType } from '../types';
import { ZONE_CONFIG } from './zones';

export const FLOW_CONFIG = {
    Shot: {
        steps: ['ZONE', 'CONTEXT', 'RESULT'],
        getAvailableActions: (zone: ZoneType | null) => {
            const baseActions = ['Goal', 'Save', 'Miss', 'Post'];
            // Block is not possible for 7m penalties
            if (zone === ZONE_CONFIG.penalty.zone) {
                return baseActions;
            }
            return [...baseActions, 'Block'];
        },
        showContext: (zone: ZoneType | null) => zone !== ZONE_CONFIG.penalty.zone,
    },
    Turnover: {
        steps: ['TYPE', 'ZONE'],
        actions: ['Pass', 'Catch', 'Dribble', 'Steps', 'Area', 'Offensive Foul'],
        requiresZone: (action: string | null) => action === 'Area', // Only 'Area' strictly requires a zone, others are optional
    },
    Sanction: {
        steps: ['SEVERITY', 'ZONE'],
        actions: ['Foul', 'Yellow', '2min', 'Red', 'Blue Card'],
        hideZone: (zone: string) => zone === ZONE_CONFIG.penalty.zone, // Hide 7m zone for sanctions
    }
};
