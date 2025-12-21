import { describe, expect, it } from 'vitest';
import { computeClockTime } from '../matchClockAdapter';

const baseMarkers = {
  realTimeFirstHalfStart: null,
  realTimeFirstHalfEnd: null,
  realTimeSecondHalfStart: null,
  realTimeSecondHalfEnd: null,
};

describe('computeClockTime', () => {
  it('does nothing before first half starts', () => {
    const result = computeClockTime({
      ...baseMarkers,
      timerStopped: false,
    });
    expect(result).toEqual({ time: undefined, shouldTick: false });
  });

  it('ticks during first half', () => {
    const result = computeClockTime({
      ...baseMarkers,
      realTimeFirstHalfStart: 1,
      timerStopped: false,
      now: 10_001,
    });
    expect(result).toEqual({ time: 10, shouldTick: true });
  });

  it('holds at first half end before second starts', () => {
    const result = computeClockTime({
      ...baseMarkers,
      realTimeFirstHalfStart: 1,
      realTimeFirstHalfEnd: 60_001,
      timerStopped: false,
      now: 120_001,
    });
    expect(result).toEqual({ time: 60, shouldTick: false });
  });

  it('ticks during second half', () => {
    const result = computeClockTime({
      ...baseMarkers,
      realTimeFirstHalfStart: 1,
      realTimeFirstHalfEnd: 60_001,
      realTimeSecondHalfStart: 90_001,
      timerStopped: false,
      now: 120_001,
    });
    // 60s first half + 30s second half = 90s
    expect(result).toEqual({ time: 90, shouldTick: true });
  });

  it('caps when match is finished', () => {
    const result = computeClockTime({
      ...baseMarkers,
      realTimeFirstHalfStart: 1,
      realTimeFirstHalfEnd: 60_001,
      realTimeSecondHalfStart: 90_001,
      realTimeSecondHalfEnd: 150_001,
      timerStopped: false,
    });
    expect(result).toEqual({ time: 120, shouldTick: false });
  });

  it('freezes when timer is stopped manually', () => {
    const result = computeClockTime({
      ...baseMarkers,
      realTimeFirstHalfStart: 1,
      timerStopped: true,
      now: 30_001,
    });
    expect(result).toEqual({ time: undefined, shouldTick: false });
  });
});
