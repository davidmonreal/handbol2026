import { useState, useEffect, useRef } from 'react';
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
import { EventList } from './match/events/EventList';
import { EventEditResult } from './match/events/EventEditResult';

const MatchTracker = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();

  // Use Context
  const {
    homeScore, setHomeScore,
    visitorScore, setVisitorScore,
    isPlaying, setIsPlaying,
    time, setTime,
    setEvents,
    activeTeamId, setActiveTeamId,
    defenseFormation, setDefenseFormation,
    addEvent,
    updateEvent, // Import updateEvent
    deleteEvent, // Import deleteEvent
    homeTeam, visitorTeam, setMatchData,
    selectedOpponentGoalkeeper, setSelectedOpponentGoalkeeper,
    matchId: contextMatchId // Get matchId from context
  } = useMatch();

  // Ref to track context match ID without triggering effect re-runs
  const contextMatchIdRef = useRef(contextMatchId);
  useEffect(() => {
    contextMatchIdRef.current = contextMatchId;
  }, [contextMatchId]);

  // Fetch Match Data
  useEffect(() => {
    if (!matchId) return;

    // OPTIMIZATION: If we already have the correct match data loaded, don't fetch again.
    // This minimizes DB calls and prevents state resets (active team deselection).
    if (contextMatchIdRef.current === matchId && homeTeam && visitorTeam) {
      return;
    }

    const loadMatchData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/matches/${matchId}`);
        if (!response.ok) throw new Error('Failed to load match');

        const data = await response.json();

        // Transform API data to Context format
        const transformTeam = (teamData: any, color: string) => ({
          id: teamData.id,
          name: teamData.name,
          category: teamData.category,
          club: teamData.club,
          color: color,
          players: (teamData.players || []).map((p: any) => ({
            id: p.player.id,
            number: p.player.number,
            name: p.player.name,
            position: p.role || 'Player',
            isGoalkeeper: p.player.isGoalkeeper
          }))
        });

        const home = transformTeam(data.homeTeam, 'bg-yellow-400');
        const visitor = transformTeam(data.awayTeam, 'bg-white');

        // Check if we are reloading the same match to preserve state
        const shouldPreserveState = contextMatchIdRef.current === data.id;

        setMatchData(data.id, home, visitor, shouldPreserveState);
      } catch (error) {
        console.error('Error loading match:', error);
      }
    };

    loadMatchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]); // Only depend on matchId to prevent infinite loops

  // Local Selection State (Transient)
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  // Editing State
  const [editingEvent, setEditingEvent] = useState<MatchEvent | null>(null);

  // Flow State
  const [flowType, setFlowType] = useState<FlowType>(null);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<ZoneType | null>(null);

  // Context State
  const [isCollective, setIsCollective] = useState(false);
  const [hasOpposition, setHasOpposition] = useState(false);
  const [isCounterAttack, setIsCounterAttack] = useState(false);

  const handleTeamSelect = (teamId: string) => {
    setActiveTeamId(teamId);
    setSelectedPlayerId(null);
    setEditingEvent(null); // Clear editing when changing team
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

  const handleEditEvent = (event: MatchEvent) => {
    setEditingEvent(event);
    // Optionally clear other states to avoid confusion
    setSelectedPlayerId(null);
    resetPlayState();
    // Scroll to top of right column? Not strictly necessary if layout is good.
  };

  const handleSaveEdit = async (updatedEvent: MatchEvent) => {
    if (!editingEvent) return;
    await updateEvent(editingEvent.id, updatedEvent);
    setEditingEvent(null);
  };

  const handleCancelEdit = () => {
    setEditingEvent(null);
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
      // Root level context fields
      isCollective: flowType === 'Shot' ? ((zoneOverride || selectedZone) === ZONE_CONFIG.penalty.zone ? false : isCollective) : undefined,
      hasOpposition: flowType === 'Shot' ? ((zoneOverride || selectedZone) === ZONE_CONFIG.penalty.zone ? false : hasOpposition) : undefined,
      isCounterAttack: flowType === 'Shot' ? ((zoneOverride || selectedZone) === ZONE_CONFIG.penalty.zone ? false : isCounterAttack) : undefined,

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
              onClick={() => navigate(`/statistics?matchId=${matchId}${activeTeamId ? `&activeTeamId=${activeTeamId}` : ''}`)}
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
                  setEditingEvent(null); // Clear edit if selecting a player
                }}
              />
            ) : (
              <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500 border-2 border-dashed">
                Select a team to view players
              </div>
            )}

            {/* Opponent Goalkeepers Selection */}
            {activeTeam && (
              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">
                  Opponent Goalkeeper
                </h3>
                <div className="space-y-2">
                  {(() => {
                    const opponentTeam = activeTeam.id === homeTeam?.id ? visitorTeam : homeTeam;
                    const goalkeepers = opponentTeam?.players.filter(p => p.isGoalkeeper) || [];

                    if (goalkeepers.length === 0) {
                      return <div className="text-sm text-gray-400 italic">No goalkeepers found</div>;
                    }

                    return goalkeepers.map(gk => (
                      <button
                        key={gk.id}
                        onClick={() => setSelectedOpponentGoalkeeper(gk)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${selectedOpponentGoalkeeper?.id === gk.id
                          ? 'bg-orange-50 border-orange-500 ring-1 ring-orange-500'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${selectedOpponentGoalkeeper?.id === gk.id
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-200 text-gray-600'
                            }`}>
                            {gk.number}
                          </span>
                          <span className={`font-medium ${selectedOpponentGoalkeeper?.id === gk.id ? 'text-orange-900' : 'text-gray-700'
                            }`}>
                            {gk.name}
                          </span>
                        </div>
                        {selectedOpponentGoalkeeper?.id === gk.id && (
                          <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                        )}
                      </button>
                    ));
                  })()}
                </div>
              </div>
            )}

            {/* Defense Formation (Persistent) */}
            <DefenseFormationSelector
              defenseFormation={defenseFormation}
              onDefenseFormationChange={setDefenseFormation}
            />
          </div>

          {/* Right Column: Recording Interface OR Editing Interface */}
          <div className="lg:col-span-8">
            {editingEvent ? (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-indigo-100">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Event
                  </h2>
                  <button
                    onClick={handleCancelEdit}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <EventEditResult
                  event={editingEvent}
                  team={editingEvent.teamId === homeTeam.id ? homeTeam : visitorTeam}
                  onSave={handleSaveEdit}
                  onCancel={handleCancelEdit}
                  onDelete={deleteEvent}
                />
              </div>
            ) : selectedPlayerId ? (
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

        {/* Recent Events */}
        <div className="mt-8">
          <EventList maxEvents={5} onEditEvent={handleEditEvent} />
        </div>
      </div>
    </div>
  );
};

export default MatchTracker;
