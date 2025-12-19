import { useMemo, useState } from 'react';
import { TrendingUp, Download } from 'lucide-react';
import type { MatchEvent } from '../../types';
import { useSafeTranslation } from '../../context/LanguageContext';
import {
    buildGoalFlowData,
    HALF_BOUNDARY_POSITION,
    FIRST_SEGMENT,
    SECOND_SEGMENT,
    VIEWBOX_HEIGHT,
    VIEWBOX_WIDTH,
    PADDING_BOTTOM,
    PADDING_LEFT,
    PADDING_RIGHT,
    PADDING_TOP,
} from './goalFlowData';
import type { SeriesPoint } from './goalFlowData';

interface GoalFlowChartProps {
    events: MatchEvent[];
    selectedTeamId: string;
    opponentTeamId: string | null;
    secondHalfMarkSeconds?: number | null;
    teamName: string;
    opponentName: string;
    onDownloadCsv?: () => void;
}

const FOUL_RADIUS_MULTIPLIER = 2;

function buildSmoothPath(points: { x: number; y: number }[]): string {
    if (points.length === 0) return '';
    if (points.length === 1) {
        const { x, y } = points[0];
        return `M ${x},${y} L ${x},${y}`;
    }
    const [first, ...rest] = points;
    const commands = [`M ${first.x},${first.y}`, ...rest.map(p => `L ${p.x},${p.y}`)];
    return commands.join(' ');
}

const buildProgressMap = (values: number[]) => {
    const unique = Array.from(new Set(values)).sort((a, b) => a - b);
    const denom = unique.length + 1;
    const map = new Map<number, number>();
    unique.forEach((value, idx) => map.set(value, (idx + 1) / denom));
    return { map, hasEntries: unique.length > 0 };
};

