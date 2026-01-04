import { Users } from 'lucide-react';

interface MatchPlayer {
  id: string;
  number?: number;
  name: string;
  position?: string;
  isGoalkeeper?: boolean;
}

interface MatchTeam {
  id: string;
  name: string;
  color: string;
  players: MatchPlayer[];
}

interface PlayerSelectorProps {
  team: MatchTeam;
  selectedPlayerId: string | null;
  onPlayerSelect: (playerId: string) => void;
}

export const PlayerSelector = ({ team, selectedPlayerId, onPlayerSelect }: PlayerSelectorProps) => {
  // Sort players by jersey number
  const sortedPlayers = [...team.players].sort((a, b) => {
    const numA = typeof a.number === 'number' ? a.number : Number.MAX_SAFE_INTEGER;
    const numB = typeof b.number === 'number' ? b.number : Number.MAX_SAFE_INTEGER;
    return numA - numB;
  });

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className={team.id === 'home' ? 'text-blue-600' : 'text-red-600'} />
        <h3 className="text-lg font-bold text-gray-800">Players</h3>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-2 lg:grid-cols-2 gap-3">
        {sortedPlayers.map((player) => (
          <button
            key={player.id}
            onClick={() => onPlayerSelect(player.id)}
            className={`p-3 rounded-lg border-2 text-left transition-all ${selectedPlayerId === player.id
              ? team.id === 'home' ? 'border-blue-500 bg-blue-50' : 'border-red-500 bg-red-50'
              : 'border-gray-100 hover:bg-gray-50'
              }`}
          >
            <div className="font-bold text-lg">{player.number ?? '-'}</div>
            <div className="text-sm truncate hidden md:block">{player.name}</div>
          </button>
        ))}
      </div>
    </div>
  );
};
