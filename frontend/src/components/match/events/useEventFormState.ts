import { useMemo, useReducer, useRef } from 'react';
import type { MatchEvent, ZoneType } from '../../../types';
import { buildEventFromForm } from './eventFormBuilder';
import { buildSanctionTypes, buildShotResults, buildTurnoverTypes } from './actionOptions';
import {
    eventFormReducer,
    hasGoalTarget,
    initializeState,
    type EventCategory,
    type EventFormState,
    type ShotEventState,
} from './eventFormStateMachine';

type DebugDurationEntry = {
    category: string | null;
    action: string | null;
    durationMs: number;
    savedAt: string;
};

const DEBUG_STORAGE_KEY = 'eventFormDebugDurations';

type StorageAdapter = { getItem: (key: string) => string | null; setItem: (key: string, value: string) => void };

const persistDebugDuration = (
    entry: DebugDurationEntry,
    storage: StorageAdapter | null,
) => {
    if (!storage) return;
    try {
        const raw = storage.getItem(DEBUG_STORAGE_KEY);
        const parsed: DebugDurationEntry[] = raw ? JSON.parse(raw) : [];
        parsed.push(entry);
        storage.setItem(DEBUG_STORAGE_KEY, JSON.stringify(parsed));
    } catch {
        // Debug-only; ignore persistence errors.
    }
};

type UseEventFormStateParams = {
    event?: MatchEvent | null;
    teamId: string;
    initialState?: {
        playerId?: string;
        opponentGoalkeeperId?: string;
    };
    locked?: boolean;
    onSave: (event: MatchEvent, opponentGkId?: string) => void | Promise<void>;
    onSaved?: () => void;
    onSaveMessage?: (message: string, variant?: 'success' | 'error') => void;
    onCancel: () => void;
    onDelete?: (eventId: string) => void;
    t: (key: string) => string;
    deps?: Partial<{
        clock: { now: () => number };
        storage: {
            getItem: (key: string) => string | null;
            setItem: (key: string, value: string) => void;
        };
        logger: { log: (...args: unknown[]) => void };
    }>;
};

export const useEventFormState = ({
    event,
    teamId,
    initialState,
    locked = false,
    onSave,
    onSaved,
    onSaveMessage,
    onCancel,
    onDelete,
    t,
    deps,
}: UseEventFormStateParams) => {
    const initialSnapshotRef = useRef<EventFormState | null>(null);
    const [state, dispatch] = useReducer(
        eventFormReducer,
        { event, initialState },
        (args) => {
            const initial = initializeState(args);
            initialSnapshotRef.current = initial;
            return initial;
        },
    );
    const startTimeRef = useRef<number | null>(null);

    const shotResults = useMemo(() => buildShotResults(t), [t]);
    const turnoverTypes = useMemo(() => buildTurnoverTypes(t), [t]);
    const sanctionTypes = useMemo(() => buildSanctionTypes(t), [t]);

    const clock = deps?.clock ?? { now: () => (typeof performance !== 'undefined' ? performance.now() : Date.now()) };
    const storage: StorageAdapter | null =
        deps?.storage ??
        (typeof localStorage !== 'undefined' &&
        typeof localStorage.getItem === 'function' &&
        typeof localStorage.setItem === 'function'
            ? {
                  getItem: localStorage.getItem.bind(localStorage),
                  setItem: localStorage.setItem.bind(localStorage),
              }
            : null);
    const logger = deps?.logger ?? { log: console.log };

    const save = async () => {
        if (locked || !state.selectedPlayerId) return;

        const updatedEvent: MatchEvent = buildEventFromForm(
            {
                teamId,
                selectedPlayerId: state.selectedPlayerId,
                selectedCategory: state.selectedCategory,
                selectedAction: state.selectedAction,
                selectedZone: state.selectedZone,
                selectedTarget: state.selectedTarget,
                isCollective: state.isCollective,
                hasOpposition: state.hasOpposition,
                isCounterAttack: state.isCounterAttack,
                opponentGoalkeeperId: state.selectedOpponentGkId || undefined,
            },
            { baseEvent: event || null },
        );

        try {
            await Promise.resolve(onSave(updatedEvent, state.selectedOpponentGkId));
            onSaveMessage?.(t('eventForm.successMessage'), 'success');
            onSaved?.();
            dispatch({ type: 'resetAfterSave', resetPlayer: !event });
            if (startTimeRef.current) {
                const elapsed = Math.round(clock.now() - startTimeRef.current);
                const debugEntry: DebugDurationEntry = {
                    category: updatedEvent.category ?? null,
                    action: updatedEvent.action ?? null,
                    durationMs: elapsed,
                    savedAt: new Date().toISOString(),
                };
                // Quick and dirty tracing: persisted locally to compute averages later.
                persistDebugDuration(debugEntry, storage);
                logger.log('[EventFormDebug] timeToCreateMs', elapsed, debugEntry);
                startTimeRef.current = null;
            }
        } catch (err) {
            onSaveMessage?.(
                err instanceof Error ? err.message : t('dashboard.errorLoadMatches'),
                'error',
            );
        }
    };

    const requestDelete = () => {
        if (locked) return;
        dispatch({ type: 'openDelete' });
    };

    const confirmDelete = () => {
        dispatch({ type: 'closeDelete' });
        if (event && onDelete) {
            onDelete(event.id);
            onCancel();
        }
    };

    const cancelDelete = () => dispatch({ type: 'closeDelete' });

    const isGoalTargetVisible = hasGoalTarget(
        state.selectedCategory,
        state.selectedCategory === 'Shot' ? (state as ShotEventState).selectedAction : null,
    );

    return {
        state,
        shotResults,
        turnoverTypes,
        sanctionTypes,
        isGoalTargetVisible,
        dispatchers: {
            selectPlayer: (playerId: string) => {
                startTimeRef.current = clock.now();
                dispatch({ type: 'selectPlayer', playerId });
            },
            selectOpponentGk: (playerId: string) =>
                dispatch({ type: 'selectOpponentGk', playerId }),
            selectCategory: (category: EventCategory) =>
                dispatch({ type: 'selectCategory', category }),
            selectAction: (action: string | null) => dispatch({ type: 'selectAction', action }),
            selectZone: (zone: ZoneType | null) => dispatch({ type: 'selectZone', zone }),
            selectTarget: (target?: number) => dispatch({ type: 'selectTarget', target }),
            toggleCollective: (value: boolean) => dispatch({ type: 'toggleCollective', value }),
            toggleOpposition: (value: boolean) => dispatch({ type: 'toggleOpposition', value }),
            toggleCounterAttack: (value: boolean) =>
                dispatch({ type: 'toggleCounterAttack', value }),
            resetForm: () => {
                if (initialSnapshotRef.current) {
                    dispatch({ type: 'replaceState', state: initialSnapshotRef.current });
                }
            },
            resetFormPreservingOpponentGk: () => {
                if (initialSnapshotRef.current) {
                    dispatch({
                        type: 'replaceState',
                        state: {
                            ...initialSnapshotRef.current,
                            selectedOpponentGkId: state.selectedOpponentGkId,
                        },
                    });
                }
            },
            save,
            requestDelete,
            confirmDelete,
            cancelDelete,
        },
    };
};
