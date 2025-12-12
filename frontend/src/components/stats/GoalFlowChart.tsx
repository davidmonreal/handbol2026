import { useMemo, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import type { MatchEvent } from '../../types';

interface GoalFlowChartProps {
    events: MatchEvent[];
    selectedTeamId: string;
    opponentTeamId: string | null;
    secondHalfMarkSeconds?: number | null;
    teamName: string;
    opponentName: string;
}

type Point = { x: number; y: number };

const HALF_DURATION_SECONDS = 30 * 60;
const VIEWBOX_WIDTH = 1000;
const VIEWBOX_HEIGHT = 520;
const PADDING_LEFT = 60;
const PADDING_RIGHT = 20;
const PADDING_TOP = 24;
const PADDING_BOTTOM = 50;
const CLUSTER_WINDOW_SECONDS = 120;

function buildSmoothPath(points: Point[]): string {
    if (points.length === 0) return '';
    if (points.length === 1) {
        const { x, y } = points[0];
        return `M ${x},${y} L ${x},${y}`;
    }
    const [first, ...rest] = points;
    const commands = [`M ${first.x},${first.y}`, ...rest.map(p => `L ${p.x},${p.y}`)];
    return commands.join(' ');
}

export function GoalFlowChart({
    events,
    selectedTeamId,
    opponentTeamId,
    secondHalfMarkSeconds,
    teamName,
    opponentName,
}: GoalFlowChartProps) {
    const {
        teamSeries,
        opponentSeries,
        foulsByTime,
        turnoversByTime,
        savesByTime,
        maxTime,
        maxGoals,
        secondHalfMark,
    } = useMemo(() => {
        const ownGoals = events
            .filter(e => e.teamId === selectedTeamId && e.category === 'Shot' && e.action === 'Goal')
            .map(e => e.timestamp)
            .sort((a, b) => a - b);

        const oppGoals = events
            .filter(e => opponentTeamId && e.teamId === opponentTeamId && e.category === 'Shot' && e.action === 'Goal')
            .map(e => e.timestamp)
            .sort((a, b) => a - b);

        const foulsEvents = events.filter(e =>
            e.teamId === selectedTeamId &&
            e.category === 'Sanction'
        );

        const turnoverEvents = events.filter(e =>
            e.teamId === selectedTeamId &&
            e.category === 'Turnover'
        );

        const buildCumulative = (timestamps: number[]) => {
            const points: { time: number; value: number }[] = [{ time: 0, value: 0 }];
            let count = 0;
            timestamps.forEach(t => {
                count += 1;
                points.push({ time: t, value: count });
            });
            return points;
        };

        const teamPoints = buildCumulative(ownGoals);
        const opponentPoints = buildCumulative(oppGoals);

        const maxTimeFromEvents = Math.max(
            teamPoints[teamPoints.length - 1]?.time || 0,
            opponentPoints[opponentPoints.length - 1]?.time || 0,
            ...foulsEvents.map(f => f.timestamp),
            ...turnoverEvents.map(t => t.timestamp),
            HALF_DURATION_SECONDS * 2 // ensure some breathing room for empty halves
        );

        const halfMark = secondHalfMarkSeconds ?? HALF_DURATION_SECONDS;
        const maxTimeValue = Math.max(maxTimeFromEvents, halfMark);

        const extendToEnd = (points: { time: number; value: number }[]) => {
            if (points.length === 0) return points;
            const last = points[points.length - 1];
            if (last.time >= maxTimeValue) return points;
            return [...points, { time: maxTimeValue, value: last.value }];
        };

        const paddedTeamPoints = extendToEnd(teamPoints);
        const paddedOpponentPoints = extendToEnd(opponentPoints);

        const clusterCounts = (timestamps: number[]) => {
            if (timestamps.length === 0) return [];
            const sorted = [...timestamps].sort((a, b) => a - b);
            const clusters: { time: number; count: number }[] = [];

            let currentTimeSum = sorted[0];
            let currentCount = 1;
            let lastTime = sorted[0];

            for (let i = 1; i < sorted.length; i++) {
                const t = sorted[i];
                if (t - lastTime < CLUSTER_WINDOW_SECONDS) {
                    currentTimeSum += t;
                    currentCount += 1;
                } else {
                    clusters.push({ time: currentTimeSum / currentCount, count: currentCount });
                    currentTimeSum = t;
                    currentCount = 1;
                }
                lastTime = t;
            }
            clusters.push({ time: currentTimeSum / currentCount, count: currentCount });

            return clusters;
        };

        const maxGoalValue = Math.max(
            paddedTeamPoints[paddedTeamPoints.length - 1]?.value || 0,
            paddedOpponentPoints[paddedOpponentPoints.length - 1]?.value || 0,
            1
        );

        return {
            teamSeries: paddedTeamPoints,
            opponentSeries: paddedOpponentPoints,
            foulsByTime: clusterCounts(foulsEvents.map(f => f.timestamp)),
            turnoversByTime: clusterCounts(turnoverEvents.map(t => t.timestamp)),
            savesByTime: clusterCounts(
                events
                    .filter(e => e.teamId === selectedTeamId && e.category === 'Shot' && e.action === 'Save')
                    .map(s => s.timestamp)
            ),
            maxTime: maxTimeValue,
            maxGoals: maxGoalValue,
            secondHalfMark: halfMark,
        };
    }, [events, opponentTeamId, secondHalfMarkSeconds, selectedTeamId]);

    const width = VIEWBOX_WIDTH - PADDING_LEFT - PADDING_RIGHT;
    const height = VIEWBOX_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

    const [showFouls, setShowFouls] = useState(true);
    const [showTurnovers, setShowTurnovers] = useState(true);
    const [showSaves, setShowSaves] = useState(true);

    const toX = (timeSeconds: number) => PADDING_LEFT + (timeSeconds / (maxTime || 1)) * width;
    const toY = (goals: number) => PADDING_TOP + height - (goals / (maxGoals || 1)) * height;

    const teamPath = buildSmoothPath(teamSeries.map(p => ({ x: toX(p.time), y: toY(p.value) })));
    const opponentPath = buildSmoothPath(opponentSeries.map(p => ({ x: toX(p.time), y: toY(p.value) })));

    const isClose = (a: number, b: number, threshold = 5) => Math.abs(a - b) <= threshold;
    const formatXLabel = (seconds: number, isLastTick: boolean) => {
        const half = secondHalfMark ?? HALF_DURATION_SECONDS;
        if (isLastTick) return 'Final';
        if (isClose(seconds, half, 30)) return 'Half time';
        return `${Math.round(seconds / 60)}'`;
    };

    const yTicks = useMemo(() => {
        const step = 5;
        const ticks: number[] = [];
        const maxTick = Math.floor(maxGoals / step) * step;
        for (let v = step; v <= maxTick; v += step) {
            ticks.push(v);
        }
        if (maxGoals > maxTick) {
            ticks.push(maxGoals);
        }
        if (ticks.length === 0) {
            ticks.push(maxGoals);
        }
        return ticks;
    }, [maxGoals]);

    const xTicks = useMemo(() => {
        const step = 600; // 10 minutes
        const ticksSet = new Set<number>();
        for (let t = step; t < maxTime; t += step) {
            ticksSet.add(t);
        }
        if (secondHalfMark) ticksSet.add(secondHalfMark);
        ticksSet.add(maxTime);
        return Array.from(ticksSet).sort((a, b) => a - b);
    }, [maxTime, secondHalfMark]);

    const getValueAtTime = (series: { time: number; value: number }[], time: number) => {
        if (series.length === 0) return 0;
        let lastValue = series[0].value;
        for (const point of series) {
            if (point.time > time) break;
            lastValue = point.value;
        }
        return lastValue;
    };

    const scaleRadius = (count: number) => Math.min(26, 8 + Math.sqrt(count) * 6);
    const clampY = (y: number) =>
        Math.min(VIEWBOX_HEIGHT - PADDING_BOTTOM - 10, Math.max(PADDING_TOP + 10, y));

    const renderScoreLabels = (time: number) => {
        const teamValue = getValueAtTime(teamSeries, time);
        const opponentValue = getValueAtTime(opponentSeries, time);
        const x = toX(time);
        const teamY = toY(teamValue);
        const opponentY = toY(opponentValue);

        const teamIsHigher = teamValue >= opponentValue;
        const topY = clampY(teamIsHigher ? teamY - 12 : opponentY - 12);
        const bottomY = clampY(teamIsHigher ? opponentY + 16 : teamY + 16);

        return (
            <>
                <text
                    x={x}
                    y={topY}
                    textAnchor="middle"
                    className="text-sm font-semibold"
                    fill={teamIsHigher ? 'rgb(79,70,229)' : 'rgba(99,102,241,0.7)'}
                >
                    {teamIsHigher ? teamValue : opponentValue}
                </text>
                <text
                    x={x}
                    y={bottomY}
                    textAnchor="middle"
                    className="text-sm font-semibold"
                    fill={teamIsHigher ? 'rgba(99,102,241,0.7)' : 'rgb(79,70,229)'}
                >
                    {teamIsHigher ? opponentValue : teamValue}
                </text>
            </>
        );
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 text-indigo-600">
                            <TrendingUp className="w-4 h-4" aria-hidden />
                        </span>
                        <h3 className="text-lg font-semibold text-gray-800">Goal Flow & Errors</h3>
                    </div>
                    <p className="text-sm text-gray-500">Cumulative goals per minute, fouls received and turnovers</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-gray-600">
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full bg-indigo-500" />
                        {teamName || 'Your team'}
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full bg-indigo-200" />
                        {opponentName || 'Rival'}
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full bg-red-400" />
                        Fouls received
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full bg-slate-500" />
                        Turnovers
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full bg-blue-500" />
                        Saves
                    </span>
                </div>
            </div>

            <div className="flex flex-wrap justify-center gap-2 pt-1">
                <button
                    type="button"
                    onClick={() => setShowFouls(v => !v)}
                    className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${
                        showFouls ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-gray-500 border-gray-200'
                    }`}
                >
                    {showFouls ? 'Hide fouls' : 'Show fouls'}
                </button>
                <button
                    type="button"
                    onClick={() => setShowTurnovers(v => !v)}
                    className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${
                        showTurnovers ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-white text-gray-500 border-gray-200'
                    }`}
                >
                    {showTurnovers ? 'Hide turnovers' : 'Show turnovers'}
                </button>
                <button
                    type="button"
                    onClick={() => setShowSaves(v => !v)}
                    className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${
                        showSaves ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-gray-500 border-gray-200'
                    }`}
                >
                    {showSaves ? 'Hide saves' : 'Show saves'}
                </button>
            </div>

            <div className="relative w-full" aria-label="Goal flow chart">
                <svg viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`} className="w-full h-[28rem]">
                    {/* Background grid */}
                    {yTicks.map((g) => {
                        const y = toY(g);
                        return (
                            <line
                                key={`h-${g}`}
                                x1={PADDING_LEFT}
                                x2={VIEWBOX_WIDTH - PADDING_RIGHT}
                                y1={y}
                                y2={y}
                                stroke="#f1f5f9"
                                strokeWidth={1}
                            />
                        );
                    })}

                    {/* Second half marker */}
                    {secondHalfMark && (
                        <line
                            x1={toX(secondHalfMark)}
                            x2={toX(secondHalfMark)}
                            y1={PADDING_TOP}
                            y2={VIEWBOX_HEIGHT - PADDING_BOTTOM + 6}
                            stroke="#cbd5e1"
                            strokeDasharray="6 6"
                            strokeWidth={2}
                        />
                    )}

                    {/* Opponent line */}
                    <path
                        d={opponentPath}
                        fill="none"
                        stroke="rgba(99,102,241,0.35)"
                        strokeWidth={3}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                    />

                    {/* Team line */}
                    <path
                        d={teamPath}
                        fill="none"
                        stroke="rgb(79,70,229)"
                        strokeWidth={4}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                    />

                    {/* Fouls and turnovers as proportional circles on the team line */}
                    {foulsByTime.map(({ time, count }, idx) => {
                        const value = getValueAtTime(teamSeries, time);
                        const cx = toX(time);
                        const cy = toY(value);
                        const r = scaleRadius(count);
                        return showFouls ? (
                            <g key={`foul-${idx}-${time}`}>
                                <title>{`${count} foul${count > 1 ? 's' : ''}`}</title>
                                <circle
                                    cx={cx}
                                    cy={cy}
                                    r={r}
                                    fill="rgba(248,113,113,0.55)"
                                    stroke="rgba(239,68,68,0.8)"
                                    strokeWidth={1.5}
                                />
                                <text
                                    x={cx}
                                    y={cy}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    className="text-xs font-semibold"
                                    fill="rgb(239,68,68)"
                                >
                                    {count}
                                </text>
                            </g>
                        ) : null;
                    })}
                    {turnoversByTime.map(({ time, count }, idx) => {
                        const value = getValueAtTime(teamSeries, time);
                        const cx = toX(time);
                        const cy = toY(value);
                        const r = scaleRadius(count);
                        return showTurnovers ? (
                            <g key={`turnover-${idx}-${time}`}>
                                <title>{`${count} turnover${count > 1 ? 's' : ''}`}</title>
                                <circle
                                    cx={cx}
                                    cy={cy}
                                    r={r}
                                    fill="rgba(148,163,184,0.55)"
                                    stroke="rgba(71,85,105,0.9)"
                                    strokeWidth={1.5}
                                />
                                <text
                                    x={cx}
                                    y={cy}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    className="text-xs font-semibold"
                                    fill="rgb(30,41,59)"
                                >
                                    {count}
                                </text>
                            </g>
                        ) : null;
                    })}
                    {savesByTime.map(({ time, count }, idx) => {
                        const value = getValueAtTime(teamSeries, time);
                        const cx = toX(time);
                        const cy = toY(value);
                        const r = scaleRadius(count);
                        return showSaves ? (
                            <g key={`save-${idx}-${time}`}>
                                <title>{`${count} save${count > 1 ? 's' : ''}`}</title>
                                <circle
                                    cx={cx}
                                    cy={cy}
                                    r={r}
                                    fill="rgba(59,130,246,0.45)"
                                    stroke="rgba(37,99,235,0.9)"
                                    strokeWidth={1.5}
                                />
                                <text
                                    x={cx}
                                    y={cy}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    className="text-xs font-semibold"
                                    fill="rgb(30,64,175)"
                                >
                                    {count}
                                </text>
                            </g>
                        ) : null;
                    })}

                    {/* Mid-game and final score labels */}
                    {[secondHalfMark, maxTime].filter(Boolean).map((time, idx) => (
                        <g key={`label-${idx}-${time}`}>{renderScoreLabels(time)}</g>
                    ))}

                    {/* X-axis labels (10-minute ticks + final) */}
                    {xTicks.map((seconds, idx) => {
                        const x = toX(seconds);
                        const isLastTick = idx === xTicks.length - 1;
                        return (
                            <g key={`tick-${idx}-${seconds}`}>
                                <line
                                    x1={x}
                                    x2={x}
                                    y1={VIEWBOX_HEIGHT - PADDING_BOTTOM}
                                    y2={VIEWBOX_HEIGHT - PADDING_BOTTOM + 6}
                                    stroke="#cbd5e1"
                                    strokeWidth={1}
                                />
                                <text
                                    x={x}
                                    y={VIEWBOX_HEIGHT - PADDING_BOTTOM + 20}
                                    textAnchor="middle"
                                    className="text-xs fill-gray-500"
                                >
                                    {formatXLabel(seconds, isLastTick)}
                                </text>
                            </g>
                        );
                    })}

                    {/* Y-axis labels */}
                    {yTicks.map((g) => {
                        const y = toY(g);
                        return (
                            <text
                                key={`y-${g}`}
                                x={PADDING_LEFT - 10}
                                y={y + 4}
                                textAnchor="end"
                                className="text-xs fill-gray-500"
                            >
                                {g}
                            </text>
                        );
                    })}
                </svg>
            </div>

        </div>
    );
}