export function GoalFlowChart({
    events,
    selectedTeamId,
    opponentTeamId,
    secondHalfMarkSeconds,
    teamName,
    opponentName,
    onDownloadCsv,
}: GoalFlowChartProps) {
    const { t } = useSafeTranslation();
    // Extracting data shaping into a pure helper keeps the chart render focused on SVG/UX,
    // and lets us lock behavior with unit tests before changing visuals.
    const {
        teamSeries,
        opponentSeries,
        foulsByPosition,
        turnoversByPosition,
        savesByPosition,
        maxGoals,
    } = useMemo(
        () => buildGoalFlowData(events, selectedTeamId, opponentTeamId, secondHalfMarkSeconds),
        [events, opponentTeamId, secondHalfMarkSeconds, selectedTeamId]
    );

    const width = VIEWBOX_WIDTH - PADDING_LEFT - PADDING_RIGHT;
    const height = VIEWBOX_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

    const [showFouls, setShowFouls] = useState(true);
    const [showTurnovers, setShowTurnovers] = useState(true);
    const [showSaves, setShowSaves] = useState(true);

    const toX = (position: number) => PADDING_LEFT + position * width;
    const toY = (goals: number) => PADDING_TOP + height - (goals / (maxGoals || 1)) * height;

    const teamPath = buildSmoothPath(teamSeries.map(p => ({ x: toX(p.position), y: toY(p.value) })));
    const opponentPath = buildSmoothPath(opponentSeries.map(p => ({ x: toX(p.position), y: toY(p.value) })));

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

    const xTicks = useMemo(() => ([
        { position: (FIRST_SEGMENT[0] + FIRST_SEGMENT[1]) / 2, label: t('goalFlow.firstHalfLabel') },
        { position: HALF_BOUNDARY_POSITION, label: t('goalFlow.halfTimeLabel') },
        { position: (SECOND_SEGMENT[0] + SECOND_SEGMENT[1]) / 2, label: t('goalFlow.secondHalfLabel') },
        { position: 1, label: t('goalFlow.finalLabel') },
    ]), [t]);

    const getValueAtPosition = (series: SeriesPoint[], position: number) => {
        if (series.length === 0) return 0;
        let lastValue = series[0].value;
        for (const point of series) {
            if (point.position > position) break;
            lastValue = point.value;
        }
        return lastValue;
    };

    const scaleRadius = (count: number) => Math.min(26, 8 + Math.sqrt(count) * 6);
    const clampY = (y: number) =>
        Math.min(VIEWBOX_HEIGHT - PADDING_BOTTOM - 10, Math.max(PADDING_TOP + 10, y));

    const renderScoreLabels = (position: number) => {
        const teamValue = getValueAtPosition(teamSeries, position);
        const opponentValue = getValueAtPosition(opponentSeries, position);
        const x = toX(position);
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
                    <p className="text-sm text-gray-500">Cumulative goals per sequence, fouls received and turnovers</p>
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
                    className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${showFouls ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-gray-500 border-gray-200'
                        }`}
                >
                    {showFouls ? 'Hide fouls' : 'Show fouls'}
                </button>
                <button
                    type="button"
                    onClick={() => setShowTurnovers(v => !v)}
                    className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${showTurnovers ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-white text-gray-500 border-gray-200'
                        }`}
                >
                    {showTurnovers ? 'Hide turnovers' : 'Show turnovers'}
                </button>
                <button
                    type="button"
                    onClick={() => setShowSaves(v => !v)}
                    className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${showSaves ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-gray-500 border-gray-200'
                        }`}
                >
                    {showSaves ? 'Hide saves' : 'Show saves'}
                </button>
            </div>

            <div className="relative w-full" aria-label="Goal flow chart">
                <svg
                    viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
                    preserveAspectRatio="xMidYMin meet"
                    className="w-full h-[28rem]"
                >
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

                    <line
                        x1={toX(HALF_BOUNDARY_POSITION)}
                        x2={toX(HALF_BOUNDARY_POSITION)}
                        y1={PADDING_TOP}
                        y2={VIEWBOX_HEIGHT - PADDING_BOTTOM + 6}
                        stroke="#cbd5e1"
                        strokeDasharray="6 6"
                        strokeWidth={2}
                    />

                    <path
                        d={opponentPath}
                        fill="none"
                        stroke="rgba(99,102,241,0.35)"
                        strokeWidth={3}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                    />

                    <path
                        d={teamPath}
                        fill="none"
                        stroke="rgb(79,70,229)"
                        strokeWidth={4}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                    />

                    {foulsByPosition.map(({ position }, idx) => {
                        const value = getValueAtPosition(teamSeries, position);
                        const cx = toX(position);
                        const cy = toY(value);
                        const r = scaleRadius(1) * FOUL_RADIUS_MULTIPLIER;
                        return showFouls ? (
                            <g key={`foul-${idx}-${position}`}>
                                <title>Foul</title>
                                <circle
                                    cx={cx}
                                    cy={cy}
                                    r={r}
                                    fill="rgba(248,113,113,0.55)"
                                    stroke="rgba(239,68,68,0.8)"
                                    strokeWidth={1.5}
                                />
                            </g>
                        ) : null;
                    })}
                    {turnoversByPosition.map(({ position, count }, idx) => {
                        const value = getValueAtPosition(teamSeries, position);
                        const cx = toX(position);
                        const cy = toY(value);
                        const r = scaleRadius(count);
                        return showTurnovers ? (
                            <g key={`turnover-${idx}-${position}`}>
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
                    {savesByPosition.map(({ position, count }, idx) => {
                        const value = getValueAtPosition(teamSeries, position);
                        const cx = toX(position);
                        const cy = toY(value);
                        const r = scaleRadius(count);
                        return showSaves ? (
                            <g key={`save-${idx}-${position}`}>
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

                    {[HALF_BOUNDARY_POSITION, 1].map((pos, idx) => (
                        <g key={`label-${idx}-${pos}`}>{renderScoreLabels(pos)}</g>
                    ))}

                    {xTicks.map(({ position, label }, idx) => {
                        const x = toX(position);
                        return (
                            <g key={`tick-${idx}-${label}`}>
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
                                    {label}
                                </text>
                            </g>
                        );
                    })}

                    {yTicks.map((g) => {
                        const y = toY(g);
                        return (
                            <text
                                key={`y-${g}`}
                                x={PADDING_LEFT + 6}
                                y={y + 4}
                                textAnchor="start"
                                className="text-xs fill-gray-500"
                            >
                                {g}
                            </text>
                        );
                    })}
                </svg>
            </div>

            {onDownloadCsv && (
                <div className="flex justify-end pt-2 border-t border-gray-100">
                    <button
                        onClick={onDownloadCsv}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-gray-200 hover:border-indigo-200"
                    >
                        <Download className="w-4 h-4" />
                        Download CSV
                    </button>
                </div>
            )}

        </div>
    );
}
