/**
 * Pure function to transform API team response to domain Team object
 * Extracted from MatchTracker and VideoMatchTracker to eliminate duplication
 */
import type { TeamApiResponse, TeamPlayerApiResponse } from '../../../types/api.types';
import { resolvePlayerPositionId, resolvePlayerPositionLabel } from '../../../constants/playerPositions';

export const GOALKEEPER_POSITION_ID = 1;

export interface TransformedPlayer {
    id: string;
    number?: number;
    name: string;
    position: string;
    isGoalkeeper: boolean;
}

export interface TransformedTeam {
    id: string;
    name: string;
    category: string | undefined;
    club: { id: string; name: string } | undefined;
    color: string;
    players: TransformedPlayer[];
}

/**
 * Transforms an API team response into a domain Team object
 * @param teamData - Raw API response for a team
 * @param color - CSS class for team color (e.g., 'bg-yellow-400')
 * @returns Transformed team object ready for use in components
 */
export function transformTeam(
    teamData: TeamApiResponse,
    color: string
): TransformedTeam {
    return {
        id: teamData.id,
        name: teamData.name,
        category: teamData.category,
        club: teamData.club
            ? { id: teamData.club.id ?? '', name: teamData.club.name }
            : undefined,
        color,
        players: (teamData.players || []).map((p: TeamPlayerApiResponse) => {
            const positionId = resolvePlayerPositionId(p.position, p.player?.isGoalkeeper);
            const positionLabel = resolvePlayerPositionLabel(p.position, p.player?.isGoalkeeper);
            return {
                id: p.player.id,
                number: p.number,
                name: p.player.name,
                position: positionLabel,
                isGoalkeeper: positionId === GOALKEEPER_POSITION_ID || p.player?.isGoalkeeper === true,
            };
        }),
    };
}
