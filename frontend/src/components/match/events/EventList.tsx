import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useMatch } from '../../../context/MatchContext';
import { EventItem } from './EventItem';
import type { MatchEvent } from '../../../types';

interface EventListProps {
    initialEventsToShow?: number;
    incrementBy?: number;
    onEditEvent?: (event: MatchEvent) => void;
    onSeekToVideo?: (videoTimestamp: number) => void;
    isVideoLoaded?: boolean;
    getVideoTimeFromMatch?: (matchTime: number) => number | null;
    filterTeamId?: string | null;
    secondHalfStart?: number | null;
}

export const EventList = ({
    initialEventsToShow = 5,
    incrementBy = 20,
    onEditEvent,
    onSeekToVideo,
    isVideoLoaded = false,
    getVideoTimeFromMatch,
    filterTeamId,
    secondHalfStart,
}: EventListProps) => {
    const { events } = useMatch();
    const [eventsToShow, setEventsToShow] = useState(initialEventsToShow);

    // Filter events if necessary; if no team selected, show all events
    const filteredEvents = filterTeamId
        ? events.filter(e => e.teamId === filterTeamId)
        : events;

    // Get recent events (most recent first)
    const recentEvents = [...filteredEvents].reverse().slice(0, eventsToShow);
    const hasMoreEvents = filteredEvents.length > eventsToShow;
    const remainingEvents = filteredEvents.length - eventsToShow;

    const handleShowMore = () => {
        setEventsToShow(prev => prev + incrementBy);
    };

    return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h3 className="font-semibold text-gray-700 uppercase text-xs tracking-wide">
                    Recent Events ({recentEvents.length} of {filteredEvents.length})
                </h3>
            </div>
            <div>
                {recentEvents.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                        No events recorded yet
                    </div>
                ) : (
                    recentEvents.map(event => (
                        <EventItem
                            key={event.id}
                            event={event}
                            onEdit={onEditEvent}
                            onSeekToVideo={onSeekToVideo}
                            isVideoLoaded={isVideoLoaded}
                            getVideoTimeFromMatch={getVideoTimeFromMatch}
                            secondHalfStart={secondHalfStart}
                        />
                    ))
                )}
            </div>
            {hasMoreEvents && (
                <button
                    onClick={handleShowMore}
                    className="w-full py-3 px-4 text-sm font-medium text-indigo-600 hover:bg-indigo-50 border-t border-gray-200 flex items-center justify-center gap-2 transition-colors"
                >
                    <ChevronDown size={16} />
                    Show {Math.min(incrementBy, remainingEvents)} more events
                </button>
            )}
        </div>
    );
};
