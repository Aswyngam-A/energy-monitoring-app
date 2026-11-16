import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Reading } from '../api/readings';
import { formatTimestamp } from '../utils/dates';

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
  if (readings.length === 0) return <p>No readings to chart</p>;

  // Oldest first, with the label the X axis and the tooltip show.
  const data = [...readings].reverse().map((reading) => ({
    time: formatTimestamp(reading.timestamp),
    value: reading.value,
  }));

  return (
    // role="img" + aria-label: the SVG is not readable by screen readers, so the figure names it.
    <figure role="img" aria-label="Readings chart" style={{ margin: 0 }}>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" tick={{ fontSize: 11 }} />
          <YAxis unit=" kW" width={70} />
          <Tooltip />
          <Line type="monotone" dataKey="value" name="Value (kW)" stroke="#2563eb" dot={data.length < 30} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </figure>
  );
}
