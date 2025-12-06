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
}

export const EventList = ({
    initialEventsToShow = 5,
    incrementBy = 20,
    onEditEvent,
    onSeekToVideo,
    isVideoLoaded = false,
    getVideoTimeFromMatch,
}: EventListProps) => {
    const { events } = useMatch();
    const [eventsToShow, setEventsToShow] = useState(initialEventsToShow);

    // Get recent events (most recent first)
    const recentEvents = [...events].reverse().slice(0, eventsToShow);
    const hasMoreEvents = events.length > eventsToShow;
    const remainingEvents = events.length - eventsToShow;

    const handleShowMore = () => {
        setEventsToShow(prev => prev + incrementBy);
    };

    if (events.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-4 text-center text-gray-500 text-sm">
                No events recorded yet
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="font-bold text-gray-700 uppercase text-xs tracking-wider">
                    Recent Events ({recentEvents.length} of {events.length})
                </h3>
            </div>
            <div className="divide-y divide-gray-100">
                {recentEvents.map(event => (
                    <EventItem
                        key={event.id}
                        event={event}
                        onEdit={onEditEvent}
                        onSeekToVideo={onSeekToVideo}
                        isVideoLoaded={isVideoLoaded}
                        getVideoTimeFromMatch={getVideoTimeFromMatch}
                    />
                ))}
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
