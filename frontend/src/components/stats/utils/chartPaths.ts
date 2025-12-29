export type ChartPoint = { x: number; y: number };

export const buildLinePath = (points: ChartPoint[]): string => {
  if (points.length === 0) return '';
  if (points.length === 1) {
    const { x, y } = points[0];
    return `M ${x},${y} L ${x},${y}`;
  }
  const [first, ...rest] = points;
  const commands = [`M ${first.x},${first.y}`, ...rest.map(p => `L ${p.x},${p.y}`)];
  return commands.join(' ');
};

export const buildSmoothPath = (points: ChartPoint[]): string => {
  if (points.length === 0) return '';
  if (points.length < 3) return buildLinePath(points);

  const commands = [`M ${points[0].x},${points[0].y}`];
  for (let i = 0; i < points.length - 1; i++) {
    const prev = points[i - 1] ?? points[i];
    const current = points[i];
    const next = points[i + 1];
    const nextNext = points[i + 2] ?? next;

    const cp1x = current.x + (next.x - prev.x) / 6;
    const cp1y = current.y + (next.y - prev.y) / 6;
    const cp2x = next.x - (nextNext.x - current.x) / 6;
    const cp2y = next.y - (nextNext.y - current.y) / 6;

    commands.push(`C ${cp1x},${cp1y} ${cp2x},${cp2y} ${next.x},${next.y}`);
  }

  return commands.join(' ');
};
