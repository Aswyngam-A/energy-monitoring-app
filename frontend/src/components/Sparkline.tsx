// Width/height of the drawing area in SVG units. The element itself stretches to the tile's width
// (preserveAspectRatio="none"), so only the proportions matter.
const W = 120;
const H = 28;
const PAD = 2; // keeps the stroke from being clipped at the edges

interface SparklineProps {
  /** Values in time order, oldest first. */
  values: number[];
  /** Optional limit, drawn as a dashed horizontal line on the same scale. */
  threshold?: number;
}

/**
 * A tiny line chart with no axes or labels: the shape of the last few values at a glance, for the
 * dashboard tiles. Drawn by hand as SVG (a full chart library for a 28 px strip would be heavy).
 *
 * The scale starts at 0 and ends just above the higher of the largest value and the threshold, so
 * the distance between the line and the dashed threshold is honest: a steady load stays steady
 * instead of being stretched into dramatic swings. Fewer than two values draw nothing.
 */
export default function Sparkline({ values, threshold }: SparklineProps) {
  if (values.length < 2) return null;

  const top = Math.max(...values, threshold ?? 0) * 1.05 || 1; // `|| 1`: all-zero data
  const y = (value: number) => H - PAD - (value / top) * (H - 2 * PAD);
  const points = values
    .map((value, i) => `${((i / (values.length - 1)) * W).toFixed(1)},${y(value).toFixed(1)}`)
    .join(' ');

  return (
    // role="img" + aria-label: a screen reader cannot read a drawing, so it gets this sentence.
    <svg className="sparkline" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img"
      aria-label={`Trend of the last ${values.length} readings`}>
      {threshold !== undefined && (
        <line data-testid="sparkline-threshold" className="sparkline-threshold"
          x1="0" x2={W} y1={y(threshold)} y2={y(threshold)} />
      )}
      <polyline data-testid="sparkline-line" className="sparkline-line" points={points} />
    </svg>
  );
}
