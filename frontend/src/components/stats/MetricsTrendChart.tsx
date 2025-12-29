import { useMemo, useRef, useState, type MouseEvent } from 'react';
import { TrendingUp } from 'lucide-react';
import type { MetricsTrendData, MetricsTrendPoint } from './types';
import {
  VIEWBOX_HEIGHT,
  VIEWBOX_WIDTH,
  PADDING_BOTTOM,
  PADDING_LEFT,
  PADDING_RIGHT,
  PADDING_TOP,
} from './goalFlowData';
import { buildSmoothPath } from './utils/chartPaths';

type SeriesConfig = {
  key: keyof MetricsTrendPoint['metrics'];
  label: string;
  color: string;
  axis: 'percent' | 'plays';
  strokeDasharray?: string;
  strokeWidth?: number;
};

const SERIES: SeriesConfig[] = [
  { key: 'goalsVsShots', label: 'Goals vs shots', color: '#16a34a', axis: 'percent' },
  { key: 'goalsVsPlays', label: 'Goals vs plays', color: '#22c55e', axis: 'percent' },
  { key: 'missesVsPlays', label: 'Misses vs plays', color: '#f97316', axis: 'percent' },
  { key: 'turnoversVsPlays', label: 'Turnovers vs plays', color: '#eab308', axis: 'percent' },
  { key: 'foulsVsPlays', label: 'Fouls vs plays', color: '#64748b', axis: 'percent' },
  { key: 'plays', label: 'Plays', color: '#4f46e5', axis: 'plays', strokeDasharray: '6 6', strokeWidth: 3.5 },
];

const PERCENT_TICKS = [0, 25, 50, 75, 100];

const buildSegments = (
  points: MetricsTrendPoint[],
  toX: (index: number) => number,
  toY: (value: number) => number,
  pickValue: (point: MetricsTrendPoint) => number | null
) => {
  const segments: Array<Array<{ x: number; y: number }>> = [];
  let current: Array<{ x: number; y: number }> = [];

  points.forEach((point, index) => {
    const value = pickValue(point);
    if (value == null || Number.isNaN(value)) {
      if (current.length > 0) {
        segments.push(current);
        current = [];
      }
      return;
    }
    current.push({ x: toX(index), y: toY(value) });
  });

  if (current.length > 0) segments.push(current);
  return segments;
};

const buildPlaysTicks = (maxPlays: number) => {
  if (maxPlays <= 0) return [0];
  const step = Math.max(1, Math.ceil(maxPlays / 4));
  const ticks: number[] = [];
  for (let value = 0; value <= maxPlays; value += step) {
    ticks.push(value);
  }
  if (ticks[ticks.length - 1] !== maxPlays) ticks.push(maxPlays);
  return ticks;
};

