import { useState } from 'react';
import { ArrowLeftRight, ArrowUp, ArrowRight, User } from 'lucide-react';
import type { MatchEvent } from '../../../types';
import { SplitToggle } from '../shared/SplitToggle';
import { useSafeTranslation } from '../../../context/LanguageContext';

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
  const { t } = useSafeTranslation();
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
            {t(`eventForm.result.${option.toLowerCase()}`)}
          </button>
        ))}
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
          {t('eventForm.selectPlayer')}
        </p>
        <button
          className="w-full flex items-center justify-between p-3 bg-white border border-gray-300 rounded-lg"
          onClick={() => {
            const other = team.players.find(p => p.id !== selectedPlayerId);
            if (other) setSelectedPlayerId(other.id);
          }}
        >
          <span>
            {team.players.find(p => p.id === selectedPlayerId)?.name || t('eventForm.selectPlayer')}
          </span>
          <span className="text-gray-400 text-xs">{t('eventForm.changePlayer')}</span>
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
        <SplitToggle
          value={isCounterAttack}
          onChange={setIsCounterAttack}
          leftOption={{ label: t('eventForm.context.static'), icon: ArrowLeftRight }}
          rightOption={{ label: t('eventForm.context.counter'), icon: ArrowUp }}
        />
        <SplitToggle
          value={isCollective}
          onChange={setIsCollective}
          leftValue={true}
          rightValue={false}
          leftOption={{ label: t('eventForm.context.collective'), icon: [User, ArrowRight, User] }}
          rightOption={{ label: t('eventForm.context.individual'), icon: [User, ArrowRight] }}
        />
        <SplitToggle
          value={hasOpposition}
          onChange={setHasOpposition}
          leftValue={true}
          rightValue={false}
          leftOption={{ label: t('eventForm.context.opposition'), icon: [User, Users] }}
          rightOption={{ label: t('eventForm.context.free'), icon: User }}
        />
      </div>

      <div className="flex justify-end gap-2">
        <button onClick={() => onDelete(event.id)} className="px-3 py-2 text-red-600">
          {t('eventForm.deleteButton')}
        </button>
        <button onClick={onCancel} className="px-3 py-2 text-gray-600">
          {t('eventForm.cancelButton')}
        </button>
        <button onClick={handleSave} className="px-3 py-2 bg-indigo-600 text-white rounded">
          {t('eventForm.saveChanges')}
        </button>
      </div>
    </div>
  );
};
