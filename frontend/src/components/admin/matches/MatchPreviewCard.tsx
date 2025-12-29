import type { Team } from '../../../types';

type MatchPreviewCardProps = {
    teams: Team[];
    selectedHomeTeamId: string | null;
    selectedAwayTeamId: string | null;
    status: 'SCHEDULED' | 'FINISHED';
    homeScore: string;
    awayScore: string;
    dateValue: string;
    timeValue: string;
};

const buildTeamLabel = (team?: Team) => {
    if (!team) return '';
    return `${team.category ? `${team.category} ` : ''}${team.name}`;
};

export const MatchPreviewCard = ({
    teams,
    selectedHomeTeamId,
    selectedAwayTeamId,
    status,
    homeScore,
    awayScore,
    dateValue,
    timeValue,
}: MatchPreviewCardProps) => {
    if (!selectedHomeTeamId || !selectedAwayTeamId) return null;

    const homeTeam = teams.find((team) => team.id === selectedHomeTeamId);
    const awayTeam = teams.find((team) => team.id === selectedAwayTeamId);

    return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Match Preview</h3>
            <div className="flex items-center justify-center gap-4 text-lg">
                <div className="text-right flex-1">
                    <div className="font-bold">{buildTeamLabel(homeTeam)}</div>
                    <div className="text-sm text-gray-500">{homeTeam?.club?.name}</div>
                </div>

                <div className="flex flex-col items-center min-w-[80px]">
                    {status === 'FINISHED' ? (
                        <div className="flex items-center gap-2 text-3xl font-bold text-gray-900 px-3 py-1">
                            <span>{homeScore || '0'}</span>
                            <span className="text-gray-400 text-2xl">:</span>
                            <span>{awayScore || '0'}</span>
                        </div>
                    ) : (
                        <span className="text-gray-400 font-bold px-2 text-xl">vs</span>
                    )}
                </div>

                <div className="text-left flex-1">
                    <div className="font-bold">{buildTeamLabel(awayTeam)}</div>
                    <div className="text-sm text-gray-500">{awayTeam?.club?.name}</div>
                </div>
            </div>
            {dateValue && timeValue && (
                <p className="text-sm text-gray-600 text-center mt-2">
                    {new Date(`${dateValue}T${timeValue}`).toLocaleString('ca-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                </p>
            )}
        </div>
    );
};
