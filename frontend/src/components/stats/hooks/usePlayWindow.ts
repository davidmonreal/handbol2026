import { useMemo, useState } from 'react';
import type { MatchEvent } from '../../../types';

export type PlayWindowRange =
  | { kind: 'range'; start: number; end: number }
  | { kind: 'half'; half: 1 | 2 };

interface UsePlayWindowResult {
  options: { label: string; value: PlayWindowRange }[];
  selected: PlayWindowRange | null;
  setSelected: (range: PlayWindowRange | null) => void;
  filteredEvents: MatchEvent[];
}

export function usePlayWindow(events: MatchEvent[]): UsePlayWindowResult {
  const [selected, setSelected] = useState<PlayWindowRange | null>(null);

  const options = useMemo(() => {
    const shots = events.filter(e => e.category === 'Shot');
    const total = shots.length;
    const opts: { label: string; value: PlayWindowRange }[] = [];
    if (total >= 5) opts.push({ label: 'Show last 5 shots', value: { kind: 'range', start: Math.max(total - 5, 0), end: total } });
    if (total >= 10) opts.push({ label: 'Shots 6–10', value: { kind: 'range', start: Math.max(total - 10, 0), end: Math.max(total - 5, 0) } });
    if (total >= 15) opts.push({ label: 'Shots 11–15', value: { kind: 'range', start: Math.max(total - 15, 0), end: Math.max(total - 10, 0) } });
    if (events.length > 0) {
      opts.push({ label: 'First half', value: { kind: 'half', half: 1 } });
      opts.push({ label: 'Second half', value: { kind: 'half', half: 2 } });
    }
    return opts;
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (!selected) return events;
    if (selected.kind === 'half') {
      const HALF_DURATION = 30 * 60;
      return events.filter(e => selected.half === 1 ? e.timestamp < HALF_DURATION : e.timestamp >= HALF_DURATION);
    }

    const shots = events.filter(e => e.category === 'Shot');
    const opt = options.find(
      o => o.value.kind === 'range' && o.value.start === selected.start && o.value.end === selected.end
    );
    if (!opt || opt.value.kind !== 'range') {
      setSelected(null);
      return events;
    }
    return shots.slice(opt.value.start, opt.value.end);
  }, [events, options, selected]);

  return { options, selected, setSelected, filteredEvents };
}
