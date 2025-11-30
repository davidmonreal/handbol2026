import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMatch } from '../context/MatchContext';
import type { FlowType, ZoneType, MatchEvent } from '../types';
import { API_BASE_URL } from '../config/api';
import { ZONE_CONFIG } from '../config/zones';
import { Scoreboard } from './match/Scoreboard';
import { PlayerSelector } from './match/PlayerSelector';
import { DefenseFormationSelector } from './match/DefenseFormationSelector';
import { FlowSelector } from './match/FlowSelector';
import { ShotFlow } from './match/flows/ShotFlow';
import { SanctionFlow } from './match/flows/SanctionFlow';
import { TurnoverFlow } from './match/flows/TurnoverFlow';

const MatchTracker = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();

  // Use Context
  const {
    homeScore, setHomeScore,
    visitorScore, setVisitorScore,
    isPlaying, setIsPlaying,
    time, setTime,
    events, setEvents,
    activeTeamId, setActiveTeamId,
    defenseFormation, setDefenseFormation,
    addEvent,
    homeTeam, visitorTeam, setMatchData
  } = useMatch();

  // Fetch Match Data
  useEffect(() => {
    if (matchId) {
      fetch(`${API_BASE_URL}/api/matches/${matchId}`)
        .then(res => res.json())
        .then(data => {
          console.log('API Response:', data);
          console.log('HomeTeam players:', data.homeTeam?.players);
          console.log('AwayTeam players:', data.awayTeam?.players);

          // Transform API data to Context format
          const transformTeam = (teamData: any, color: string) => ({
            id: teamData.id,
            name: teamData.name,
            color: color,
            players: (teamData.players || []).map((p: any) => ({
              id: p.player.id,
              number: p.player.number,
              name: p.player.name,
              position: p.role || 'Player'
            }))
          });

          const home = transformTeam(data.homeTeam, 'bg-yellow-400');
          const visitor = transformTeam(data.awayTeam, 'bg-white');

          console.log('Transformed home team:', home);
          console.log('Transformed visitor team:', visitor);

          setMatchData(data.id, home, visitor);
        })
        .catch(err => console.error('Error fetching match:', err));
    }
  }, [matchId, setMatchData]);

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

    const finalZone = zoneOverride || selectedZone || undefined;

    // Parse zone to get position and distance
    let position: string | undefined;
    let distance: string | undefined;

    if (finalZone) {
      if (finalZone === '7m') {
        distance = '7M';
        position = undefined; // Or '7M' if backend expects it
      } else {
        const parts = finalZone.split('-');
        if (parts.length === 2) {
          distance = parts[0] === '6m' ? '6M' : '9M';
          position = parts[1];
        }
      }
    }

    // Map target index to goal zone tag
    const targetToZoneMap: Record<number, string> = {
      1: 'TL', 2: 'TM', 3: 'TR',
      4: 'ML', 5: 'MM', 6: 'MR',
      7: 'BL', 8: 'BM', 9: 'BR'
    };
    const goalZoneTag = targetIndex ? targetToZoneMap[targetIndex] : undefined;

    const newEvent: MatchEvent = {
      id: Date.now().toString(),
      timestamp: time,
      teamId: activeTeamId,
      playerId: selectedPlayerId,
      category: flowType,
      action: selectedAction,
      zone: finalZone,
      position: position,
      distance: distance,
      goalTarget: targetIndex,
      goalZoneTag: goalZoneTag,
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

  const getActiveTeam = () => {
    if (activeTeamId === homeTeam?.id) return homeTeam;
    if (activeTeamId === visitorTeam?.id) return visitorTeam;
    return null;
  };

  const activeTeam = getActiveTeam();

  if (!homeTeam || !visitorTeam) {
    return <div className="p-8 text-center">Loading match data...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200 mb-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-gray-600 hover:text-indigo-600 font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              {homeTeam.name} vs {visitorTeam.name}
            </h1>
            <button
              onClick={() => navigate(`/statistics?matchId=${matchId}`)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Statistics
            </button>
          </div>
        </div>
      </nav>

      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Scoreboard */}
        <Scoreboard
          homeTeam={homeTeam}
          visitorTeam={visitorTeam}
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
    </div>
  );
};

export default MatchTracker;
