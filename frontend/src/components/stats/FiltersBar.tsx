import { User, Users, Shield, Activity, TrendingUp } from 'lucide-react';

interface FiltersBarProps {
  filterOpposition: boolean | null;
  filterCollective: boolean | null;
  filterCounterAttack: boolean | null;
  setFilterOpposition: (value: boolean | null) => void;
  setFilterCollective: (value: boolean | null) => void;
  setFilterCounterAttack: (value: boolean | null) => void;
}

export function FiltersBar({
  filterOpposition,
  filterCollective,
  filterCounterAttack,
  setFilterOpposition,
  setFilterCollective,
  setFilterCounterAttack,
}: FiltersBarProps) {
  return (
    <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Filters:</span>
      
      {/* Opposition Group */}
      <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
        <button
          onClick={() => setFilterOpposition(filterOpposition === false ? null : false)}
          className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
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
          className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
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
      <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
        <button
          onClick={() => setFilterCollective(filterCollective === false ? null : false)}
          className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
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
          className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
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
      <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
        <button
          onClick={() => setFilterCounterAttack(filterCounterAttack === false ? null : false)}
          className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
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
          className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
            filterCounterAttack === true
              ? 'bg-white text-cyan-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <TrendingUp size={12} />
          Counter
        </button>
      </div>
    </div>
  );
}
