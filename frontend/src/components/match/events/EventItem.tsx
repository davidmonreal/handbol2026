import { Edit2, Play } from 'lucide-react';
import type { MatchEvent } from '../../../types';
import { useMatch } from '../../../context/MatchContext';
import { useSafeTranslation } from '../../../context/LanguageContext';

interface EventItemProps {
    event: MatchEvent;
    onEdit?: (event: MatchEvent) => void;
    onSeekToVideo?: (videoTimestamp: number) => void;
    isVideoLoaded?: boolean;
    getVideoTimeFromMatch?: (matchTime: number) => number | null;
    secondHalfStart?: number | null;
}

export const EventItem = ({
    event,
    onEdit,
    onSeekToVideo,
    isVideoLoaded = false,
    getVideoTimeFromMatch,
    secondHalfStart = null,
}: EventItemProps) => {
    const {
        homeTeam,
        visitorTeam,
        realTimeFirstHalfStart,
        realTimeFirstHalfEnd,
        realTimeSecondHalfStart,
    } = useMatch();
    const { t } = useSafeTranslation();
    const secondHalfBoundarySeconds = (() => {
        if (realTimeFirstHalfStart && realTimeSecondHalfStart) {
            return Math.max(
                0,
                Math.floor((realTimeSecondHalfStart - realTimeFirstHalfStart) / 1000)
            );
        }
        if (realTimeFirstHalfStart && realTimeFirstHalfEnd) {
            return Math.max(
                0,
                Math.floor((realTimeFirstHalfEnd - realTimeFirstHalfStart) / 1000)
            );
        }
        return Number.POSITIVE_INFINITY;
    })();

    const formatClock = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const formatVideoTime = (seconds: number): string => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Calculate video timestamp from event's match time using calibration
    const getCalculatedVideoTime = (): number | null => {
        // First try stored videoTimestamp
        if (event.videoTimestamp !== undefined && event.videoTimestamp !== null) {
            return event.videoTimestamp;
        }
        // Otherwise calculate from match time using calibration
        if (getVideoTimeFromMatch && event.timestamp !== undefined) {
            return getVideoTimeFromMatch(event.timestamp);
        }
        return null;
    };

    const calculatedVideoTime = getCalculatedVideoTime();
    const videoSecondHalf = () => {
        if (secondHalfStart !== null && calculatedVideoTime !== null) {
            return calculatedVideoTime >= secondHalfStart;
        }
        return false;
    };
    const hasBoundary = Number.isFinite(secondHalfBoundarySeconds);
    const isSecondHalfEvent = videoSecondHalf() || (hasBoundary && event.timestamp >= secondHalfBoundarySeconds);
    const displaySeconds = isSecondHalfEvent && hasBoundary
        ? Math.max(0, event.timestamp - secondHalfBoundarySeconds)
        : event.timestamp;

    // Seek 3 seconds before the event so user can see the play develop
    const VIDEO_SEEK_OFFSET_SECONDS = 3;

    const handleSeekToVideo = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (calculatedVideoTime !== null && onSeekToVideo) {
            const seekTime = Math.max(0, calculatedVideoTime - VIDEO_SEEK_OFFSET_SECONDS);
            onSeekToVideo(seekTime);
        }
    };

    const getTeam = () => {
        if (event.teamId === homeTeam?.id) return homeTeam;
        if (event.teamId === visitorTeam?.id) return visitorTeam;
        return null;
    };

    const team = getTeam();
    const player = team?.players?.find(p => p.id === event.playerId);

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

    const goalZoneTag = (() => {
        if (event.goalZoneTag) return event.goalZoneTag;
        if (typeof event.goalTarget !== 'number') return '';
        const mapping: Record<number, string> = {
            1: 'TL',
            2: 'TM',
            3: 'TR',
            4: 'ML',
            5: 'MM',
            6: 'MR',
            7: 'BL',
            8: 'BM',
            9: 'BR',
        };
        return mapping[event.goalTarget] ?? '';
    })();

    const zoneLabel = formatZone();
    const contextTags = formatContext();
    const halfLabel = isSecondHalfEvent ? t('matchEvent.halfSecond') : t('matchEvent.halfFirst');

    // Show play button if we can calculate video time (from stored or from calibration)
    const canSeekToVideo = calculatedVideoTime !== null && isVideoLoaded && onSeekToVideo;
    const chipBaseClass = 'inline-flex items-center rounded-lg border px-3 py-1 text-xs font-semibold';
    const mutedChipClass = `${chipBaseClass} border-gray-100 bg-gray-50 text-gray-500`;

    return (
        <div className="border-b border-gray-100 last:border-b-0">
            <div
                onClick={() => onEdit?.(event)}
                className="group flex items-center gap-3 px-4 py-3 text-left cursor-pointer overflow-x-auto whitespace-nowrap"
                data-testid={`event-item-${event.id}`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onEdit?.(event);
                    }
                }}
            >
                <div className="flex items-center gap-1 text-xs text-gray-500 font-mono shrink-0">
                    <span className="text-sm font-semibold text-gray-700">{formatClock(displaySeconds)}</span>
                    <span className="text-[11px] text-gray-400">{halfLabel}</span>
                </div>

                <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1 text-sm font-semibold text-gray-700 shrink-0">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-gray-100 text-[13px] text-gray-900">
                        {player?.number || '?'}
                    </span>
                    <span className="truncate max-w-[160px] md:max-w-[220px]">{player?.name || 'Unknown'}</span>
                </div>

                <div className="flex items-center gap-2 min-w-0 text-xs flex-1 overflow-x-auto">
                    <span className={`${chipBaseClass} border-gray-200 bg-white text-gray-700`}>
                        {event.category}
                    </span>

                    {zoneLabel && (
                        <span className={`${chipBaseClass} border-gray-200 bg-white text-gray-600`}>{zoneLabel}</span>
                    )}

                    {event.action && (
                        <span
                            className={`${chipBaseClass} ${
                                event.category === 'Shot'
                                    ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                                    : 'border-purple-200 bg-purple-50 text-purple-700'
                            }`}
                        >
                            <span>{event.action}</span>
                            {event.category === 'Shot' && event.action === 'Goal' && goalZoneTag && (
                                <span className="ml-1 text-[10px] uppercase text-indigo-400">{goalZoneTag}</span>
                            )}
                        </span>
                    )}

                    {contextTags.map(tag => (
                        <span key={tag} className={mutedChipClass}>
                            {tag}
                        </span>
                    ))}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {canSeekToVideo && (
                        <button
                            type="button"
                            onClick={handleSeekToVideo}
                            className="p-1.5 rounded-full border border-gray-200 text-red-500 hover:text-red-600 hover:border-red-300 transition-colors"
                            title={`Go to video ${formatVideoTime(calculatedVideoTime)}`}
                        >
                            <Play size={12} fill="currentColor" />
                        </button>
                    )}
                    <span className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit2 size={14} />
                    </span>
                </div>
            </div>
        </div>
    );
};
