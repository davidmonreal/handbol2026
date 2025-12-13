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
    // A "Play" is any offensive event: Shot, Turnover, or Sanction/Foul (suffered)
    const plays = events.filter(e => ['Shot', 'Turnover', 'Sanction', 'Foul'].includes(e.category));
    const total = plays.length;
    const opts: { label: string; value: PlayWindowRange }[] = [];
    if (total >= 10) opts.push({ label: 'Show last 10 plays', value: { kind: 'range', start: Math.max(total - 10, 0), end: total } });
    if (total >= 20) opts.push({ label: 'Plays 11–20', value: { kind: 'range', start: Math.max(total - 20, 0), end: Math.max(total - 10, 0) } });
    if (total >= 30) opts.push({ label: 'Plays 21–30', value: { kind: 'range', start: Math.max(total - 30, 0), end: Math.max(total - 20, 0) } });
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

    const plays = events.filter(e => ['Shot', 'Turnover', 'Sanction', 'Foul'].includes(e.category));
    const opt = options.find(
      o => o.value.kind === 'range' && o.value.start === selected.start && o.value.end === selected.end
    );
    if (!opt || opt.value.kind !== 'range') {
      setSelected(null);
      return events;
    }
    return plays.slice(opt.value.start, opt.value.end);
  }, [events, options, selected]);

  return { options, selected, setSelected, filteredEvents };
}
