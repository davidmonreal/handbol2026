import { useMemo, useState } from 'react';
import type { MatchEvent } from '../../../types';

export interface PlayWindowRange {
  start: number;
  end: number;
}

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
    if (total >= 5) opts.push({ label: 'Show last 5 shots', value: { start: Math.max(total - 5, 0), end: total } });
    if (total >= 10) opts.push({ label: 'Shots 6–10', value: { start: Math.max(total - 10, 0), end: Math.max(total - 5, 0) } });
    if (total >= 15) opts.push({ label: 'Shots 11–15', value: { start: Math.max(total - 15, 0), end: Math.max(total - 10, 0) } });
    return opts;
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (!selected) return events;
    const shots = events.filter(e => e.category === 'Shot');
    const opt = options.find(o => o.value.start === selected.start && o.value.end === selected.end);
    if (!opt) {
      setSelected(null);
      return events;
    }
    return shots.slice(opt.value.start, opt.value.end);
  }, [events, options, selected]);

  return { options, selected, setSelected, filteredEvents };
}
