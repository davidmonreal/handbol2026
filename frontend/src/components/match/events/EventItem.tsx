import { Edit2 } from 'lucide-react';
import type { MatchEvent } from '../../../types';
import { useMatch } from '../../../context/MatchContext';

interface EventItemProps {
    event: MatchEvent;
    onEdit?: (event: MatchEvent) => void;
}

export const EventItem = ({ event, onEdit }: EventItemProps) => {
    const { homeTeam, visitorTeam } = useMatch();

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getTeam = () => {
        if (event.teamId === homeTeam?.id) return homeTeam;
        if (event.teamId === visitorTeam?.id) return visitorTeam;
        return null;
    };

    const team = getTeam();
    const player = team?.players?.find(p => p.id === event.playerId);

    const getCategoryIcon = () => {
        switch (event.category) {
            case 'Shot': return '🎯';
            case 'Turnover': return '❌';
            case 'Sanction': return '⚠️';
            default: return '•';
        }
    };

    const getResultIcon = () => {
        if (event.category === 'Shot') {
            switch (event.action) {
                case 'Goal': return '⚽';
                case 'Save': return '🧤';
                case 'Miss': return '💨';
                case 'Post': return '🥅';
                case 'Block': return '🚫';
                default: return '';
            }
        }
        return '';
    };

    const formatZone = () => {
        if (!event.zone) return null;

        if (event.zone === '7m') return '7m Penalty';

        // Parse zone like '6m-LW' to 'LW 6m'
        const parts = event.zone.split('-');
        if (parts.length === 2) {
            const [distance, position] = parts;
            return `${position} ${distance}`;
        }
        return event.zone;
    };

    const formatContext = () => {
        const tags = [];
        if (event.isCollective || event.context?.isCollective) tags.push('Coll');
        if (event.hasOpposition || event.context?.hasOpposition) tags.push('Opp');
        if (event.isCounterAttack || event.context?.isCounterAttack) tags.push('Counter');
        return tags;
    };

    return (
        <div className="p-3 hover:bg-gray-50 transition-colors group">
            <button
                onClick={() => onEdit?.(event)}
                className="w-full text-left"
            >
                {/* First Line: Time, Player */}
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="font-mono text-gray-500 font-medium">
                            {formatTime(event.timestamp)}
                        </span>
                        <span className="font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">
                            #{player?.number || '?'} {player?.name || 'Unknown'}
                        </span>
                    </div>
                    {/* Edit Icon Hint */}
                    <span className="opacity-0 group-hover:opacity-100 text-gray-400 transition-opacity">
                        <Edit2 size={14} />
                    </span>
                </div>

                {/* Second Line: Category, Zone, Result, Context */}
                <div className="mt-1 flex flex-wrap items-center gap-2">
                    {/* Category Badge */}
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 font-medium text-xs shadow-sm group-hover:border-indigo-300 group-hover:text-indigo-600 transition-all">
                        <span>{getCategoryIcon()}</span>
                        <span>{event.category}</span>
                    </span>

                    {/* Zone Badge */}
                    {formatZone() && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 text-xs shadow-sm group-hover:border-indigo-300 transition-all">
                            <span>📍</span>
                            <span>{formatZone()}</span>
                        </span>
                    )}

                    {/* Result Badge */}
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-xs shadow-sm group-hover:bg-indigo-100 transition-all">
                        <span>{getResultIcon()}</span>
                        <span>{event.action}</span>
                        {event.goalTarget && event.category === 'Shot' && event.action === 'Goal' && (
                            <span className="text-indigo-400 font-normal ml-1 text-[10px] uppercase">
                                {event.goalZoneTag || (
                                    event.goalTarget === 1 ? 'TL' :
                                        event.goalTarget === 2 ? 'TM' :
                                            event.goalTarget === 3 ? 'TR' :
                                                event.goalTarget === 4 ? 'ML' :
                                                    event.goalTarget === 5 ? 'MM' :
                                                        event.goalTarget === 6 ? 'MR' :
                                                            event.goalTarget === 7 ? 'BL' :
                                                                event.goalTarget === 8 ? 'BM' :
                                                                    event.goalTarget === 9 ? 'BR' : ''
                                )}
                            </span>
                        )}
                    </span>

                    {/* Context Tags */}
                    {formatContext().map(tag => (
                        <span key={tag} className="inline-flex items-center px-2 py-1 rounded-md bg-gray-50 text-gray-500 text-xs border border-gray-100">
                            {tag}
                        </span>
                    ))}
                </div>
            </button>
        </div>
    );
};
