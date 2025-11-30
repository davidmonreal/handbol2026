import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMatch } from '../context/MatchContext';
import type { ZoneType, MatchEvent } from '../types';
import { Users, Filter, X, Shield, ArrowLeftRight, Activity, TrendingUp, User } from 'lucide-react';
import { HOME_TEAM, VISITOR_TEAM } from '../data/mockData';
import { ZONE_CONFIG } from '../config/zones';
import { REVERSE_GOAL_TARGET_MAP } from '../config/constants';
import { StatisticsPanel, usePlayerBaselines } from './stats';

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
  const [allPlayerEvents, setAllPlayerEvents] = useState<MatchEvent[]>([]); // For baseline comparison

  // Load all player events for baseline comparison (team-filtered)
  useEffect(() => {
    if (matchId && selectedTeamId) {
      // Load ALL events for players from the selected team (not just this match)
      fetch(`http://localhost:3000/api/game-events`)
        .then(res => res.json())
        .then(data => {
          // Helper functions for transformation (same as match events)
          const goalZoneToTarget = (zone: string | null): number | undefined => {
            if (!zone) return undefined;
            const zoneMap: Record<string, number> = {
              'TL': 1, 'TM': 2, 'TR': 3,
              'ML': 4, 'MM': 5, 'MR': 6,
              'BL': 7, 'BM': 8, 'BR': 9,
            };
            return zoneMap[zone];
          };

          const positionDistanceToZone = (position: string | null, distance: string | null): any => {
            if (!position || !distance) return undefined;
            if (distance === '7M') return '7m';
            const distancePrefix = distance === '6M' ? '6m' : '9m';
            return `${distancePrefix}-${position}` as any;
          };

          // Transform backend events to MatchEvent format
          const transformedEvents: MatchEvent[] = data.map((e: any) => ({
            id: e.id,
            timestamp: e.timestamp,
            playerId: e.playerId,
            playerName: e.player?.name,
            playerNumber: e.player?.number,
            teamId: e.teamId,
            category: e.type,
            action: e.subtype || e.type,
            zone: positionDistanceToZone(e.position, e.distance),
            goalTarget: goalZoneToTarget(e.goalZone),
            context: {
              isCollective: e.isCollective,
              hasOpposition: e.hasOpposition,
              isCounterAttack: e.isCounterAttack,
            },
            defenseFormation: undefined,
          }));

          setAllPlayerEvents(transformedEvents);
        });
    }
  }, [matchId, selectedTeamId]);

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
          // Helper function to convert goalZone to goalTarget (1-9)
          const goalZoneToTarget = (zone: string | null): number | undefined => {
            if (!zone) return undefined;
            const zoneMap: Record<string, number> = {
              'TL': 1, 'TM': 2, 'TR': 3,
              'ML': 4, 'MM': 5, 'MR': 6,
              'BL': 7, 'BM': 8, 'BR': 9,
            };
            return zoneMap[zone];
          };

          // Helper function to convert position+distance to zone format
          const positionDistanceToZone = (position: string | null, distance: string | null): any => {
            if (!position || !distance) return undefined;
            
            // Map backend position+distance to frontend zone format
            if (distance === '7M') return '7m';
            
            const distancePrefix = distance === '6M' ? '6m' : '9m';
            return `${distancePrefix}-${position}` as any;
          };

          // Transform backend events to MatchEvent format
          const transformedEvents: MatchEvent[] = data.map((e: any) => ({
            id: e.id,
            timestamp: e.timestamp,
            playerId: e.playerId,
            playerName: e.player?.name,
            playerNumber: e.player?.number,
            teamId: e.teamId,
            category: e.type, // 'Shot', 'Turnover', 'Sanction'
            action: e.subtype || e.type, // 'Goal', 'Save', 'Miss', etc.
            zone: positionDistanceToZone(e.position, e.distance), // Convert position+distance to zone
            goalTarget: goalZoneToTarget(e.goalZone), // Convert goalZone to number 1-9
            context: {
              isCollective: e.isCollective,
              hasOpposition: e.hasOpposition,
              isCounterAttack: e.isCounterAttack,
            },
            defenseFormation: undefined,
          }));
          
          console.log('DEBUG STATISTICS:');
          console.log('Raw Data Sample:', data[0]);
          console.log('Transformed Event Sample:', transformedEvents[0]);
          console.log('REVERSE_GOAL_TARGET_MAP:', REVERSE_GOAL_TARGET_MAP);
          console.log('Goal Zone Sample:', data[0]?.goalZone);
          console.log('Mapped Target:', goalZoneToTarget(data[0]?.goalZone));
          
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

  // Calculate player baselines for comparison (team-filtered when in match context)
  const playerBaselines = usePlayerBaselines(
    allPlayerEvents.length > 0 ? allPlayerEvents : events, // Use all events if available, otherwise context events
    matchId ? selectedTeamId : null // Filter by team only in match context
  );

  // Player Stats (Based on Filtered Events) - still needed for the detailed table below
  const playerStats = useMemo(() => {
    interface PlayerStats {
      name: string;
      number: number;
      shots: number;
      goals: number;
      misses: number;
      saves: number;
      posts: number;
      blocks: number;
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
    }

    const map = new Map<string, PlayerStats>();
    
    filteredEvents.forEach(e => {
        if (e.playerId) {
            const current = map.get(e.playerId) || { 
              name: 'Unknown', 
              number: 0, 
              shots: 0, 
              goals: 0,
              misses: 0,
              saves: 0,
              posts: 0,
              blocks: 0,
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

            if (e.category === 'Shot') {
                current.shots++;
                
                // Breakdown by distance (shots)
                if (e.zone?.startsWith('6m')) current.shots6m++;
                else if (e.zone?.startsWith('9m')) current.shots9m++;
                else if (e.zone === '7m') current.shots7m++;
                
                // Breakdown by opposition (shots)
                if (e.context?.hasOpposition) current.shotsWithOpp++;
                else current.shotsNoOpp++;

                // Breakdown by collective/individual (shots)
                if (e.context?.isCollective) current.shotsCollective++;
                else current.shotsIndividual++;

                // Breakdown by counter/static (shots)
                if (e.context?.isCounterAttack) current.shotsCounter++;
                else current.shotsStatic++;

                if (e.action === 'Goal') {
                    current.goals++;
                    // Breakdown by distance (goals)
                    if (e.zone?.startsWith('6m')) current.goals6m++;
                    else if (e.zone?.startsWith('9m')) current.goals9m++;
                    else if (e.zone === '7m') current.goals7m++;
                    
                    // Breakdown by opposition (goals)
                    if (e.context?.hasOpposition) current.goalsWithOpp++;
                    else current.goalsNoOpp++;

                    // Breakdown by collective/individual (goals)
                    if (e.context?.isCollective) current.goalsCollective++;
                    else current.goalsIndividual++;

                    // Breakdown by counter/static (goals)
                    if (e.context?.isCounterAttack) current.goalsCounter++;
                    else current.goalsStatic++;

                } else {
                    // Missed shots logic
                    if (e.action === 'Miss') current.misses++;
                    else if (e.action === 'Save') current.saves++;
                    else if (e.action === 'Post') current.posts++;
                    else if (e.action === 'Block') current.blocks++;
                }
            } else if (e.category === 'Turnover') {
                current.turnovers++;
            }
            
            map.set(e.playerId, current);
        }
    });

    return Array.from(map.entries()).map(([id, stats]) => ({ id, ...stats })).sort((a, b) => b.shots - a.shots);
  }, [filteredEvents]);

  // Helper to get player info
  const getPlayerInfo = (playerId: string) => {
      // 1. Try to find in matchData (API structure)
      if (matchId && matchData) {
          // API returns team.players as array of { player: { id, name, number } }
          const findInTeam = (team: any) => team?.players?.find((p: any) => p.player?.id === playerId)?.player;
          
          const homePlayer = findInTeam(matchData.homeTeam);
          if (homePlayer) return { name: homePlayer.name, number: homePlayer.number };
          
          const awayPlayer = findInTeam(matchData.awayTeam);
          if (awayPlayer) return { name: awayPlayer.name, number: awayPlayer.number };
      }

      // 2. Try to find in events (since we added playerName/playerNumber to them)
      const sourceEvents = matchId ? matchEvents : events;
      const eventWithPlayer = sourceEvents.find(e => e.playerId === playerId && e.playerName);
      if (eventWithPlayer) {
          return { name: eventWithPlayer.playerName!, number: eventWithPlayer.playerNumber || 0 };
      }

      // 3. Fallback to context/mock data
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
                onClick={() => window.location.href = `/match-tracker/${matchId}`}
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
        </div>
        
        {/* Context Filter Buttons */}
        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Filters:</span>
          
          {/* Player Filter */}
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

          {/* Zone Filter */}
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
      </div>


      {/* Statistics Panel - Heatmap, Zones, and Summary */}
      <StatisticsPanel
        data={{
          events: filteredEvents,
          title: '', // Title is handled by header above
          context: 'match',
        }}
        comparison={{
          playerAverages: playerBaselines,
        }}
        onZoneFilter={(zone: ZoneType | '7m' | null) => setFilterZone(zone as ZoneType | null)}
      />

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
