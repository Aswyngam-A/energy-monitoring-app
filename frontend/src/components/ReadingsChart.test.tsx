// Tests for the readings chart. Recharts draws SVG whose exact shapes are not worth asserting on;
// what matters is that the chart is there when there is data and a message when there is none.
import { render, screen } from '@testing-library/react';
import ReadingsChart from './ReadingsChart';
import type { Reading } from '../api/readings';

const reading = (id: number, value: number, timestamp: string): Reading => ({
  id, value, timestamp, sensorId: 3, sensorName: 'Main meter',
});

test('shows a message instead of a chart when there are no readings', () => {
  render(<ReadingsChart readings={[]} />);

  expect(screen.getByText('No readings to chart')).toBeInTheDocument();
  expect(screen.queryByRole('img', { name: /readings chart/i })).not.toBeInTheDocument();
});

test('draws a chart labelled for screen readers when there are readings', () => {
  // The API returns newest first; the component must cope with that order.
  render(<ReadingsChart readings={[
    reading(2, 20, '2024-05-01T11:00:00Z'),
    reading(1, 10, '2024-05-01T10:00:00Z'),
  ]} />);

  expect(screen.getByRole('img', { name: /readings chart/i })).toBeInTheDocument();
  // Recharts renders an <svg> with a line path inside the figure.
  expect(document.querySelector('svg.recharts-surface')).toBeInTheDocument();
});