export function MetricsTrendChart({
  data,
  highlightMatchId,
  contextLabel,
  subtitle,
}: {
  data: MetricsTrendData;
  highlightMatchId?: string | null;
  contextLabel?: string;
  subtitle?: string;
}) {
  const resolvedSubtitle = subtitle ?? 'Current season per match';
  const points = data.points;
  const width = VIEWBOX_WIDTH - PADDING_LEFT - PADDING_RIGHT;
  const height = VIEWBOX_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const percentSeriesKeys = SERIES.filter(series => series.axis === 'percent').map(series => series.key);
  const [visibleSeries, setVisibleSeries] = useState<Set<SeriesConfig['key']>>(
    () => new Set(percentSeriesKeys)
  );
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const maxPlays = useMemo(() => (
    points.reduce((max, point) => Math.max(max, point.metrics.plays), 0)
  ), [points]);

  const playsTicks = useMemo(() => buildPlaysTicks(maxPlays), [maxPlays]);

  const toX = (index: number) => {
    if (points.length <= 1) return PADDING_LEFT + width * 0.5;
    return PADDING_LEFT + (index / (points.length - 1)) * width;
  };
  const toPercentY = (value: number) => PADDING_TOP + height - (value / 100) * height;
  const toPlaysY = (value: number) => {
    if (maxPlays <= 0) return PADDING_TOP + height;
    return PADDING_TOP + height - (value / maxPlays) * height;
  };

  const labelStep = Math.max(1, Math.ceil(points.length / 8));
  const currentSeasonStartIndex = points.findIndex(
    point => point.kind === 'match' && point.seasonId && point.seasonId === data.currentSeasonId
  );

  const toggleSeries = (key: SeriesConfig['key']) => {
    setVisibleSeries((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const hoveredPoint = hoveredIndex != null ? points[hoveredIndex] : null;
  const formatValue = (series: SeriesConfig, value: number | null) => {
    if (value == null || Number.isNaN(value)) return '—';
    if (series.axis === 'plays') return Math.round(value).toString();
    return `${Math.round(value)}%`;
  };

  const handleMouseMove = (event: MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current || points.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = event.clientX - rect.left;
    const relativeY = event.clientY - rect.top;
    const chartX = (relativeX / rect.width) * VIEWBOX_WIDTH;
    const clamped = Math.min(
      Math.max(chartX, PADDING_LEFT),
      VIEWBOX_WIDTH - PADDING_RIGHT,
    );
    const index = points.length === 1
      ? 0
      : Math.round(((clamped - PADDING_LEFT) / width) * (points.length - 1));
    const safeIndex = Math.min(Math.max(index, 0), points.length - 1);
    setHoveredIndex(safeIndex);
    setHoverPosition({ x: relativeX, y: relativeY });
  };

  const clearHover = () => {
    setHoveredIndex(null);
    setHoverPosition(null);
  };

  const hoveredSeries = useMemo(() => {
    if (!hoveredPoint || !hoverPosition || !containerRef.current) return [];
    const rect = containerRef.current.getBoundingClientRect();
    const chartY = (hoverPosition.y / rect.height) * VIEWBOX_HEIGHT;
    const threshold = 12;

    return SERIES.reduce<Array<{ series: SeriesConfig; value: number; y: number }>>((acc, series) => {
      if (series.axis === 'percent' && !visibleSeries.has(series.key)) return acc;
      const value = hoveredPoint.metrics[series.key] as number | null;
      if (value == null || Number.isNaN(value)) return acc;
      const y = series.axis === 'percent' ? toPercentY(value) : toPlaysY(value);
      if (Math.abs(y - chartY) <= threshold) {
        acc.push({ series, value, y });
      }
      return acc;
    }, []);
  }, [hoverPosition, hoveredPoint, visibleSeries, toPercentY, toPlaysY]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 text-indigo-600">
          <TrendingUp className="w-4 h-4" aria-hidden />
        </span>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            Metric evolution
            {contextLabel ? (
              <span className="font-normal text-gray-600"> - {contextLabel}</span>
            ) : null}
          </h3>
          <p className="text-sm text-gray-500">{resolvedSubtitle}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-gray-600">
        {SERIES.map((series) => {
          const isPlays = series.key === 'plays';
          const isVisible = isPlays || visibleSeries.has(series.key);
          return (
            <button
              key={series.key}
              type="button"
              onClick={() => !isPlays && toggleSeries(series.key)}
              disabled={isPlays}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 transition-colors ${
                isPlays
                  ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                  : isVisible
                    ? 'border-slate-200 bg-white text-slate-700'
                    : 'border-slate-200 bg-slate-50 text-slate-400'
              }`}
            >
              <span
                className="inline-flex w-4 h-0.5 rounded-full"
                style={{
                  backgroundColor: series.color,
                  opacity: isVisible ? 1 : 0.35,
                  height: series.strokeWidth ? `${series.strokeWidth}px` : '2px',
                }}
              />
              <span>{series.label}</span>
            </button>
          );
        })}
      </div>

      <div ref={containerRef} className="relative w-full" aria-label="Metrics trend chart">
        <svg
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          preserveAspectRatio="xMidYMin meet"
          className="w-full h-[22rem] md:h-[26rem]"
          onMouseMove={handleMouseMove}
          onMouseLeave={clearHover}
        >
          {PERCENT_TICKS.map((tick) => {
            const y = toPercentY(tick);
            return (
              <g key={`percent-${tick}`}>
                <line
                  x1={PADDING_LEFT}
                  x2={VIEWBOX_WIDTH - PADDING_RIGHT}
                  y1={y}
                  y2={y}
                  stroke="#eef2f7"
                  strokeWidth={1}
                />
                <text
                  x={PADDING_LEFT - 6}
                  y={y - 4}
                  textAnchor="end"
                  className="text-[13px]"
                  fill="#94a3b8"
                >
                  {tick}%
                </text>
              </g>
            );
          })}

          {points.map((_, index) => (
            <line
              key={`x-${index}`}
              x1={toX(index)}
              x2={toX(index)}
              y1={PADDING_TOP}
              y2={VIEWBOX_HEIGHT - PADDING_BOTTOM}
              stroke="#eef2f7"
              strokeWidth={1}
            />
          ))}

          {playsTicks.map((tick) => {
            const y = toPlaysY(tick);
            return (
              <text
                key={`plays-${tick}`}
                x={VIEWBOX_WIDTH - PADDING_RIGHT + 6}
                y={y - 4}
                textAnchor="start"
                className="text-[13px]"
                fill="#94a3b8"
              >
                {tick}
              </text>
            );
          })}

          {hoveredPoint && (
            <line
              x1={toX(hoveredIndex ?? 0)}
              x2={toX(hoveredIndex ?? 0)}
              y1={PADDING_TOP}
              y2={VIEWBOX_HEIGHT - PADDING_BOTTOM}
              stroke="#e2e8f0"
              strokeWidth={1}
            />
          )}

          {currentSeasonStartIndex > 0 && (
            <line
              x1={toX(currentSeasonStartIndex)}
              x2={toX(currentSeasonStartIndex)}
              y1={PADDING_TOP}
              y2={VIEWBOX_HEIGHT - PADDING_BOTTOM + 12}
              stroke="#e2e8f0"
              strokeDasharray="5 6"
              strokeWidth={1.5}
            />
          )}

          {SERIES.map((series) => {
            if (series.axis === 'percent' && !visibleSeries.has(series.key)) {
              return null;
            }
            const toY = series.axis === 'percent' ? toPercentY : toPlaysY;
            const segments = buildSegments(
              points,
              toX,
              toY,
              (point) => point.metrics[series.key] as number | null
            );
            return segments.map((segment, index) => (
              <path
                key={`${series.key}-${index}`}
                d={buildSmoothPath(segment)}
                fill="none"
                stroke={series.color}
                strokeWidth={series.strokeWidth ?? 2}
                strokeLinejoin="round"
                strokeDasharray={series.strokeDasharray}
                strokeLinecap="round"
              />
            ));
          })}

          {hoveredPoint && hoveredSeries.length > 0 && (
            <g>
              {hoveredSeries.map(({ series, value, y }) => (
                <circle
                  key={`hover-${series.key}`}
                  cx={toX(hoveredIndex ?? 0)}
                  cy={y}
                  r={series.axis === 'plays' ? 4 : 3.5}
                  fill={series.color}
                  stroke="#ffffff"
                  strokeWidth={1.5}
                />
              ))}
            </g>
          )}

          {points.map((point, index) => (
            <g key={`${point.id}-plays`}>
              <circle
                cx={toX(index)}
                cy={toPlaysY(point.metrics.plays)}
                r={point.kind === 'season' ? 4 : 2.5}
                fill="#4f46e5"
                stroke={point.kind === 'season' ? '#1e1b4b' : 'none'}
                strokeWidth={point.kind === 'season' ? 1 : 0}
              />
            </g>
          ))}

          {points.map((point, index) => {
            const shouldLabel = point.kind === 'season' || index % labelStep === 0 || index === points.length - 1;
            if (!shouldLabel) return null;
            const x = toX(index);
            const y = VIEWBOX_HEIGHT - PADDING_BOTTOM + 14;
            const isHighlighted = point.kind === 'match' && highlightMatchId && point.id === highlightMatchId;
            const [primaryLabel, secondaryLabel] = point.kind === 'season'
              ? [point.label, '']
              : point.label.split(' • ');
            return (
              <g key={`${point.id}-label`}>
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  className={`text-[11px] ${point.kind === 'season' || isHighlighted ? 'font-semibold' : ''}`}
                  fill={
                    point.kind === 'season'
                      ? '#334155'
                      : isHighlighted
                        ? '#111827'
                        : '#64748b'
                  }
                  transform={`rotate(-30 ${x} ${y})`}
                >
                  {primaryLabel}
                </text>
                {secondaryLabel ? (
                  <text
                    x={x}
                    y={y + 14}
                    textAnchor="middle"
                    className="text-[10px]"
                    fill={isHighlighted ? '#4b5563' : '#94a3b8'}
                    transform={`rotate(-30 ${x} ${y + 14})`}
                  >
                    {secondaryLabel}
                  </text>
                ) : null}
              </g>
            );
          })}

        </svg>
        {hoveredPoint && hoverPosition && hoveredSeries.length > 0 && (
          <div
            className="pointer-events-none absolute z-10 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs text-slate-700 shadow-sm"
            style={{
              left: Math.min(hoverPosition.x + 16, (containerRef.current?.clientWidth ?? 0) - 180),
              top: Math.max(hoverPosition.y - 24, 8),
            }}
          >
            <div className="text-[11px] font-semibold text-slate-700">{hoveredPoint.label}</div>
            <div className="mt-1 space-y-0.5">
              {hoveredSeries.map(({ series, value }) => (
                <div key={series.key} className="flex items-center gap-2">
                  <span
                    className="inline-flex h-2 w-2 rounded-full"
                    style={{ backgroundColor: series.color }}
                  />
                  <span className="text-[11px] text-slate-500">{series.label}</span>
                  <span className="ml-auto text-[11px] font-semibold text-slate-700">
                    {formatValue(series, value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
