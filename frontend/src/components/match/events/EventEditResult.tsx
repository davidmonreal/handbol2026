import { useState } from 'react';
import type { MatchEvent } from '../../../types';

interface EventEditResultProps {
  event: MatchEvent;
  team: {
    id: string;
    name: string;
    color: string;
    players: { id: string; number: number; name: string; position?: string }[];
  };
  onSave: (event: MatchEvent) => void;
  onCancel: () => void;
  onDelete: (eventId: string) => void;
}

const RESULT_OPTIONS = ['Goal', 'Save', 'Miss', 'Post', 'Block'] as const;

export const EventEditResult = ({ event, team, onSave, onCancel, onDelete }: EventEditResultProps) => {
  const [selectedAction, setSelectedAction] = useState(event.action);
  const [selectedPlayerId, setSelectedPlayerId] = useState(event.playerId);
  const [isCollective, setIsCollective] = useState(!!event.isCollective);
  const [hasOpposition, setHasOpposition] = useState(!!event.hasOpposition);
  const [isCounterAttack, setIsCounterAttack] = useState(!!event.isCounterAttack);

  const handleSave = () => {
    onSave({
      ...event,
      action: selectedAction,
      playerId: selectedPlayerId,
      isCollective,
      hasOpposition,
      isCounterAttack,
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {RESULT_OPTIONS.map(option => (
          <button
            key={option}
            role="button"
            onClick={() => setSelectedAction(option)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedAction === option
                ? 'bg-indigo-500 text-white shadow'
                : 'bg-white border border-gray-300 text-gray-700'
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Player</p>
        <button
          className="w-full flex items-center justify-between p-3 bg-white border border-gray-300 rounded-lg"
          onClick={() => {
            const other = team.players.find(p => p.id !== selectedPlayerId);
            if (other) setSelectedPlayerId(other.id);
          }}
        >
          <span>
            {team.players.find(p => p.id === selectedPlayerId)?.name || 'Select Player'}
          </span>
          <span className="text-gray-400 text-xs">Change</span>
        </button>
        <div className="hidden">
          {team.players.map(p => (
            <button key={p.id} onClick={() => setSelectedPlayerId(p.id)}>
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-sm">
        <button
          onClick={() => setIsCollective(false)}
          className={`p-2 rounded-lg ${!isCollective ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-50'}`}
        >
          Individual
        </button>
        <button
          onClick={() => setHasOpposition(false)}
          className={`p-2 rounded-lg ${!hasOpposition ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-50'}`}
        >
          Free
        </button>
        <button
          onClick={() => setIsCounterAttack(false)}
          className={`p-2 rounded-lg ${!isCounterAttack ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-50'}`}
        >
          Static
        </button>
      </div>

      <div className="flex justify-end gap-2">
        <button onClick={() => onDelete(event.id)} className="px-3 py-2 text-red-600">
          Delete
        </button>
        <button onClick={onCancel} className="px-3 py-2 text-gray-600">
          Cancel
        </button>
        <button onClick={handleSave} className="px-3 py-2 bg-indigo-600 text-white rounded">
          Save
        </button>
      </div>
    </div>
  );
};
