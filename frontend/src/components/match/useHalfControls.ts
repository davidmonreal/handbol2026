import { useEffect, useMemo, useRef, useState } from 'react';
import type { TranslationParams } from '../../context/LanguageContext';

type HalfControlsParams = {
  time: number;
  hideHalfControls: boolean;
  isFinished: boolean;
  hasAnyEvents: boolean;
  realTimeFirstHalfStart: number | null;
  realTimeFirstHalfEnd: number | null;
  realTimeSecondHalfStart: number | null;
  realTimeSecondHalfEnd: number | null;
  firstHalfVideoStart: number | null;
  secondHalfVideoStart: number | null;
  setRealTimeCalibration: (half: 1 | 2, timestamp: number, boundary?: 'start' | 'end') => Promise<void>;
  onFinishMatch?: () => Promise<void> | void;
  t: (key: string, opts?: TranslationParams) => string;
};

type HalfButtonState = {
  label: string;
  disabled: boolean;
  title?: string;
  onClick: () => Promise<void> | void;
  visible?: boolean;
};

type HalfControlsResult = {
  displayTime: number;
  firstHalfStart: HalfButtonState;
  firstHalfFinish: HalfButtonState;
  secondHalfStart: HalfButtonState;
  secondHalfFinish: HalfButtonState;
  showHalfControls: boolean;
  showSecondHalfControls: boolean;
  calibrationLoading: 'first' | 'second' | null;
  formatTime: (seconds: number) => string;
  firstHalfFinished: boolean;
  secondHalfFinished: boolean;
};

