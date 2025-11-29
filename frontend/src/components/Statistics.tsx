import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMatch } from '../context/MatchContext';
import type { ZoneType, MatchEvent } from '../types';
import { Users, Target, Filter, X, Activity, Shield, Zap, ArrowLeftRight } from 'lucide-react';
import { HOME_TEAM, VISITOR_TEAM } from '../data/mockData';
import { ZONE_CONFIG } from '../config/zones';

const Statistics = () => {
  const [searchParams] = useSearchParams();
  const matchId = searchParams.get('matchId');
  
  const { events, activeTeamId } = useMatch();
  const [filterZone, setFilterZone] = useState<ZoneType | null>(null);
  const [filterPlayer, setFilterPlayer] = useState<string | null>(null);
  const [filterOpposition, setFilterOpposition] = useState<boolean | null>(null);
  const [filterCollective, setFilterCollective] = useState<boolean | null>(null);
  const [filterCounterAttack, setFilterCounterAttack] = useState<boolean | null>(null);
  
  // Match-specific state
  const [matchData, setMatchData] = useState<any>(null);
  const [matchEvents, setMatchEvents] = useState<MatchEvent[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  // Load match data if matchId is provided
  useEffect(() => {
    if (matchId) {
      // Load match details
      fetch(`http://localhost:3000/api/matches/${matchId}`)
        .then(res => res.json())
        .then(data => {
          setMatchData(data);
          setSelectedTeamId(data.homeTeamId); // Default to home team
        });
      
      // Load match events
      fetch(`http://localhost:3000/api/game-events/match/${matchId}`)
        .then(res => res.json())
        .then(data => {
          // Transform backend events to MatchEvent format
          const transformedEvents: MatchEvent[] = data.map((e: any) => ({
            id: e.id,
            timestamp: e.timestamp,
            playerId: e.playerId,
            teamId: e.teamId,
            category: e.type, // 'Shot', 'Turnover', 'Sanction'
            action: e.subtype || e.type, // 'Goal', 'Save', 'Miss', etc.
            zone: e.goalZone,
            goalTarget: undefined,
            context: {
              isCollective: e.isCollective,
              hasOpposition: e.hasOpposition,
              isCounterAttack: e.isCounterAttack,
            },
            defenseFormation: undefined,
          }));
          setMatchEvents(transformedEvents);
        });
    }
  }, [matchId]);

  // 1. Base Data: Events for the active/selected team
  const teamEvents = useMemo(() => {
    // If viewing match stats, use match events and selected team
    if (matchId && selectedTeamId) {
      return matchEvents.filter(e => e.teamId === selectedTeamId);
    }
    // Otherwise use context events and active team
    return events.filter(e => e.teamId === activeTeamId);
  }, [matchId, selectedTeamId, matchEvents, events, activeTeamId]);

  // 2. Filtered Data: Events matching all filters
  const filteredEvents = useMemo(() => {
    let filtered = teamEvents;
    if (filterZone) filtered = filtered.filter(e => e.zone === filterZone);
    if (filterPlayer) filtered = filtered.filter(e => e.playerId === filterPlayer);
    if (filterOpposition !== null) filtered = filtered.filter(e => e.context?.hasOpposition === filterOpposition);
    if (filterCollective !== null) filtered = filtered.filter(e => e.context?.isCollective === filterCollective);
    if (filterCounterAttack !== null) filtered = filtered.filter(e => e.context?.isCounterAttack === filterCounterAttack);
    return filtered;
  }, [teamEvents, filterZone, filterPlayer, filterOpposition, filterCollective, filterCounterAttack]);

  // 3. Goal Heatmap Data (Based on Filtered Events)
  const goalHeatmap = useMemo(() => {
    const map = new Map<number, { goals: number; shots: number }>();
    // Initialize 1-9
    for (let i = 1; i <= 9; i++) map.set(i, { goals: 0, shots: 0 });

    filteredEvents.forEach(e => {
      if (e.category === 'Shot' && e.goalTarget) {
        const current = map.get(e.goalTarget)!;
        current.shots++;
        if (e.action === 'Goal') current.goals++;
      }
    });
    return map;
  }, [filteredEvents]);

  // 4. Zone Stats (Based on Filtered Events - updates when filters change)
  const zoneStats = useMemo(() => {
    const map = new Map<ZoneType, { shots: number; goals: number }>();
    // Initialize all zones
    ZONE_CONFIG.sixMeter.forEach(z => map.set(z.zone, { shots: 0, goals: 0 }));
    ZONE_CONFIG.nineMeter.forEach(z => map.set(z.zone, { shots: 0, goals: 0 }));
    map.set(ZONE_CONFIG.penalty.zone, { shots: 0, goals: 0 });

    filteredEvents.forEach(e => {
      if (e.category === 'Shot' && e.zone) {
        const current = map.get(e.zone as ZoneType);
        if (current) {
          current.shots++;
          if (e.action === 'Goal') current.goals++;
        }
      }
    });
    return map;
  }, [filteredEvents]);

  // Rank zones by goals for color coding (handle ties)
  const zoneRankings = useMemo(() => {
    // Group zones by goal count
    const goalGroups = new Map<number, ZoneType[]>();
    zoneStats.forEach((stats, zone) => {
      if (stats.goals > 0) {
        const existing = goalGroups.get(stats.goals) || [];
        existing.push(zone);
        goalGroups.set(stats.goals, existing);
      }
    });
    
    // Sort goal counts descending
    const sortedGoalCounts = Array.from(goalGroups.keys()).sort((a, b) => b - a);
    
    // Assign colors: top goal count = red, next 2 counts = orange
    const colorMap = new Map<ZoneType, 'red' | 'orange' | 'default'>();
    
    sortedGoalCounts.forEach((goalCount, index) => {
      const zones = goalGroups.get(goalCount)!;
      const color = index === 0 ? 'red' : (index === 1 || index === 2) ? 'orange' : 'default';
      zones.forEach(zone => colorMap.set(zone, color));
    });
    
    return colorMap;
  }, [zoneStats]);

  const totalFilteredShots = filteredEvents.filter(e => e.category === 'Shot').length;

  // 5. Player Stats (Based on Filtered Events)
  const playerStats = useMemo(() => {
    const map = new Map<string, { 
      name: string; 
      number: number; 
      shots: number; 
      goals: number;
      shots6m: number;
      goals6m: number;
      shots9m: number;
      goals9m: number;
      shots7m: number;
      goals7m: number;
      turnovers: number;
      shotsWithOpp: number;
      goalsWithOpp: number;
      shotsNoOpp: number;
      goalsNoOpp: number;
      shotsCollective: number;
      goalsCollective: number;
      shotsIndividual: number;
      goalsIndividual: number;
      shotsCounter: number;
      goalsCounter: number;
      shotsStatic: number;
      goalsStatic: number;
    }>();
    
    filteredEvents.forEach(e => {
        if (e.category === 'Shot') {
            const current = map.get(e.playerId) || { 
              name: 'Unknown', 
              number: 0, 
              shots: 0, 
              goals: 0,
              shots6m: 0,
              goals6m: 0,
              shots9m: 0,
              goals9m: 0,
              shots7m: 0,
              goals7m: 0,
              turnovers: 0,
              shotsWithOpp: 0,
              goalsWithOpp: 0,
              shotsNoOpp: 0,
              goalsNoOpp: 0,
              shotsCollective: 0,
              goalsCollective: 0,
              shotsIndividual: 0,
              goalsIndividual: 0,
              shotsCounter: 0,
              goalsCounter: 0,
              shotsStatic: 0,
              goalsStatic: 0,
            };
            current.shots++;
            if (e.action === 'Goal') current.goals++;
            
            // Breakdown by distance
            if (e.zone?.startsWith('6m')) {
              current.shots6m++;
              if (e.action === 'Goal') current.goals6m++;
            } else if (e.zone?.startsWith('9m')) {
              current.shots9m++;
              if (e.action === 'Goal') current.goals9m++;
            } else if (e.zone === '7m') {
              current.shots7m++;
              if (e.action === 'Goal') current.goals7m++;
            }
            
            // Breakdown by opposition
            if (e.context?.hasOpposition) {
              current.shotsWithOpp++;
              if (e.action === 'Goal') current.goalsWithOpp++;
            } else {
              current.shotsNoOpp++;
              if (e.action === 'Goal') current.goalsNoOpp++;
            }

            // Breakdown by collective/individual
            if (e.context?.isCollective) {
              current.shotsCollective++;
              if (e.action === 'Goal') current.goalsCollective++;
            } else {
              current.shotsIndividual++;
              if (e.action === 'Goal') current.goalsIndividual++;
            }

            // Breakdown by counter/static
            if (e.context?.isCounterAttack) {
              current.shotsCounter++;
              if (e.action === 'Goal') current.goalsCounter++;
            } else {
              current.shotsStatic++;
              if (e.action === 'Goal') current.goalsStatic++;
            }
            
            map.set(e.playerId, current);
        } else if (e.category === 'Turnover') {
            const current = map.get(e.playerId) || { 
              name: 'Unknown', 
              number: 0, 
              shots: 0, 
              goals: 0,
              shots6m: 0,
              goals6m: 0,
              shots9m: 0,
              goals9m: 0,
              shots7m: 0,
              goals7m: 0,
              turnovers: 0,
              shotsWithOpp: 0,
              goalsWithOpp: 0,
              shotsNoOpp: 0,
              goalsNoOpp: 0,
              shotsCollective: 0,
              goalsCollective: 0,
              shotsIndividual: 0,
              goalsIndividual: 0,
              shotsCounter: 0,
              goalsCounter: 0,
              shotsStatic: 0,
              goalsStatic: 0,
            };
            current.turnovers++;
            map.set(e.playerId, current);
        }
    });

    return Array.from(map.entries()).map(([id, stats]) => ({ id, ...stats })).sort((a, b) => b.shots - a.shots);
  }, [filteredEvents]);

  // Helper to get player info
  const getPlayerInfo = (playerId: string) => {
      const team = activeTeamId === HOME_TEAM.id ? HOME_TEAM : VISITOR_TEAM;
      const player = team.players.find((p: any) => p.id === playerId);
      return player ? { name: player.name, number: player.number } : { name: 'Unknown', number: 0 };
  };

  if (!matchId && !activeTeamId) {
      return <div className="p-8 text-center text-gray-500">Please select a team in the Match tab first or navigate from a match.</div>;
  }

  // Get current team name for display
  const currentTeamName = useMemo(() => {
    if (matchId && matchData && selectedTeamId) {
      return selectedTeamId === matchData.homeTeamId 
        ? matchData.homeTeam.name 
        : matchData.awayTeam.name;
    }
    return activeTeamId === HOME_TEAM.id ? HOME_TEAM.name : VISITOR_TEAM.name;
  }, [matchId, matchData, selectedTeamId, activeTeamId]);

  const otherTeamName = useMemo(() => {
    if (matchId && matchData && selectedTeamId) {
      return selectedTeamId === matchData.homeTeamId 
        ? matchData.awayTeam.name 
        : matchData.homeTeam.name;
    }
    return null;
  }, [matchId, matchData, selectedTeamId]);

  const toggleTeam = () => {
    if (matchData && selectedTeamId) {
      setSelectedTeamId(
        selectedTeamId === matchData.homeTeamId 
          ? matchData.awayTeamId 
          : matchData.homeTeamId
      );
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header / Filter Status */}
      <div className="space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <h2 className="text-2xl font-bold text-gray-800">
            {matchId ? `Match Statistics: ${currentTeamName}` : 'Match Statistics'}
          </h2>
          
          {/* Navigation buttons (only for match view) */}
          {matchId && matchData && (
            <div className="flex items-center gap-3">
              {/* Back to Match button */}
              <button
                onClick={() => window.location.href = `/match/${matchId}`}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Match
              </button>
              
              {/* Team Switcher */}
              {otherTeamName && (
                <button
                  onClick={toggleTeam}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <ArrowLeftRight size={18} />
                  Switch to {otherTeamName}
                </button>
              )}
            </div>
          )}
          
          {/* Active Filters Display */}
          <div className="flex flex-wrap gap-2">
            {filterZone && (
                <button 
                    onClick={() => setFilterZone(null)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium"
                >
                    <Filter size={14} />
                    {filterZone}
                    <X size={14} />
                </button>
            )}
            {filterPlayer && (
                <button 
                    onClick={() => setFilterPlayer(null)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                >
                    <Users size={14} />
                    {getPlayerInfo(filterPlayer).name}
                    <X size={14} />
                </button>
            )}
            {filterOpposition !== null && (
                <button 
                    onClick={() => setFilterOpposition(null)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors text-sm font-medium"
                >
                    <Shield size={14} />
                    {filterOpposition ? 'With Opposition' : 'No Opposition'}
                    <X size={14} />
                </button>
            )}
            {filterCollective !== null && (
                <button 
                    onClick={() => setFilterCollective(null)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
                >
                    <Users size={14} />
                    {filterCollective ? 'Collective' : 'Individual'}
                    <X size={14} />
                </button>
            )}
            {filterCounterAttack !== null && (
                <button 
                    onClick={() => setFilterCounterAttack(null)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-100 text-cyan-700 rounded-lg hover:bg-cyan-200 transition-colors text-sm font-medium"
                >
                    <Zap size={14} />
                    {filterCounterAttack ? 'Counter-attack' : 'Static'}
                    <X size={14} />
                </button>
            )}
          </div>
        </div>
        
        {/* Context Filter Buttons */}
        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Filters:</span>
          
          {/* Opposition Group */}
          <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
            <button
              onClick={() => setFilterOpposition(filterOpposition === true ? null : true)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                filterOpposition === true
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Shield size={12} />
              With Opp.
            </button>
            <button
              onClick={() => setFilterOpposition(filterOpposition === false ? null : false)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                filterOpposition === false
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              No Opp.
            </button>
          </div>

          <div className="w-px h-6 bg-gray-200"></div>

          {/* Collective Group */}
          <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
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
            <button
              onClick={() => setFilterCollective(filterCollective === false ? null : false)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                filterCollective === false
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Individual
            </button>
          </div>

          <div className="w-px h-6 bg-gray-200"></div>

          {/* Counter Group */}
          <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
            <button
              onClick={() => setFilterCounterAttack(filterCounterAttack === true ? null : true)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                filterCounterAttack === true
                  ? 'bg-white text-cyan-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Zap size={12} />
              Counter
            </button>
            <button
              onClick={() => setFilterCounterAttack(filterCounterAttack === false ? null : false)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                filterCounterAttack === false
                  ? 'bg-white text-cyan-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Static
            </button>
          </div>
        </div>
      </div>

      {/* 1. GOAL HEATMAP (Top) */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Target className="text-blue-600" />
            Goal Distribution {filterZone ? `(from ${filterZone})` : '(All Zones)'}
        </h3>
        {/* Handball goal proportions: 3m wide x 2m tall = 1.5:1 ratio */}
        <div className="max-w-xl mx-auto">
            <div className="relative bg-gray-100 rounded-lg p-4 border-4 border-gray-300" style={{ aspectRatio: '1.5 / 1' }}>
                {/* Goal Frame Visual */}
                <div className="absolute top-0 left-0 right-0 h-full border-x-8 border-t-8 border-red-800 opacity-20 pointer-events-none"></div>
                
                <div className="grid grid-cols-3 grid-rows-3 gap-1 h-full relative z-10">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(target => {
                        const stats = goalHeatmap.get(target)!;
                        const efficiency = stats.shots > 0 ? Math.round((stats.goals / stats.shots) * 100) : 0;
                        const intensity = stats.shots > 0 ? Math.min(stats.shots / 5, 1) : 0;
                        
                        return (
                            <div 
                                key={target}
                                className="flex flex-col items-center justify-center rounded border border-gray-200 transition-all"
                                style={{
                                    backgroundColor: `rgba(59, 130, 246, ${intensity * 0.5 + 0.1})`,
                                }}
                            >
                                <span className="text-xl md:text-2xl font-bold text-gray-800">{stats.goals}</span>
                                <span className="text-xs text-gray-500">{stats.shots} shots</span>
                                <span className={`text-xs font-bold ${efficiency > 50 ? 'text-green-600' : 'text-orange-600'}`}>
                                    {efficiency}%
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
      </div>

      {/* 2. ZONE MAP (Middle) */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Activity className="text-indigo-600" />
            Shot Zones (Click to Filter)
        </h3>
        <div className="max-w-2xl mx-auto">
            <div className="space-y-3">
                {/* 6m Line */}
                <div className="grid grid-cols-5 gap-2">
                    {ZONE_CONFIG.sixMeter.map(({ zone, label }) => {
                        const stats = zoneStats.get(zone)!;
                        const percentage = totalFilteredShots > 0 ? Math.round((stats.shots / totalFilteredShots) * 100) : 0;
                        const isSelected = filterZone === zone;
                        const color = zoneRankings.get(zone) || 'default';
                        
                        // Color coding based on goal productivity
                        let bgColor = 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50';
                        if (isSelected) {
                            bgColor = 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-200';
                        } else if (color === 'red' && stats.goals > 0) {
                            bgColor = 'border-red-500 bg-red-100 hover:border-red-600 shadow-sm';
                        } else if (color === 'orange' && stats.goals > 0) {
                            bgColor = 'border-orange-400 bg-orange-50 hover:border-orange-500';
                        }

                        return (
                            <button
                                key={zone}
                                onClick={() => setFilterZone(isSelected ? null : zone)}
                                className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center ${bgColor}`}
                            >
                                <span className="text-xs font-bold text-gray-500 mb-1">{label}</span>
                                <span className="text-xl font-bold text-gray-800">{percentage}%</span>
                                <span className="text-xs text-gray-400">({stats.shots})</span>
                            </button>
                        );
                    })}
                </div>
                
                {/* 9m Line */}
                <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
                    {ZONE_CONFIG.nineMeter.map(({ zone, label }) => {
                        const stats = zoneStats.get(zone)!;
                        const percentage = totalFilteredShots > 0 ? Math.round((stats.shots / totalFilteredShots) * 100) : 0;
                        const isSelected = filterZone === zone;
                        const color = zoneRankings.get(zone) || 'default';
                        
                        let bgColor = 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50';
                        if (isSelected) {
                            bgColor = 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-200';
                        } else if (color === 'red') {
                            bgColor = 'border-red-500 bg-red-100 hover:border-red-600 shadow-sm';
                        } else if (color === 'orange') {
                            bgColor = 'border-orange-400 bg-orange-50 hover:border-orange-500';
                        }

                        return (
                            <button
                                key={zone}
                                onClick={() => setFilterZone(isSelected ? null : zone)}
                                className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center ${bgColor}`}
                            >
                                <span className="text-xs font-bold text-gray-500 mb-1">{label}</span>
                                <span className="text-xl font-bold text-gray-800">{percentage}%</span>
                                <span className="text-xs text-gray-400">({stats.shots})</span>
                            </button>
                        );
                    })}
                </div>

                {/* 7m Penalty */}
                <div className="max-w-xs mx-auto">
                    <button
                        onClick={() => setFilterZone(filterZone === ZONE_CONFIG.penalty.zone ? null : ZONE_CONFIG.penalty.zone)}
                        className={`w-full p-3 rounded-lg border-2 transition-all flex flex-col items-center ${
                            filterZone === ZONE_CONFIG.penalty.zone
                                ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-200' 
                                : (() => {
                                    const color = zoneRankings.get(ZONE_CONFIG.penalty.zone) || 'default';
                                    if (color === 'red') return 'border-red-500 bg-red-100 hover:border-red-600 shadow-sm';
                                    if (color === 'orange') return 'border-orange-400 bg-orange-50 hover:border-orange-500';
                                    return 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50';
                                })()
                        }`}
                    >
                        <span className="text-xs font-bold text-gray-500 mb-1">{ZONE_CONFIG.penalty.label}</span>
                        <span className="text-xl font-bold text-gray-800">
                             {totalFilteredShots > 0 ? Math.round(((zoneStats.get(ZONE_CONFIG.penalty.zone)?.shots || 0) / totalFilteredShots) * 100) : 0}%
                        </span>
                        <span className="text-xs text-gray-400">({zoneStats.get(ZONE_CONFIG.penalty.zone)?.shots || 0})</span>
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* 3. PLAYER LIST (Bottom) */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Users className="text-green-600" />
            Player Statistics {filterZone ? `(from ${filterZone})` : '(Overall)'}
        </h3>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="border-b-2 border-gray-300 text-gray-600 text-xs uppercase">
                        <th className="pb-3 font-semibold">Player</th>
                        <th className="pb-3 font-semibold text-center">Total</th>
                        <th className="pb-3 font-semibold text-center bg-blue-50 px-2">6m Goals</th>
                        <th className="pb-3 font-semibold text-center bg-blue-50 px-2">6m Eff%</th>
                        <th className="pb-3 font-semibold text-center bg-indigo-50 px-2">9m Goals</th>
                        <th className="pb-3 font-semibold text-center bg-indigo-50 px-2">9m Eff%</th>
                        <th className="pb-3 font-semibold text-center bg-purple-50 px-2">7m Goals</th>
                        <th className="pb-3 font-semibold text-center bg-purple-50 px-2">7m Eff%</th>
                        <th className="pb-3 font-semibold text-center bg-orange-50 px-2">With Opp</th>
                        <th className="pb-3 font-semibold text-center bg-orange-50 px-2">No Opp</th>
                        <th className="pb-3 font-semibold text-center bg-purple-50 px-2">Collective</th>
                        <th className="pb-3 font-semibold text-center bg-purple-50 px-2">Individual</th>
                        <th className="pb-3 font-semibold text-center bg-cyan-50 px-2">Counter</th>
                        <th className="pb-3 font-semibold text-center bg-cyan-50 px-2">Static</th>
                        <th className="pb-3 font-semibold text-center bg-red-50 px-2">Turnovers</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {playerStats.map(stat => {
                        const playerInfo = getPlayerInfo(stat.id);
                        const efficiency6m = stat.shots6m > 0 ? Math.round((stat.goals6m / stat.shots6m) * 100) : 0;
                        const efficiency9m = stat.shots9m > 0 ? Math.round((stat.goals9m / stat.shots9m) * 100) : 0;
                        const efficiency7m = stat.shots7m > 0 ? Math.round((stat.goals7m / stat.shots7m) * 100) : 0;
                        const isSelected = filterPlayer === stat.id;

                        return (
                            <tr 
                                key={stat.id} 
                                onClick={() => setFilterPlayer(isSelected ? null : stat.id)}
                                className={`cursor-pointer transition-colors ${
                                    isSelected 
                                        ? 'bg-green-50 hover:bg-green-100 ring-2 ring-green-300' 
                                        : 'hover:bg-gray-50'
                                }`}
                            >
                                <td className="py-3">
                                    <div className="flex items-center gap-2">
                                        <span className="w-7 h-7 flex items-center justify-center bg-gray-200 rounded text-xs font-bold text-gray-700">
                                            {playerInfo.number}
                                        </span>
                                        <span className="font-medium text-gray-800">{playerInfo.name}</span>
                                    </div>
                                </td>
                                <td className="py-3 text-center">
                                    <span className="font-bold text-gray-800">{stat.goals}</span>
                                    <span className="text-gray-400 text-xs">/{stat.shots}</span>
                                </td>
                                
                                {/* 6m Stats */}
                                <td className="py-3 text-center bg-blue-50 px-2">
                                    <span className="font-mono font-semibold text-blue-700">{stat.goals6m}</span>
                                    <span className="text-gray-400 text-xs">/{stat.shots6m}</span>
                                </td>
                                <td className="py-3 text-center bg-blue-50 px-2">
                                    {stat.shots6m > 0 ? (
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                            efficiency6m >= 70 ? 'bg-green-100 text-green-700' :
                                            efficiency6m >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {efficiency6m}%
                                        </span>
                                    ) : (
                                        <span className="text-gray-300 text-xs">-</span>
                                    )}
                                </td>
                                
                                {/* 9m Stats */}
                                <td className="py-3 text-center bg-indigo-50 px-2">
                                    <span className="font-mono font-semibold text-indigo-700">{stat.goals9m}</span>
                                    <span className="text-gray-400 text-xs">/{stat.shots9m}</span>
                                </td>
                                <td className="py-3 text-center bg-indigo-50 px-2">
                                    {stat.shots9m > 0 ? (
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                            efficiency9m >= 70 ? 'bg-green-100 text-green-700' :
                                            efficiency9m >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {efficiency9m}%
                                        </span>
                                    ) : (
                                        <span className="text-gray-300 text-xs">-</span>
                                    )}
                                </td>
                                
                                {/* 7m Stats */}
                                <td className="py-3 text-center bg-purple-50 px-2">
                                    <span className="font-mono font-semibold text-purple-700">{stat.goals7m}</span>
                                    <span className="text-gray-400 text-xs">/{stat.shots7m}</span>
                                </td>
                                <td className="py-3 text-center bg-purple-50 px-2">
                                    {stat.shots7m > 0 ? (
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                            efficiency7m >= 70 ? 'bg-green-100 text-green-700' :
                                            efficiency7m >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {efficiency7m}%
                                        </span>
                                    ) : (
                                        <span className="text-gray-300 text-xs">-</span>
                                    )}
                                </td>
                                
                                {/* Opposition Stats */}
                                <td className="py-3 text-center bg-orange-50 px-2">
                                    {stat.shotsWithOpp > 0 ? (
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                            Math.round((stat.goalsWithOpp / stat.shotsWithOpp) * 100) >= 50 
                                                ? 'bg-green-100 text-green-700' 
                                                : 'bg-red-100 text-red-700'
                                        }`}>
                                            {Math.round((stat.goalsWithOpp / stat.shotsWithOpp) * 100)}%
                                        </span>
                                    ) : (
                                        <span className="text-gray-300 text-xs">-</span>
                                    )}
                                    <div className="text-xs text-gray-400 mt-0.5">{stat.goalsWithOpp}/{stat.shotsWithOpp}</div>
                                </td>
                                <td className="py-3 text-center bg-orange-50 px-2">
                                    {stat.shotsNoOpp > 0 ? (
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                            Math.round((stat.goalsNoOpp / stat.shotsNoOpp) * 100) >= 50 
                                                ? 'bg-green-100 text-green-700' 
                                                : 'bg-red-100 text-red-700'
                                        }`}>
                                            {Math.round((stat.goalsNoOpp / stat.shotsNoOpp) * 100)}%
                                        </span>
                                    ) : (
                                        <span className="text-gray-300 text-xs">-</span>
                                    )}
                                    <div className="text-xs text-gray-400 mt-0.5">{stat.goalsNoOpp}/{stat.shotsNoOpp}</div>
                                </td>

                                {/* Collective/Individual Stats */}
                                <td className="py-3 text-center bg-purple-50 px-2">
                                    {stat.shotsCollective > 0 ? (
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                            Math.round((stat.goalsCollective / stat.shotsCollective) * 100) >= 50 
                                                ? 'bg-green-100 text-green-700' 
                                                : 'bg-red-100 text-red-700'
                                        }`}>
                                            {Math.round((stat.goalsCollective / stat.shotsCollective) * 100)}%
                                        </span>
                                    ) : (
                                        <span className="text-gray-300 text-xs">-</span>
                                    )}
                                    <div className="text-xs text-gray-400 mt-0.5">{stat.goalsCollective}/{stat.shotsCollective}</div>
                                </td>
                                <td className="py-3 text-center bg-purple-50 px-2">
                                    {stat.shotsIndividual > 0 ? (
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                            Math.round((stat.goalsIndividual / stat.shotsIndividual) * 100) >= 50 
                                                ? 'bg-green-100 text-green-700' 
                                                : 'bg-red-100 text-red-700'
                                        }`}>
                                            {Math.round((stat.goalsIndividual / stat.shotsIndividual) * 100)}%
                                        </span>
                                    ) : (
                                        <span className="text-gray-300 text-xs">-</span>
                                    )}
                                    <div className="text-xs text-gray-400 mt-0.5">{stat.goalsIndividual}/{stat.shotsIndividual}</div>
                                </td>

                                {/* Counter/Static Stats */}
                                <td className="py-3 text-center bg-cyan-50 px-2">
                                    {stat.shotsCounter > 0 ? (
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                            Math.round((stat.goalsCounter / stat.shotsCounter) * 100) >= 50 
                                                ? 'bg-green-100 text-green-700' 
                                                : 'bg-red-100 text-red-700'
                                        }`}>
                                            {Math.round((stat.goalsCounter / stat.shotsCounter) * 100)}%
                                        </span>
                                    ) : (
                                        <span className="text-gray-300 text-xs">-</span>
                                    )}
                                    <div className="text-xs text-gray-400 mt-0.5">{stat.goalsCounter}/{stat.shotsCounter}</div>
                                </td>
                                <td className="py-3 text-center bg-cyan-50 px-2">
                                    {stat.shotsStatic > 0 ? (
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                            Math.round((stat.goalsStatic / stat.shotsStatic) * 100) >= 50 
                                                ? 'bg-green-100 text-green-700' 
                                                : 'bg-red-100 text-red-700'
                                        }`}>
                                            {Math.round((stat.goalsStatic / stat.shotsStatic) * 100)}%
                                        </span>
                                    ) : (
                                        <span className="text-gray-300 text-xs">-</span>
                                    )}
                                    <div className="text-xs text-gray-400 mt-0.5">{stat.goalsStatic}/{stat.shotsStatic}</div>
                                </td>
                                
                                {/* Turnovers */}
                                <td className="py-3 text-center bg-red-50 px-2">
                                    <span className="font-mono font-bold text-red-600">{stat.turnovers}</span>
                                </td>
                            </tr>
                        );
                    })}
                    {playerStats.length === 0 && (
                        <tr>
                            <td colSpan={15} className="py-8 text-center text-gray-400 italic">
                                No data recorded {filterZone ? `from ${filterZone}` : ''} yet.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

    </div>
  );
};

export default Statistics;
