import { User, Users, Shield, Activity, TrendingUp } from 'lucide-react';
import { DropdownSelect } from '../common';

interface FiltersBarProps {
  filterOpposition: boolean | null;
  filterCollective: boolean | null;
  filterCounterAttack: boolean | null;
  setFilterOpposition: (value: boolean | null) => void;
  setFilterCollective: (value: boolean | null) => void;
  setFilterCounterAttack: (value: boolean | null) => void;
  playWindowOptions?: { label: string; value: { start: number; end: number } }[];
  selectedPlayWindow?: { start: number; end: number } | null;
  onPlayWindowChange?: (range: { start: number; end: number } | null) => void;
}

export function FiltersBar({
  filterOpposition,
  filterCollective,
  filterCounterAttack,
  setFilterOpposition,
  setFilterCollective,
  setFilterCounterAttack,
  playWindowOptions = [],
  selectedPlayWindow,
  onPlayWindowChange,
}: FiltersBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full">
      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Filters:</span>
      
      {/* Opposition Group */}
      <div className="flex bg-gray-100 rounded-lg p-0.5 gap-1">
        <button
          onClick={() => setFilterOpposition(filterOpposition === false ? null : false)}
          className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
            filterOpposition === false
              ? 'bg-white text-orange-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <User size={12} />
          Free
        </button>
        <button
          onClick={() => setFilterOpposition(filterOpposition === true ? null : true)}
          className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
            filterOpposition === true
              ? 'bg-white text-orange-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Shield size={12} />
          Opposition
        </button>
      </div>

      <div className="w-px h-6 bg-gray-200"></div>

      {/* Collective Group */}
      <div className="flex bg-gray-100 rounded-lg p-0.5 gap-1">
        <button
          onClick={() => setFilterCollective(filterCollective === false ? null : false)}
          className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
            filterCollective === false
              ? 'bg-white text-purple-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <User size={12} />
          Individual
        </button>
        <button
          onClick={() => setFilterCollective(filterCollective === true ? null : true)}
          className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
            filterCollective === true
              ? 'bg-white text-purple-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users size={12} />
          Collective
        </button>
      </div>

      <div className="w-px h-6 bg-gray-200"></div>

      {/* Counter Group */}
      <div className="flex bg-gray-100 rounded-lg p-0.5 gap-1">
        <button
          onClick={() => setFilterCounterAttack(filterCounterAttack === false ? null : false)}
          className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
            filterCounterAttack === false
              ? 'bg-white text-cyan-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Activity size={12} />
          Static
        </button>
        <button
          onClick={() => setFilterCounterAttack(filterCounterAttack === true ? null : true)}
          className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
            filterCounterAttack === true
              ? 'bg-white text-cyan-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <TrendingUp size={12} />
          Counter
        </button>
      </div>
      {/* Spacer to push dropdown right on larger screens */}
      <div className="flex-1 min-w-[1px]" />
      {/* Play window dropdown */}
      {onPlayWindowChange && playWindowOptions.length > 0 && (
        <div className="w-full sm:w-auto">
          <DropdownSelect
            label={<span className="text-xs font-semibold text-gray-500">Plays</span>}
            options={playWindowOptions.map((opt) => ({
              label: opt.label,
              value: `${opt.value.start}-${opt.value.end}`,
            }))}
            value={selectedPlayWindow ? `${selectedPlayWindow.start}-${selectedPlayWindow.end}` : null}
            onChange={(val) => {
              if (!val) {
                onPlayWindowChange(null);
                return;
              }
              const [start, end] = String(val).split('-').map(Number);
              onPlayWindowChange({ start, end });
            }}
            placeholder="All plays"
          />
        </div>
      )}
    </div>
  );
}
