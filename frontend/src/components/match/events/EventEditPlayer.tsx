import type { MatchEvent } from '../../../types';
import { useMatch } from '../../../context/MatchContext';

interface Player {
    id: string;
    number: number;
    name: string;
    position: string;
    isGoalkeeper?: boolean;
}

interface Team {
    id: string;
    name: string;
    players: Player[];
}

interface EventEditPlayerProps {
    event: MatchEvent;
    team: Team | null;
    onSave: () => void;
    onCancel: () => void;
}

export const EventEditPlayer = ({ event, team, onSave, onCancel }: EventEditPlayerProps) => {
    const { updateEvent } = useMatch();

    const handleSelect = async (playerId: string) => {
        const player = team?.players?.find(p => p.id === playerId);
        if (!player) return;

        await updateEvent(event.id, {
            playerId,
            playerName: player.name,
            playerNumber: player.number,
        });
        onSave();
    };

    if (!team) {
        return <div className="text-sm text-gray-400">Team not found</div>;
    }

    return (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 w-full">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Change Player
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {team.players.map(player => (
                    <button
                        key={player.id}
                        onClick={() => handleSelect(player.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all text-left ${event.playerId === player.id
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                            }`}
                    >
                        <span className="font-bold min-w-[2ch]">#{player.number}</span>
                        <span className="flex-1 truncate">{player.name}</span>
                    </button>
                ))}
            </div>

            {/* Cancel button moved to bottom right */}
            <div className="flex justify-end mt-3">
                <button
                    onClick={onCancel}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};
