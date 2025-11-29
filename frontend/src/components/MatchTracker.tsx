import { useState } from 'react';
import { Play, Pause, RotateCcw, Plus, Minus, Users, Target, Activity, AlertTriangle, FileWarning, Shield, Zap, Check, Edit2, User, Unlock, Anchor } from 'lucide-react';
import { HOME_TEAM, VISITOR_TEAM } from '../data/mockData';
import type { Team } from '../data/mockData';
import { useMatch } from '../context/MatchContext';
import type { FlowType, ZoneType, MatchEvent, ShotResult, TurnoverType, SanctionType, DefenseType } from '../types';
import { ZONE_CONFIG } from '../config/zones';

const MatchTracker = () => {
  // Use Context
  const { 
    homeScore, setHomeScore, 
    visitorScore, setVisitorScore, 
    isPlaying, setIsPlaying, 
    time, setTime, 
    events, setEvents,
    activeTeamId, setActiveTeamId,
    defenseFormation, setDefenseFormation,
    addEvent
  } = useMatch();

  // Local Selection State (Transient)
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  
  // Flow State
  const [flowType, setFlowType] = useState<FlowType>(null);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<ZoneType | null>(null);
  
  // Context State
  const [isCollective, setIsCollective] = useState(false);
  const [hasOpposition, setHasOpposition] = useState(false);
  const [isCounterAttack, setIsCounterAttack] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTeamSelect = (teamId: string) => {
    setActiveTeamId(teamId);
    setSelectedPlayerId(null);
    resetPlayState();
  };

  const resetPlayState = () => {
    setFlowType(null);
    setSelectedAction(null);
    setSelectedZone(null);
    setIsCollective(false);
    setHasOpposition(false);
    setIsCounterAttack(false);
  };

  const handleFlowSelect = (type: FlowType) => {
    setFlowType(type);
    setSelectedAction(null);
    setSelectedZone(null);
  };

  const handleFinalizeEvent = (targetIndex?: number, zoneOverride?: ZoneType) => {
    if (!activeTeamId || !selectedPlayerId || !flowType || !selectedAction) return;

    const newEvent: MatchEvent = {
      id: Date.now().toString(),
      timestamp: time,
      teamId: activeTeamId,
      playerId: selectedPlayerId,
      category: flowType,
      action: selectedAction,
      zone: zoneOverride || selectedZone || undefined,
      goalTarget: targetIndex,
      context: flowType === 'Shot' ? {
        isCollective,
        hasOpposition,
        isCounterAttack
      } : undefined,
      defenseFormation: defenseFormation
    };

    addEvent(newEvent);

    // Reset
    setSelectedPlayerId(null);
    resetPlayState();
  };

  const getActiveTeam = (): Team | null => {
    if (activeTeamId === HOME_TEAM.id) return HOME_TEAM;
    if (activeTeamId === VISITOR_TEAM.id) return VISITOR_TEAM;
    return null;
  };

  const activeTeam = getActiveTeam();
  
  // Helper for collapsed step
  const CollapsedStep = ({ 
    label, 
    value, 
    onEdit,
    icon: Icon
  }: { 
    label: string, 
    value: string, 
    onEdit: () => void,
    icon: any
  }) => (
    <div 
      onClick={onEdit}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-all group animate-fade-in"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-green-100 text-green-700 rounded-lg">
          <Check size={16} />
        </div>
        <div>
          <div className="text-xs text-gray-500 font-medium uppercase">{label}</div>
          <div className="font-bold text-gray-800 flex items-center gap-2">
            <Icon size={16} className="text-gray-400" />
            {value}
          </div>
        </div>
      </div>
      <div className="text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
        <Edit2 size={16} />
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Scoreboard */}
      <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 mb-6">
        <div className="flex justify-between items-center">
          {/* Home Team */}
          <div 
            className={`text-center flex-1 p-2 md:p-4 rounded-lg cursor-pointer transition-colors ${activeTeamId === HOME_TEAM.id ? 'bg-blue-50 border-2 border-blue-500' : 'hover:bg-gray-50'}`}
            onClick={() => handleTeamSelect(HOME_TEAM.id)}
          >
            <h2 className="text-lg md:text-2xl font-bold text-gray-800 mb-2">{HOME_TEAM.name}</h2>
            <div className="text-4xl md:text-6xl font-bold text-blue-600 mb-4">{homeScore}</div>
            <div className="flex justify-center gap-2" onClick={(e) => e.stopPropagation()}>
               <button onClick={() => setHomeScore(s => Math.max(0, s - 1))} className="p-1 rounded bg-gray-100"><Minus size={16}/></button>
               <button onClick={() => setHomeScore(s => s + 1)} className="p-1 rounded bg-gray-100"><Plus size={16}/></button>
            </div>
          </div>

          {/* Timer */}
          <div className="flex flex-col items-center px-2 md:px-8">
            <div className="text-3xl md:text-5xl font-mono font-bold text-gray-900 mb-4">{formatTime(time)}</div>
            <div className="flex gap-2">
              <button onClick={() => setIsPlaying(!isPlaying)} className={`p-2 md:p-3 rounded-full ${isPlaying ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <button onClick={() => { setIsPlaying(false); setTime(0); setHomeScore(0); setVisitorScore(0); setActiveTeamId(null); setEvents([]); }} className="p-2 md:p-3 rounded-full bg-red-100 text-red-600">
                <RotateCcw size={20} />
              </button>
            </div>
          </div>

          {/* Visitor Team */}
          <div 
            className={`text-center flex-1 p-2 md:p-4 rounded-lg cursor-pointer transition-colors ${activeTeamId === VISITOR_TEAM.id ? 'bg-red-50 border-2 border-red-500' : 'hover:bg-gray-50'}`}
            onClick={() => handleTeamSelect(VISITOR_TEAM.id)}
          >
            <h2 className="text-lg md:text-2xl font-bold text-gray-800 mb-2">{VISITOR_TEAM.name}</h2>
            <div className="text-4xl md:text-6xl font-bold text-red-600 mb-4">{visitorScore}</div>
            <div className="flex justify-center gap-2" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setVisitorScore(s => Math.max(0, s - 1))} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"><Minus size={20} /></button>
              <button onClick={() => setVisitorScore(s => s + 1)} className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200"><Plus size={20} /></button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Player Selection & Defense */}
        <div className="lg:col-span-4 space-y-6">
          {/* Player Selection */}
          {activeTeam ? (
            <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className={activeTeam.id === 'home' ? 'text-blue-600' : 'text-red-600'} />
                <h3 className="text-lg font-bold text-gray-800">Players</h3>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-2 lg:grid-cols-2 gap-3">
                {activeTeam.players.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => { setSelectedPlayerId(player.id); resetPlayState(); }}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      selectedPlayerId === player.id
                        ? activeTeam.id === 'home' ? 'border-blue-500 bg-blue-50' : 'border-red-500 bg-red-50'
                        : 'border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-bold text-lg">{player.number}</div>
                    <div className="text-sm truncate hidden md:block">{player.name}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500 border-2 border-dashed">
              Select a team to view players
            </div>
          )}

          {/* Defense Formation (Persistent) */}
          <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
             <div className="flex items-center gap-2 mb-4">
                <Shield className="text-gray-600" size={20} />
                <h3 className="text-lg font-bold text-gray-800">Opponent Defense</h3>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {['6-0', '5-1', '3-2-1', '3-3', '4-2', 'Mixed'].map((def) => (
                  <button
                    key={def}
                    onClick={() => setDefenseFormation(def as DefenseType)}
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
        </div>

        {/* Right Column: Recording Interface */}
        <div className="lg:col-span-8">
          {selectedPlayerId ? (
            <div className="space-y-6">
              
              {/* 1. Flow Selection */}
              {flowType ? (
                <CollapsedStep 
                    label="Category" 
                    value={flowType} 
                    onEdit={() => { setFlowType(null); resetPlayState(); }}
                    icon={flowType === 'Shot' ? Target : flowType === 'Turnover' ? AlertTriangle : FileWarning}
                />
              ) : (
                <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 animate-fade-in">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Activity size={20} /> 1. Select Category
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                    <button
                        onClick={() => handleFlowSelect('Shot')}
                        className={`p-4 md:p-6 rounded-xl font-bold text-sm md:text-xl flex flex-col items-center gap-2 transition-all ${
                        flowType === 'Shot' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                        <Target size={24} className="md:w-8 md:h-8" />
                        Shot
                    </button>
                    <button
                        onClick={() => handleFlowSelect('Turnover')}
                        className={`p-4 md:p-6 rounded-xl font-bold text-sm md:text-xl flex flex-col items-center gap-2 transition-all ${
                        flowType === 'Turnover' ? 'bg-orange-500 text-white shadow-lg' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                        <AlertTriangle size={24} className="md:w-8 md:h-8" />
                        Turnover
                    </button>
                    <button
                        onClick={() => handleFlowSelect('Sanction')}
                        className={`p-4 md:p-6 rounded-xl font-bold text-sm md:text-xl flex flex-col items-center gap-2 transition-all ${
                        flowType === 'Sanction' ? 'bg-red-600 text-white shadow-lg' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                        <FileWarning size={24} className="md:w-8 md:h-8" />
                        Foul
                    </button>
                    </div>
                </div>
              )}

              {/* 2. SHOT FLOW */}
              {flowType === 'Shot' && (
                <div className="space-y-6 animate-fade-in">
                  {/* Zone Selection */}
                  {selectedZone ? (
                    <CollapsedStep 
                        label="Zone" 
                        value={ZONE_CONFIG.sixMeter.find(z => z.zone === selectedZone)?.label || 
                               ZONE_CONFIG.nineMeter.find(z => z.zone === selectedZone)?.label || 
                               ZONE_CONFIG.penalty.label} 
                        onEdit={() => { setSelectedZone(null); setSelectedAction(null); }}
                        icon={Activity}
                    />
                  ) : (
                    <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 animate-fade-in">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">2. Select Zone</h3>
                        <div className="space-y-3">
                        {/* 6m Line */}
                        <div className="grid grid-cols-5 gap-2">
                            {ZONE_CONFIG.sixMeter.map(({ zone, label }) => (
                            <button
                                key={zone}
                                onClick={() => setSelectedZone(zone)}
                                className={`p-3 rounded-lg text-xs md:text-sm font-semibold transition-all ${
                                selectedZone === zone 
                                    ? 'bg-indigo-600 text-white shadow-lg ring-2 ring-indigo-300' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {label}
                            </button>
                            ))}
                        </div>
                        {/* 9m Line */}
                        <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
                            {ZONE_CONFIG.nineMeter.map(({ zone, label }) => (
                            <button
                                key={zone}
                                onClick={() => setSelectedZone(zone)}
                                className={`p-3 rounded-lg text-xs md:text-sm font-semibold transition-all ${
                                selectedZone === zone 
                                    ? 'bg-indigo-600 text-white shadow-lg ring-2 ring-indigo-300' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {label}
                            </button>
                            ))}
                        </div>
                        {/* 7m Penalty */}
                        <div className="max-w-xs mx-auto">
                            <button
                            onClick={() => setSelectedZone(ZONE_CONFIG.penalty.zone)}
                            className={`w-full p-3 rounded-lg text-xs md:text-sm font-semibold transition-all ${
                                selectedZone === ZONE_CONFIG.penalty.zone 
                                ? 'bg-indigo-600 text-white shadow-lg ring-2 ring-indigo-300' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                            >
                            {ZONE_CONFIG.penalty.label}
                            </button>
                        </div>
                        </div>
                    </div>
                  )}

                  {/* Context & Result */}
                  {selectedZone && (
                    <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 animate-fade-in">
                      <h3 className="text-lg font-bold text-gray-800 mb-4">3. Context & Result</h3>
                      
                      {selectedAction === 'Goal' ? (
                          <div className="mb-4">
                              <CollapsedStep 
                                label="Result" 
                                value="Goal (Select Target)" 
                                onEdit={() => setSelectedAction(null)}
                                icon={Target}
                              />
                          </div>
                      ) : (
                          <>
                            {/* Context Toggles */}
                            <div className="grid grid-cols-3 gap-3 mb-6">
                                <button
                                onClick={() => setIsCollective(!isCollective)}
                                className={`p-4 rounded-xl font-bold border-2 transition-all flex flex-col items-center gap-2 ${
                                    isCollective 
                                        ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-md' 
                                        : 'border-gray-200 text-gray-400 hover:bg-gray-50'
                                }`}
                                >
                                {isCollective ? <Users size={24} /> : <User size={24} />}
                                <span className="text-xs uppercase tracking-wider">{isCollective ? 'Collective' : 'Individual'}</span>
                                </button>
                                
                                <button
                                onClick={() => setHasOpposition(!hasOpposition)}
                                className={`p-4 rounded-xl font-bold border-2 transition-all flex flex-col items-center gap-2 ${
                                    hasOpposition 
                                        ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-md' 
                                        : 'border-gray-200 text-gray-400 hover:bg-gray-50'
                                }`}
                                >
                                {hasOpposition ? <Shield size={24} /> : <Unlock size={24} />}
                                <span className="text-xs uppercase tracking-wider">{hasOpposition ? 'Opposition' : 'Free'}</span>
                                </button>
                                
                                <button
                                onClick={() => setIsCounterAttack(!isCounterAttack)}
                                className={`p-4 rounded-xl font-bold border-2 transition-all flex flex-col items-center gap-2 ${
                                    isCounterAttack 
                                        ? 'border-cyan-500 bg-cyan-50 text-cyan-700 shadow-md' 
                                        : 'border-gray-200 text-gray-400 hover:bg-gray-50'
                                }`}
                                >
                                {isCounterAttack ? <Zap size={24} /> : <Anchor size={24} />}
                                <span className="text-xs uppercase tracking-wider">{isCounterAttack ? 'Counter' : 'Static'}</span>
                                </button>
                            </div>

                            {/* Result Buttons */}
                            <div className="grid grid-cols-5 gap-2 mb-6">
                                {['Goal', 'Save', 'Miss', 'Post', 'Block'].map((action) => (
                                <button
                                    key={action}
                                    onClick={() => setSelectedAction(action)}
                                    className={`p-2 md:p-3 rounded-lg font-bold text-xs md:text-sm ${
                                    selectedAction === action ? 'bg-indigo-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
                                    }`}
                                >
                                    {action}
                                </button>
                                ))}
                            </div>
                          </>
                      )}

                      {/* Goal Grid */}
                      {selectedAction === 'Goal' && (
                        <div className="animate-fade-in">
                          <h4 className="text-sm font-bold text-gray-500 mb-2 text-center">Select Target to Confirm</h4>
                          <div className="max-w-[200px] mx-auto aspect-square bg-gray-100 rounded-lg p-2 border-4 border-gray-200">
                            <div className="grid grid-cols-3 grid-rows-3 gap-2 h-full">
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((target) => (
                                <button
                                  key={target}
                                  onClick={() => handleFinalizeEvent(target)}
                                  className="bg-white border-2 border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 rounded-md transition-all shadow-sm"
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Confirm button */}
                      {selectedAction && selectedAction !== 'Goal' && (
                          <div className="animate-fade-in mt-4">
                              <button 
                                onClick={() => handleFinalizeEvent()}
                                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                              >
                                  <Check size={24} />
                                  Confirm {selectedAction}
                              </button>
                          </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 2. SANCTION FLOW */}
              {flowType === 'Sanction' && (
                <div className="space-y-6 animate-fade-in">
                  {/* Step 2: Severity */}
                  {selectedAction ? (
                     <CollapsedStep 
                        label="Severity" 
                        value={selectedAction} 
                        onEdit={() => { setSelectedAction(null); setSelectedZone(null); }}
                        icon={FileWarning}
                     />
                  ) : (
                    <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 animate-fade-in">
                      <h3 className="text-lg font-bold text-gray-800 mb-4">2. Select Severity</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => setSelectedAction('Foul')} className="p-4 bg-gray-100 text-gray-800 font-bold rounded-lg hover:bg-gray-200 border-2 border-gray-200 col-span-2">Common Foul</button>
                        <button onClick={() => setSelectedAction('Yellow')} className="p-4 bg-yellow-400 text-yellow-900 font-bold rounded-lg hover:opacity-90">Yellow Card</button>
                        <button onClick={() => setSelectedAction('2min')} className="p-4 bg-gray-800 text-white font-bold rounded-lg hover:opacity-90">2 Minutes</button>
                        <button onClick={() => setSelectedAction('Red')} className="p-4 bg-red-600 text-white font-bold rounded-lg hover:opacity-90">Red Card</button>
                        <button onClick={() => setSelectedAction('Blue Card')} className="p-4 bg-blue-600 text-white font-bold rounded-lg hover:opacity-90">Blue Card</button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Zone (Only if Severity selected) */}
                  {selectedAction && (
                    <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 animate-fade-in">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">3. Select Zone</h3>
                        <div className="space-y-3">
                        {/* 6m Line */}
                        <div className="grid grid-cols-5 gap-2">
                            {ZONE_CONFIG.sixMeter.map(({ zone, label }) => (
                            <button
                                key={zone}
                                onClick={() => { setSelectedZone(zone); handleFinalizeEvent(undefined, zone); }}
                                className="p-3 rounded-lg text-xs md:text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-indigo-600 hover:text-white transition-all"
                            >
                                {label}
                            </button>
                            ))}
                        </div>
                        {/* 9m Line */}
                        <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
                            {ZONE_CONFIG.nineMeter.map(({ zone, label }) => (
                            <button
                                key={zone}
                                onClick={() => { setSelectedZone(zone); handleFinalizeEvent(undefined, zone); }}
                                className="p-3 rounded-lg text-xs md:text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-indigo-600 hover:text-white transition-all"
                            >
                                {label}
                            </button>
                            ))}
                        </div>
                        </div>
                    </div>
                  )}
                </div>
              )}

              {/* 3. TURNOVER FLOW */}
              {flowType === 'Turnover' && (
                <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 animate-fade-in">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">2. Select Error Type</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {['Pass', 'Catch', 'Dribble', 'Steps', 'Area', 'Offensive Foul'].map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          setSelectedAction(type);
                        }}
                        className={`p-4 rounded-lg font-medium transition-colors text-sm md:text-base ${
                          selectedAction === type ? 'bg-orange-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  {selectedAction && (
                    <div className="mt-6 animate-fade-in">
                        {selectedAction === 'Area' ? (
                            <>
                                <h3 className="text-lg font-bold text-gray-800 mb-4">3. Where? (Select 6m Zone)</h3>
                                <div className="grid grid-cols-5 gap-2">
                                    {ZONE_CONFIG.sixMeter.map(({ zone, label }) => (
                                        <button
                                            key={zone}
                                            onClick={() => { setSelectedZone(zone); handleFinalizeEvent(undefined, zone); }}
                                            className="p-3 rounded-lg text-xs md:text-sm font-semibold bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-all"
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <>
                                <h3 className="text-lg font-bold text-gray-800 mb-4">3. Where? (Optional)</h3>
                                <div className="grid grid-cols-3 gap-2">
                                    <button onClick={() => { setSelectedZone('9m-CB'); handleFinalizeEvent(undefined, '9m-CB'); }} className="p-3 bg-gray-100 hover:bg-gray-200 rounded text-sm">9m Area</button>
                                    <button onClick={() => { setSelectedZone('6m-CB'); handleFinalizeEvent(undefined, '6m-CB'); }} className="p-3 bg-gray-100 hover:bg-gray-200 rounded text-sm">6m Area</button>
                                    <button onClick={() => { setSelectedZone(null); handleFinalizeEvent(); }} className="p-3 border-2 border-gray-200 rounded text-gray-500 text-sm">Skip</button>
                                </div>
                            </>
                        )}
                    </div>
                  )}



                </div>
              )}

            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed p-12">
              Select a player to record stats
            </div>
          )}
        </div>
      </div>
      
      {/* Event Log (Debug) */}
      <div className="mt-8 bg-gray-50 p-4 rounded-lg text-xs font-mono text-gray-600">
        <h4 className="font-bold mb-2">Recent Events</h4>
        {events.slice(0, 5).map(e => (
            <div key={e.id}>
              {formatTime(e.timestamp)} - {e.teamId} - {e.playerId} - 
              <span className="font-bold"> {e.category}</span>: {e.action} 
              {e.zone ? ` (${e.zone})` : ''}
              {e.context?.isCollective ? ' [Coll]' : ''}
              {e.context?.hasOpposition ? ' [Opp]' : ''}
              {e.context?.isCounterAttack ? ' [Counter]' : ''}
              <span className="text-gray-500"> [Def: {e.defenseFormation}]</span>
            </div>
        ))}
      </div>
    </div>
  );
};

export default MatchTracker;
