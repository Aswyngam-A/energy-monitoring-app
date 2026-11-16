import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Reading } from '../api/readings';
import { formatTimestamp } from '../utils/dates';

// Chart text and tooltip share the UI's mono face and muted ink.
const AXIS_TICK = { fontSize: 11, fill: 'var(--muted)', fontFamily: 'var(--mono)' };
const TOOLTIP_STYLE = {
  background: 'var(--surface)', border: '1px solid var(--rule-strong)', borderRadius: 2,
  fontFamily: 'var(--mono)', fontSize: 12, boxShadow: 'none',
};

/**
 * Line chart of readings over time (Recharts). Pass the readings as the API returns them, newest
 * first: the chart reverses them so time runs from left to right. Times are UTC, like everywhere
 * else in the UI.
 *
 * Responsive: ResponsiveContainer measures its parent (width 100%, fixed height) and redraws the
 * chart when the parent is resized. jsdom (the test environment) has no layout, so it measures 0
 * and draws nothing: the tests fake the measured size (see ReadingsChart.test.tsx).
 */
export default function ReadingsChart({ readings }: { readings: Reading[] }) {
  if (readings.length === 0) return <p className="muted">No readings to chart</p>;

  // Oldest first, with the label the X axis and the tooltip show.
  const data = [...readings].reverse().map((reading) => ({
    time: formatTimestamp(reading.timestamp),
    value: reading.value,
  }));

  return (
    // role="img" + aria-label: the SVG is not readable by screen readers, so the figure names it.
    <figure role="img" aria-label="Readings chart" className="chart">
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data}>
          {/* Colours are the theme's CSS variables, so the chart follows light/dark automatically.
              Horizontal hairlines only: the ledger look has no boxed grid. */}
          <CartesianGrid vertical={false} stroke="var(--rule)" />
          <XAxis dataKey="time" tick={AXIS_TICK} stroke="var(--rule-strong)" tickLine={false} />
          <YAxis unit=" kW" width={70} tick={AXIS_TICK} stroke="var(--rule-strong)" tickLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: 'var(--muted)' }} cursor={{ stroke: 'var(--rule-strong)' }} />
          <Line type="linear" dataKey="value" name="Value (kW)" stroke="var(--accent)" strokeWidth={1.5} dot={data.length < 30 ? { r: 2, fill: 'var(--accent)', strokeWidth: 0 } : false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </figure>
  );
}
