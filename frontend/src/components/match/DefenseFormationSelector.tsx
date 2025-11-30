import { Shield } from 'lucide-react';
import type { DefenseType } from '../../types';

interface DefenseFormationSelectorProps {
  defenseFormation: DefenseType | null;
  onDefenseFormationChange: (formation: DefenseType) => void;
}

const formations: DefenseType[] = ['6-0', '5-1', '3-2-1', '3-3', '4-2', 'Mixed'];

export const DefenseFormationSelector = ({ 
  defenseFormation, 
  onDefenseFormationChange 
}: DefenseFormationSelectorProps) => (
  <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
    <div className="flex items-center gap-2 mb-4">
      <Shield className="text-gray-600" size={20} />
      <h3 className="text-lg font-bold text-gray-800">Opponent Defense</h3>
    </div>
    <div className="grid grid-cols-3 gap-2">
      {formations.map((def) => (
        <button
          key={def}
          onClick={() => onDefenseFormationChange(def)}
          className={`p-2 rounded text-xs md:text-sm font-bold transition-colors ${
            defenseFormation === def 
              ? 'bg-gray-800 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {def}
        </button>
      ))}
    </div>
  </div>
);