// Encapsulates half-control logic so Scoreboard remains presentational.
// This also centralizes the safeguards (e.g., don't restart if there are events) to avoid regressions.
export function useHalfControls({
  time,
  hideHalfControls,
  isFinished,
  hasAnyEvents,
  realTimeFirstHalfStart,
  realTimeFirstHalfEnd,
  realTimeSecondHalfStart,
  realTimeSecondHalfEnd,
  firstHalfVideoStart,
  secondHalfVideoStart,
  setRealTimeCalibration,
  onFinishMatch,
  t,
}: HalfControlsParams): HalfControlsResult {
  const [calibrationLoading, setCalibrationLoading] = useState<'first' | 'second' | null>(null);
  // Live clock state (no video): remember a user-initiated 1H start so we can enable Finish 1H
  // after the first play, even before the backend marker is persisted.
  const [firstHalfStartIssued, setFirstHalfStartIssued] = useState(false);
  // Start with 2H controls hidden; they'll appear immediately if 2H markers already exist (page refresh).
  const [showSecondHalfControls, setShowSecondHalfControls] = useState<boolean>(false);
  const finishMatchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track the live state of each half to decide which control is actionable.
  const firstHalfStarted = !!realTimeFirstHalfStart;
  const firstHalfFinished = !!realTimeFirstHalfEnd;
  const secondHalfStarted = !!realTimeSecondHalfStart;
  const secondHalfFinished = !!realTimeSecondHalfEnd;
  const effectiveFirstHalfStarted = firstHalfStarted || firstHalfStartIssued;
  // If we have video markers, we defer timekeeping to the video calibration (live buttons disable).
  const hasVideoCalibration = firstHalfVideoStart !== null || secondHalfVideoStart !== null;
  // When the active team is locked, the user must see a frozen 00:00 clock and no start buttons.
  const effectiveTime = hideHalfControls ? 0 : time;

  // After finishing 1H we wait 3s before swapping to 2H controls, unless 2H is already running (e.g., refresh).
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (secondHalfStarted || secondHalfFinished) {
      setShowSecondHalfControls(true);
    } else if (firstHalfFinished) {
      timer = setTimeout(() => setShowSecondHalfControls(true), 3000);
    } else {
      setShowSecondHalfControls(false);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [firstHalfFinished, secondHalfFinished, secondHalfStarted]);

  useEffect(() => {
    // Keep the issued flag in sync with persisted markers; reset when markers clear.
    setFirstHalfStartIssued(!!realTimeFirstHalfStart);
  }, [realTimeFirstHalfStart]);

  useEffect(() => {
    // When 2H finishes, hide its controls after the 3s grace period and leave the clock at 00:00.
    if (!secondHalfFinished) return;
    const timer = setTimeout(() => setShowSecondHalfControls(false), 3000);
    return () => clearTimeout(timer);
  }, [secondHalfFinished]);

  useEffect(() => {
    return () => {
      if (finishMatchTimeoutRef.current) {
        clearTimeout(finishMatchTimeoutRef.current);
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Compute display clock accounting for video calibration offsets.
  const {
    displayTime,
    secondHalfDuration,
  } = useMemo(() => {
    const liveFirstPhaseDuration = realTimeFirstHalfStart
      ? realTimeFirstHalfEnd
        ? Math.max(0, Math.floor((realTimeFirstHalfEnd - realTimeFirstHalfStart) / 1000))
        : realTimeSecondHalfStart
          ? Math.max(0, Math.floor((realTimeSecondHalfStart - realTimeFirstHalfStart) / 1000))
          : null
      : null;
    const videoFirstPhaseDuration = firstHalfVideoStart !== null && secondHalfVideoStart !== null
      ? Math.max(0, secondHalfVideoStart - firstHalfVideoStart)
      : null;
    const offset = liveFirstPhaseDuration ?? videoFirstPhaseDuration;
    const isSecondHalfConfigured = !!realTimeSecondHalfStart || secondHalfVideoStart !== null;
    const isSecondHalfActive = isSecondHalfConfigured && offset !== null && effectiveTime >= offset;

    const adjustedTime = isSecondHalfActive && offset !== null
      ? Math.max(0, effectiveTime - offset)
      : effectiveTime;

    const secondDuration = realTimeSecondHalfStart && realTimeSecondHalfEnd
      ? Math.max(0, Math.floor((realTimeSecondHalfEnd - realTimeSecondHalfStart) / 1000))
      : null;

    // UX: when a half ends we want the visible clock to rest at 00:00 during the 3s gap and once the match is done.
    if (secondHalfFinished) {
      return { displayTime: 0, secondHalfDuration: secondDuration };
    }
    if (firstHalfFinished && !secondHalfStarted) {
      return { displayTime: 0, secondHalfDuration: secondDuration };
    }

    return { displayTime: adjustedTime, secondHalfDuration: secondDuration };
  }, [
    effectiveTime,
    realTimeFirstHalfStart,
    realTimeFirstHalfEnd,
    realTimeSecondHalfStart,
    realTimeSecondHalfEnd,
    firstHalfVideoStart,
    secondHalfVideoStart,
  ]);

  // Simplified: once started, show "finish" until the half is completed. Restarts are blocked when events exist.
  // Button gating (live tracking only):
  // - If video calibration exists, live buttons stay disabled because the clock is driven by video time.
  // - 1H Start is enabled until the first play is logged; clearing plays re-enables it.
  // - 1H Finish requires 1H to be started AND at least one play.
  // - 2H Start shows after a 3s gap when 1H ends; it disables as soon as 2H starts.
  // - 2H Finish enables immediately after 2H starts (no need to wait for a play).
  const firstHalfStartDisabled =
    hideHalfControls ||
    isFinished ||
    hasVideoCalibration ||
    calibrationLoading !== null ||
    firstHalfFinished ||
    hasAnyEvents;

  const firstHalfFinishDisabled =
    hideHalfControls ||
    isFinished ||
    hasVideoCalibration ||
    calibrationLoading !== null ||
    !effectiveFirstHalfStarted ||
    firstHalfFinished ||
    !hasAnyEvents;

  const secondHalfLocked = !firstHalfFinished && !secondHalfStarted;

  const secondHalfStartDisabled =
    hideHalfControls ||
    isFinished ||
    hasVideoCalibration ||
    calibrationLoading !== null ||
    secondHalfFinished ||
    secondHalfStarted ||
    secondHalfLocked ||
    !showSecondHalfControls;

  const secondHalfFinishDisabled =
    hideHalfControls ||
    isFinished ||
    hasVideoCalibration ||
    calibrationLoading !== null ||
    !secondHalfStarted ||
    secondHalfFinished ||
    !showSecondHalfControls;

  const handleFirstHalfStart = async () => {
    if (isFinished || hideHalfControls || hasVideoCalibration || hasAnyEvents || firstHalfFinished) return;
    setCalibrationLoading('first');
    try {
      await setRealTimeCalibration(1, Date.now(), 'start');
      setFirstHalfStartIssued(true);
    } finally {
      setCalibrationLoading(null);
    }
  };

  const handleFirstHalfFinish = async () => {
    if (isFinished || hideHalfControls || hasVideoCalibration || !effectiveFirstHalfStarted || firstHalfFinished || !hasAnyEvents) return;
    setCalibrationLoading('first');
    try {
      await setRealTimeCalibration(1, Date.now(), 'end');
    } finally {
      setCalibrationLoading(null);
    }
  };

  const handleSecondHalfStart = async () => {
    if (isFinished || hideHalfControls || hasVideoCalibration || secondHalfLocked || secondHalfFinished) return;
    setCalibrationLoading('second');
    try {
      await setRealTimeCalibration(2, Date.now(), 'start');
    } finally {
      setCalibrationLoading(null);
    }
  };

  const handleSecondHalfFinish = async () => {
    if (isFinished || hideHalfControls || hasVideoCalibration || !secondHalfStarted || secondHalfFinished) return;
    setCalibrationLoading('second');
    try {
      await setRealTimeCalibration(2, Date.now(), 'end');
      // Delay the finished callback so the UI has time to show the updated 2H controls before the match ends.
      if (onFinishMatch) {
        if (finishMatchTimeoutRef.current) {
          clearTimeout(finishMatchTimeoutRef.current);
        }
        finishMatchTimeoutRef.current = setTimeout(() => {
          onFinishMatch();
        }, 3000);
      }
    } finally {
      setCalibrationLoading(null);
    }
  };

  const firstHalfStart: HalfButtonState = {
    label: t('scoreboard.startFirstHalf'),
    disabled: firstHalfStartDisabled,
    onClick: handleFirstHalfStart,
    title: realTimeFirstHalfStart
      ? t('scoreboard.halfStartedAt', {
          time: new Date(realTimeFirstHalfStart).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        })
      : t('scoreboard.startFirstHalfTooltip'),
  };

  const firstHalfFinish: HalfButtonState = {
    label: t('scoreboard.finishFirstHalf'),
    disabled: firstHalfFinishDisabled,
    onClick: handleFirstHalfFinish,
    title: realTimeFirstHalfEnd
      ? t('scoreboard.halfFinishedAtClock', { clock: formatTime(displayTime) })
      : t('scoreboard.finishFirstHalfTooltip'),
  };

  const secondHalfStart: HalfButtonState = {
    label: t('scoreboard.startSecondHalf'),
    disabled: secondHalfStartDisabled,
    onClick: handleSecondHalfStart,
    visible: showSecondHalfControls,
    title: realTimeSecondHalfStart
      ? t('scoreboard.halfStartedAt', {
          time: new Date(realTimeSecondHalfStart).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        })
      : secondHalfDuration !== null
        ? t('scoreboard.halfFinishedAtClock', { clock: formatTime(secondHalfDuration) })
        : t('scoreboard.startSecondHalfTooltip'),
  };

  const secondHalfFinish: HalfButtonState = {
    label: t('scoreboard.finishSecondHalf'),
    disabled: secondHalfFinishDisabled,
    onClick: handleSecondHalfFinish,
    visible: showSecondHalfControls,
    title: realTimeSecondHalfEnd
      ? t('scoreboard.halfFinishedAtClock', { clock: formatTime(displayTime) })
      : t('scoreboard.finishSecondHalfTooltip'),
  };

  return {
    displayTime,
    firstHalfStart,
    firstHalfFinish,
    secondHalfStart,
    secondHalfFinish,
    // Hide half controls entirely when video calibration drives the clock.
    showHalfControls: !hasVideoCalibration,
    showSecondHalfControls,
    calibrationLoading,
    formatTime,
    firstHalfFinished,
    secondHalfFinished,
  };
}
