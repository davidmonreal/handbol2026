import { useState, useCallback } from 'react';
import type { ZoneType, FlowType } from '../types';

interface UseEventRecordingReturn {
    // State
    flowType: FlowType | null;
    selectedAction: string | null;
    selectedZone: ZoneType | null;
    isCollective: boolean;
    hasOpposition: boolean;
    isCounterAttack: boolean;
    canFinalize: boolean;

    // Setters
    setFlowType: (type: FlowType | null) => void;
    setSelectedAction: (action: string | null) => void;
    setSelectedZone: (zone: ZoneType | null) => void;

    // Toggles
    toggleCollective: () => void;
    toggleOpposition: () => void;
    toggleCounterAttack: () => void;

    // Reset
    resetPlayState: () => void;
}

/**
 * Custom hook for managing event recording state
 * Encapsulates flow type, action, zone selection and context toggles
 */
export const useEventRecording = (): UseEventRecordingReturn => {
    const [flowType, setFlowTypeState] = useState<FlowType | null>(null);
    const [selectedAction, setSelectedAction] = useState<string | null>(null);
    const [selectedZone, setSelectedZone] = useState<ZoneType | null>(null);
    const [isCollective, setIsCollective] = useState(false);
    const [hasOpposition, setHasOpposition] = useState(false);
    const [isCounterAttack, setIsCounterAttack] = useState(false);

    // When flow type changes, reset action and zone
    const setFlowType = useCallback((type: FlowType | null) => {
        setFlowTypeState(type);
        if (type !== flowType) {
            setSelectedAction(null);
            setSelectedZone(null);
        }
    }, [flowType]);

    const toggleCollective = useCallback(() => {
        setIsCollective(prev => !prev);
    }, []);

    const toggleOpposition = useCallback(() => {
        setHasOpposition(prev => !prev);
    }, []);

    const toggleCounterAttack = useCallback(() => {
        setIsCounterAttack(prev => !prev);
    }, []);

    const resetPlayState = useCallback(() => {
        setFlowTypeState(null);
        setSelectedAction(null);
        setSelectedZone(null);
        setIsCollective(false);
        setHasOpposition(false);
        setIsCounterAttack(false);
    }, []);

    // Can finalize when we have both flow type and action
    const canFinalize = flowType !== null && selectedAction !== null;

    return {
        flowType,
        selectedAction,
        selectedZone,
        isCollective,
        hasOpposition,
        isCounterAttack,
        canFinalize,
        setFlowType,
        setSelectedAction,
        setSelectedZone,
        toggleCollective,
        toggleOpposition,
        toggleCounterAttack,
        resetPlayState,
    };
};
