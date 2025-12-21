export type ClockMarkers = {
  realTimeFirstHalfStart: number | null;
  realTimeFirstHalfEnd: number | null;
  realTimeSecondHalfStart: number | null;
  realTimeSecondHalfEnd: number | null;
};

export type ClockAdapterInput = ClockMarkers & {
  activeTeamLocked: boolean;
  timerStopped: boolean;
  now?: number;
};

export type ClockAdapterOutput = {
  time: number | undefined;
  shouldTick: boolean;
};

// Pure function that maps raw match timing markers to a UI-friendly clock value.
export function computeClockTime({
  activeTeamLocked,
  timerStopped,
  realTimeFirstHalfStart,
  realTimeFirstHalfEnd,
  realTimeSecondHalfStart,
  realTimeSecondHalfEnd,
  now = Date.now(),
}: ClockAdapterInput): ClockAdapterOutput {
  if (!activeTeamLocked) {
    // Unlocking a team should reset the clock so its side can start fresh.
    return { time: 0, shouldTick: false };
  }

  // If we never started or the timer is manually stopped, leave the current value untouched.
  if (!realTimeFirstHalfStart || timerStopped) {
    return { time: undefined, shouldTick: false };
  }

  const firstHalfDuration = realTimeFirstHalfEnd
    ? Math.max(0, Math.floor((realTimeFirstHalfEnd - realTimeFirstHalfStart) / 1000))
    : null;

  // Finished first half but second not started yet: stick to the recorded value.
  if (realTimeFirstHalfEnd && !realTimeSecondHalfStart) {
    return { time: firstHalfDuration ?? 0, shouldTick: false };
  }

  // Match finished: cap at the final recorded sum of halves.
  if (realTimeSecondHalfEnd && realTimeSecondHalfStart) {
    const firstPhase =
      firstHalfDuration ??
      Math.max(0, Math.floor((realTimeSecondHalfStart - realTimeFirstHalfStart) / 1000));
    const elapsedSecond = Math.max(0, Math.floor((realTimeSecondHalfEnd - realTimeSecondHalfStart) / 1000));
    return { time: firstPhase + elapsedSecond, shouldTick: false };
  }

  // Second half running.
  if (realTimeSecondHalfStart) {
    const firstPhase =
      firstHalfDuration ??
      Math.max(0, Math.floor((realTimeSecondHalfStart - realTimeFirstHalfStart) / 1000));
    const elapsedSecond = Math.max(0, Math.floor((now - realTimeSecondHalfStart) / 1000));
    return { time: firstPhase + elapsedSecond, shouldTick: true };
  }

  // First half running.
  return {
    time: Math.max(0, Math.floor((now - realTimeFirstHalfStart) / 1000)),
    shouldTick: true,
  };
}
