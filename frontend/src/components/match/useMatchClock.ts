import { useEffect } from 'react';
import type { ClockMarkers } from './matchClockAdapter';
import { computeClockTime } from './matchClockAdapter';

type UseMatchClockParams = ClockMarkers & {
  timerStopped: boolean;
  setTime: (value: number) => void;
  activeTeamLocked?: boolean;
};

// Hook that owns side effects (setInterval, resets) while delegating pure math to the adapter.
export function useMatchClock({
  timerStopped,
  activeTeamLocked = false,
  realTimeFirstHalfStart,
  realTimeFirstHalfEnd,
  realTimeSecondHalfStart,
  realTimeSecondHalfEnd,
  setTime,
}: UseMatchClockParams) {
  useEffect(() => {
    // Locked team: clock is visually frozen at 0 regardless of backend markers.
    if (activeTeamLocked) {
      setTime(0);
      return undefined;
    }

    const baseParams = {
      timerStopped,
      realTimeFirstHalfStart,
      realTimeFirstHalfEnd,
      realTimeSecondHalfStart,
      realTimeSecondHalfEnd,
    };

    const initial = computeClockTime(baseParams);
    if (initial.time !== undefined) {
      setTime(initial.time);
    }

    if (!initial.shouldTick) {
      return undefined;
    }

    const timer = setInterval(() => {
      const tick = computeClockTime({ ...baseParams, now: Date.now() });
      if (tick.time !== undefined) {
        setTime(tick.time);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [
    timerStopped,
    realTimeFirstHalfStart,
    realTimeFirstHalfEnd,
    realTimeSecondHalfStart,
    realTimeSecondHalfEnd,
    setTime,
    activeTeamLocked,
  ]);
}
