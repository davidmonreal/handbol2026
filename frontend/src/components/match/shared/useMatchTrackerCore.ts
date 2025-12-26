/**
 * Shared hook for MatchTracker and VideoMatchTracker
 * Encapsulates common logic: team selection, event handling, GK persistence
 */
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useMatch } from '../../../context/MatchContext';
import type { MatchEvent } from '../../../types';
import { API_BASE_URL } from '../../../config/api';
import { transformTeam, type TransformedTeam } from './transformTeam';

// ============ Types ============

export interface SaveBanner {
    message: string;
    variant?: 'success' | 'error';
}

export interface EventFormInitialState {
    opponentGoalkeeperId: string | undefined;
    playerId: string | undefined;
}

export interface MatchDataOptions {
    isFinished?: boolean;
    homeScore?: number;
    awayScore?: number;
    homeEventsLocked?: boolean;
    awayEventsLocked?: boolean;
    realTimeFirstHalfStart?: number | null;
    realTimeSecondHalfStart?: number | null;
    realTimeFirstHalfEnd?: number | null;
    realTimeSecondHalfEnd?: number | null;
    firstHalfVideoStart?: number | null;
    secondHalfVideoStart?: number | null;
}

export interface UseMatchTrackerCoreOptions {
    matchId: string | undefined;
    /**
     * Mode-specific extensions for setMatchData options
     */
    getMatchDataOptions?: (data: Record<string, unknown>) => MatchDataOptions;
    /**
     * Mode-specific timestamp logic (video uses currentVideoTime)
     */
    getEventTimestamp: () => number;
    /**
     * Optional video timestamp for events
     */
    getVideoTimestamp?: () => number | undefined;
    /**
     * Callback after event save
     */
    onEventSaved?: () => void;
    /**
     * Callback after match is loaded
     */
    onMatchLoaded?: (data: Record<string, unknown>) => void;
    /**
     * Handle load error (for video mode)
     */
    onLoadError?: (error: Error) => void;
}

export interface UseMatchTrackerCoreReturn {
    // State
    matchLoaded: boolean;
    editingEvent: MatchEvent | null;
    saveBanner: SaveBanner | null;

    // Computed
    activeTeam: TransformedTeam | null;
    opponentTeam: TransformedTeam | null;
    eventFormInitialState: EventFormInitialState;

    // Match Context passthrough
    homeTeam: TransformedTeam | null;
    visitorTeam: TransformedTeam | null;
    homeScore: number;
    visitorScore: number;
    time: number;
    activeTeamId: string | null;
    defenseFormation: string;

    // Actions
    handleTeamSelect: (teamId: string) => void;
    handleEditEvent: (event: MatchEvent) => void;
    handleCancelEdit: () => void;
    handleSaveEvent: (event: MatchEvent, opponentGkId?: string) => Promise<void>;
    setSaveBanner: React.Dispatch<React.SetStateAction<SaveBanner | null>>;
    setHomeScore: (score: number) => void;
    setVisitorScore: (score: number) => void;

    // Refs for extended behavior
    bannerTimeoutRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
}

const HOME_TEAM_COLOR = 'bg-yellow-400';
const VISITOR_TEAM_COLOR = 'bg-white';

/**
 * Core hook for match tracking functionality
 * Shared between MatchTracker (live) and VideoMatchTracker (video analysis)
 */
