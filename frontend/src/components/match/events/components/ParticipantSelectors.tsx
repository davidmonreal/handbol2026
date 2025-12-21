import type { Translator, EventFormPlayer } from './types';

type OpponentGoalkeeperSelectorProps = {
    opponentGoalkeepers: EventFormPlayer[];
    selectedOpponentGkId: string | null;
    onSelect: (playerId: string) => void;
    t: Translator;
};

export const OpponentGoalkeeperSelector = ({
    opponentGoalkeepers,
    selectedOpponentGkId,
    onSelect,
    t,
}: OpponentGoalkeeperSelectorProps) => (
    <div className="relative">
        <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {t('eventForm.opponentGk')}
            </div>
            {!selectedOpponentGkId && (
                <span className="text-xs text-orange-600 font-medium animate-pulse">
                    {t('eventForm.selectGk')}
                </span>
            )}
        </div>

        {opponentGoalkeepers.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {opponentGoalkeepers.map((gk) => {
                    const nameParts = gk.name.split(' ');
                    const shortName =
                        nameParts.length > 1 ? `${nameParts[0]} ${nameParts[1][0]}.` : gk.name;

                    return (
                        <button
                            key={gk.id}
                            onClick={() => onSelect(gk.id)}
                            className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                                selectedOpponentGkId === gk.id
                                    ? 'bg-orange-600 border-orange-600 text-white shadow-sm'
                                    : 'bg-white border-gray-200 text-gray-700 hover:border-orange-300 hover:bg-orange-50'
                            }`}
                        >
                            <span
                                className={`flex items-center justify-center w-6 h-6 rounded text-sm font-bold ${
                                    selectedOpponentGkId === gk.id
                                        ? 'bg-white/20 text-white'
                                        : 'bg-orange-100 text-orange-800'
                                }`}
                            >
                                {gk.number}
                            </span>
                            <span
                                className={`text-xs font-semibold truncate ${
                                    selectedOpponentGkId === gk.id
                                        ? 'text-orange-50'
                                        : 'text-gray-600'
                                }`}
                            >
                                {shortName}
                            </span>
                        </button>
                    );
                })}
            </div>
        ) : (
            <div className="text-sm text-gray-400 italic">{t('eventForm.noGoalkeepers')}</div>
        )}
    </div>
);

type PlayerGridProps = {
    players: EventFormPlayer[];
    selectedPlayerId: string | null;
    onSelect: (playerId: string) => void;
    t: Translator;
};

export const PlayerGrid = ({ players, selectedPlayerId, onSelect, t }: PlayerGridProps) => (
    <div className="relative">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            {t('eventForm.selectPlayer')}
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {players.map((player) => {
                const nameParts = player.name.split(' ');
                const displayName =
                    nameParts.length >= 2 ? `${nameParts[0]} ${nameParts[1]}` : player.name;
                const isSelected = selectedPlayerId === player.id;
                const isGoalkeeper = player.isGoalkeeper;
                const buttonClass = isSelected
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50';

                return (
                    <button
                        key={player.id}
                        onClick={() => onSelect(player.id)}
                        className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${buttonClass}`}
                    >
                        <span
                            className={`flex items-center justify-center w-6 h-6 rounded text-sm font-bold ${
                                isSelected
                                    ? 'bg-white/20 text-white'
                                    : isGoalkeeper
                                    ? 'bg-orange-100 text-orange-800'
                                    : 'bg-gray-100 text-gray-900'
                            }`}
                        >
                            {player.number}
                        </span>
                        <span
                            className={`text-xs font-semibold truncate ${
                                isSelected ? 'text-indigo-50' : 'text-gray-600'
                            }`}
                        >
                            {displayName}
                        </span>
                    </button>
                );
            })}
        </div>
    </div>
);
