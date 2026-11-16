// Tests for the readings chart. Recharts draws SVG whose exact shapes are not worth asserting on;
// what matters is that the chart is there when there is data and a message when there is none.
import { render, screen } from '@testing-library/react';
import ReadingsChart from './ReadingsChart';
import type { Reading } from '../api/readings';

// jsdom has no layout, so every element measures 0 x 0 and ResponsiveContainer would draw nothing.
// Pretend the container is 600 x 260 px; restored after each test.
beforeEach(() => {
  jest.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    width: 600, height: 260, top: 0, left: 0, right: 600, bottom: 260, x: 0, y: 0, toJSON: () => ({}),
  });
});
afterEach(() => {
  jest.restoreAllMocks();
});

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

// Polish item 2: the chart used to be a fixed 600 px wide. It must now follow its container.
test('is wrapped in a responsive container that fills the available width', () => {
  render(<ReadingsChart readings={[reading(1, 10, '2024-05-01T10:00:00Z')]} />);

  const container = document.querySelector<HTMLElement>('.recharts-responsive-container');
  expect(container).toBeInTheDocument();
  expect(container).toHaveStyle({ width: '100%' });
  // With a measured size the chart is drawn inside it.
  expect(document.querySelector('svg.recharts-surface')).toBeInTheDocument();
});

// ---- Threshold line ----

test('draws a labelled threshold line when a threshold is given', () => {
  render(<ReadingsChart threshold={100} readings={[reading(1, 10, '2024-05-01T10:00:00Z')]} />);

  expect(document.querySelector('.recharts-reference-line')).toBeInTheDocument();
  expect(screen.getByText('Threshold 100 kW')).toBeInTheDocument();
});

test('draws no threshold line without a threshold', () => {
  render(<ReadingsChart readings={[reading(1, 10, '2024-05-01T10:00:00Z')]} />);

  expect(document.querySelector('.recharts-reference-line')).not.toBeInTheDocument();
});
