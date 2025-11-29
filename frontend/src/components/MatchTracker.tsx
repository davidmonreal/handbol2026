import { useState } from 'react';
import { HOME_TEAM, VISITOR_TEAM } from '../data/mockData';
import type { Team } from '../data/mockData';
import { useMatch } from '../context/MatchContext';
import type { FlowType, ZoneType, MatchEvent } from '../types';
import { ZONE_CONFIG } from '../config/zones';
import { Scoreboard } from './match/Scoreboard';
import { PlayerSelector } from './match/PlayerSelector';
import { DefenseFormationSelector } from './match/DefenseFormationSelector';
import { FlowSelector } from './match/FlowSelector';
import { ShotFlow } from './match/flows/ShotFlow';
import { SanctionFlow } from './match/flows/SanctionFlow';
import { TurnoverFlow } from './match/flows/TurnoverFlow';

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
        isCollective: (zoneOverride || selectedZone) === ZONE_CONFIG.penalty.zone ? false : isCollective,
        hasOpposition: (zoneOverride || selectedZone) === ZONE_CONFIG.penalty.zone ? false : hasOpposition,
        isCounterAttack: (zoneOverride || selectedZone) === ZONE_CONFIG.penalty.zone ? false : isCounterAttack
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

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Scoreboard */}
      <Scoreboard
        homeTeam={HOME_TEAM}
        visitorTeam={VISITOR_TEAM}
        homeScore={homeScore}
        visitorScore={visitorScore}
        time={time}
        isPlaying={isPlaying}
        activeTeamId={activeTeamId}
        onHomeScoreChange={setHomeScore}
        onVisitorScoreChange={setVisitorScore}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onReset={() => { 
          setIsPlaying(false); 
          setTime(0); 
          setHomeScore(0); 
          setVisitorScore(0); 
          setActiveTeamId(null); 
          setEvents([]); 
        }}
        onTeamSelect={handleTeamSelect}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Player Selection & Defense */}
        <div className="lg:col-span-4 space-y-6">
          {/* Player Selection */}
          {activeTeam ? (
            <PlayerSelector
              team={activeTeam}
              selectedPlayerId={selectedPlayerId}
              onPlayerSelect={(playerId) => { 
                setSelectedPlayerId(playerId); 
                resetPlayState(); 
              }}
            />
          ) : (
            <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500 border-2 border-dashed">
              Select a team to view players
            </div>
          )}

          {/* Defense Formation (Persistent) */}
          <DefenseFormationSelector
            defenseFormation={defenseFormation}
            onDefenseFormationChange={setDefenseFormation}
          />
        </div>

        {/* Right Column: Recording Interface */}
        <div className="lg:col-span-8">
          {selectedPlayerId ? (
            <div className="space-y-6">
              
              {/* 1. Flow Selection */}
              <FlowSelector
                flowType={flowType}
                onFlowSelect={handleFlowSelect}
                onEditFlow={() => { setFlowType(null); resetPlayState(); }}
              />

              {/* 2. SHOT FLOW */}
              {flowType === 'Shot' && (
                <ShotFlow
                  selectedZone={selectedZone}
                  selectedAction={selectedAction}
                  isCollective={isCollective}
                  hasOpposition={hasOpposition}
                  isCounterAttack={isCounterAttack}
                  onZoneSelect={setSelectedZone}
                  onActionSelect={setSelectedAction}
                  onToggleCollective={() => setIsCollective(!isCollective)}
                  onToggleOpposition={() => setHasOpposition(!hasOpposition)}
                  onToggleCounter={() => setIsCounterAttack(!isCounterAttack)}
                  onEditZone={() => { setSelectedZone(null); setSelectedAction(null); }}
                  onEditResult={() => setSelectedAction(null)}
                  onFinalizeEvent={handleFinalizeEvent}
                />
              )}

              {/* 2. SANCTION FLOW */}
              {flowType === 'Sanction' && (
                <SanctionFlow
                  selectedAction={selectedAction}
                  onActionSelect={setSelectedAction}
                  onZoneSelect={setSelectedZone}
                  onEditSeverity={() => { setSelectedAction(null); setSelectedZone(null); }}
                  onFinalizeEvent={handleFinalizeEvent}
                />
              )}

              {/* 3. TURNOVER FLOW */}
              {flowType === 'Turnover' && (
                <TurnoverFlow
                  selectedAction={selectedAction}
                  onActionSelect={setSelectedAction}
                  onZoneSelect={setSelectedZone}
                  onFinalizeEvent={handleFinalizeEvent}
                />
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