export function useMatchTrackerCore(
    options: UseMatchTrackerCoreOptions
): UseMatchTrackerCoreReturn {
    const {
        matchId,
        getMatchDataOptions,
        getEventTimestamp,
        getVideoTimestamp,
        onEventSaved,
        onMatchLoaded,
        onLoadError,
    } = options;

    // Match Context
    const {
        homeScore,
        setHomeScore,
        visitorScore,
        setVisitorScore,
        time,
        activeTeamId,
        setActiveTeamId,
        defenseFormation,
        addEvent,
        updateEvent,
        homeTeam,
        visitorTeam,
        setMatchData,
        selectedOpponentGoalkeeper,
        setSelectedOpponentGoalkeeper,
        matchId: contextMatchId,
    } = useMatch();

    // Local State
    const [matchLoaded, setMatchLoaded] = useState(false);
    const [editingEvent, setEditingEvent] = useState<MatchEvent | null>(null);
    const [saveBanner, setSaveBanner] = useState<SaveBanner | null>(null);
    const bannerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Ref to track context match ID without triggering effect re-runs
    const contextMatchIdRef = useRef(contextMatchId);
    useEffect(() => {
        contextMatchIdRef.current = contextMatchId;
    }, [contextMatchId]);

    // Cleanup banner timeout on unmount
    useEffect(() => {
        return () => {
            if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);
        };
    }, []);

    // ============ Load Match Data ============
    useEffect(() => {
        if (!matchId) return;

        // Skip if already loaded for this match
        if (contextMatchIdRef.current === matchId && homeTeam && visitorTeam) {
            setMatchLoaded(true);
            return;
        }

        const loadMatchData = async () => {
            try {
                setMatchLoaded(false);
                const response = await fetch(`${API_BASE_URL}/api/matches/${matchId}`);

                if (response.status === 404) {
                    throw new Error('Match not found');
                }
                if (!response.ok) {
                    const body = await response.text();
                    throw new Error(`Failed to load match (${response.status}): ${body || 'Unknown error'}`);
                }

                const data = await response.json();

                if (!data.homeTeam || !data.awayTeam) {
                    throw new Error('Match data is incomplete');
                }

                const home = transformTeam(data.homeTeam, HOME_TEAM_COLOR);
                const visitor = transformTeam(data.awayTeam, VISITOR_TEAM_COLOR);

                const shouldPreserveState = contextMatchIdRef.current === data.id;
                const matchDataOptions = getMatchDataOptions?.(data) ?? {
                    isFinished: data.isFinished,
                    homeScore: data.homeScore,
                    awayScore: data.awayScore,
                    homeEventsLocked: data.homeEventsLocked,
                    awayEventsLocked: data.awayEventsLocked,
                };

                await setMatchData(data.id, home, visitor, shouldPreserveState, matchDataOptions);

                onMatchLoaded?.(data);
                setMatchLoaded(true);
            } catch (error) {
                console.error('Error loading match:', error);
                if (onLoadError && error instanceof Error) {
                    onLoadError(error);
                }
                setMatchLoaded(true); // Still set to true to exit loading state
            }
        };

        loadMatchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [matchId]);

    // ============ Auto-select active team ============
    useEffect(() => {
        if (!activeTeamId && homeTeam) {
            setActiveTeamId(homeTeam.id);
        }
    }, [activeTeamId, homeTeam, setActiveTeamId]);

    // ============ GK Persistence ============
    useEffect(() => {
        const opponent = getOpponentTeamInternal();
        if (!opponent || !matchId || !activeTeamId) return;

        const savedGkId = localStorage.getItem(`goalkeeper-${matchId}-${activeTeamId}`);
        if (savedGkId) {
            const gk = opponent.players.find((p) => p.id === savedGkId);
            if (gk) {
                setSelectedOpponentGoalkeeper(gk);
            } else {
                setSelectedOpponentGoalkeeper(null);
            }
        } else {
            setSelectedOpponentGoalkeeper(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTeamId, visitorTeam, homeTeam, matchId]);

    // ============ Computed Values ============
    function getActiveTeamInternal(): TransformedTeam | null {
        if (activeTeamId === homeTeam?.id) return homeTeam as TransformedTeam;
        if (activeTeamId === visitorTeam?.id) return visitorTeam as TransformedTeam;
        return null;
    }

    function getOpponentTeamInternal(): TransformedTeam | null {
        if (activeTeamId === homeTeam?.id) return visitorTeam as TransformedTeam;
        if (activeTeamId === visitorTeam?.id) return homeTeam as TransformedTeam;
        return null;
    }

    const activeTeam = getActiveTeamInternal();
    const opponentTeam = getOpponentTeamInternal();

    const eventFormInitialState = useMemo(
        () => ({
            opponentGoalkeeperId: selectedOpponentGoalkeeper?.id,
            playerId: undefined as string | undefined,
        }),
        [selectedOpponentGoalkeeper?.id]
    );

    // ============ Actions ============
    const handleTeamSelect = useCallback(
        (teamId: string) => {
            setActiveTeamId(teamId);
            setEditingEvent(null);
        },
        [setActiveTeamId]
    );

    const handleEditEvent = useCallback(
        (event: MatchEvent) => {
            if (event.teamId !== activeTeamId) {
                setActiveTeamId(event.teamId);
            }
            setEditingEvent(event);
        },
        [activeTeamId, setActiveTeamId]
    );

    const handleCancelEdit = useCallback(() => {
        setEditingEvent(null);
    }, []);

    const handleSaveEvent = useCallback(
        async (event: MatchEvent, opponentGkId?: string) => {
            // 1. Handle Goalkeeper Persistence/Update
            // Only update global persistence if we are creating a NEW event
            if (!editingEvent && opponentGkId && opponentTeam && matchId) {
                const gk = opponentTeam.players.find((p) => p.id === opponentGkId);
                if (gk) {
                    setSelectedOpponentGoalkeeper(gk);
                    localStorage.setItem(`goalkeeper-${matchId}-${activeTeamId}`, gk.id);
                }
            }

            // 2. Add or Update Event
            if (editingEvent) {
                await updateEvent(editingEvent.id, {
                    ...event,
                    opponentGoalkeeperId: opponentGkId,
                });
                setEditingEvent(null);
            } else {
                const timestamp = getEventTimestamp();
                const videoTimestamp = getVideoTimestamp?.();

                const newEvent: MatchEvent = {
                    ...event,
                    timestamp,
                    videoTimestamp,
                    defenseFormation,
                    opponentGoalkeeperId: opponentGkId,
                };
                addEvent(newEvent);
            }

            onEventSaved?.();
        },
        [
            editingEvent,
            opponentTeam,
            matchId,
            activeTeamId,
            updateEvent,
            addEvent,
            defenseFormation,
            getEventTimestamp,
            getVideoTimestamp,
            onEventSaved,
            setSelectedOpponentGoalkeeper,
        ]
    );

    return {
        // State
        matchLoaded,
        editingEvent,
        saveBanner,

        // Computed
        activeTeam,
        opponentTeam,
        eventFormInitialState,

        // Match Context passthrough
        homeTeam: homeTeam as TransformedTeam | null,
        visitorTeam: visitorTeam as TransformedTeam | null,
        homeScore,
        visitorScore,
        time,
        activeTeamId,
        defenseFormation,

        // Actions
        handleTeamSelect,
        handleEditEvent,
        handleCancelEdit,
        handleSaveEvent,
        setSaveBanner,
        setHomeScore,
        setVisitorScore,

        // Refs
        bannerTimeoutRef,
    };
}
