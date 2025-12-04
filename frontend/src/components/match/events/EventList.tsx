import { useMatch } from '../../../context/MatchContext';
import { EventItem } from './EventItem';
import type { MatchEvent } from '../../../types';

interface EventListProps {
    maxEvents?: number;
    onEditEvent?: (event: MatchEvent) => void;
}

export const EventList = ({ maxEvents = 5, onEditEvent }: EventListProps) => {
    const { events } = useMatch();

    // Get the last N events (most recent first)
    const recentEvents = [...events].reverse().slice(0, maxEvents);

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
                    Recent Events
                </h3>
            </div>
            <div className="divide-y divide-gray-100">
                {recentEvents.map(event => (
                    <EventItem
                        key={event.id}
                        event={event}
                        onEdit={onEditEvent}
                    />
                ))}
            </div>
        </div>
    );
};
