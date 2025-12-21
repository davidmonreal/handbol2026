import { useEffect } from 'react';
import type { ClockMarkers } from './matchClockAdapter';
import { computeClockTime } from './matchClockAdapter';

type UseMatchClockParams = ClockMarkers & {
  activeTeamLocked: boolean;
  timerStopped: boolean;
  setTime: (value: number) => void;
};

// Hook that owns side effects (setInterval, resets) while delegating pure math to the adapter.
export function useMatchClock({
  activeTeamLocked,
  timerStopped,
  realTimeFirstHalfStart,
  realTimeFirstHalfEnd,
  realTimeSecondHalfStart,
  realTimeSecondHalfEnd,
  setTime,
}: UseMatchClockParams) {
  useEffect(() => {
    const baseParams = {
      activeTeamLocked,
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
    activeTeamLocked,
    timerStopped,
    realTimeFirstHalfStart,
    realTimeFirstHalfEnd,
    realTimeSecondHalfStart,
    realTimeSecondHalfEnd,
    setTime,
  ]);
}
