// Tests for the tile sparkline: a tiny line of recent values, optionally with the threshold as a
// dashed reference. It is drawn by hand as SVG, so these tests can look at the actual geometry.
import { render, screen } from '@testing-library/react';
import Sparkline from './Sparkline';

/** The y of every point of the drawn line, in order. */
function ys(): number[] {
  const points = screen.getByTestId('sparkline-line').getAttribute('points')!;
  return points.split(' ').map((pair) => Number(pair.split(',')[1]));
}

test('draws nothing for fewer than two values (a line needs two points)', () => {
  const { container } = render(<Sparkline values={[5]} />);

  expect(container).toBeEmptyDOMElement();
});

test('is an image with a text alternative that says how many readings it covers', () => {
  render(<Sparkline values={[1, 2, 3]} />);

  expect(screen.getByRole('img', { name: 'Trend of the last 3 readings' })).toBeInTheDocument();
});

test('draws one point per value, and a higher value is higher on screen (smaller y)', () => {
  render(<Sparkline values={[10, 30, 20]} />);

  const [first, second, third] = ys();
  expect(ys()).toHaveLength(3);
  expect(second).toBeLessThan(third);
  expect(third).toBeLessThan(first);
});

test('draws a dashed threshold line only when a threshold is given', () => {
  const { rerender } = render(<Sparkline values={[10, 20]} />);
  expect(screen.queryByTestId('sparkline-threshold')).not.toBeInTheDocument();

  rerender(<Sparkline values={[10, 20]} threshold={40} />);
  expect(screen.getByTestId('sparkline-threshold')).toBeInTheDocument();
});

test('the threshold line is above the data when every value is below the threshold', () => {
  render(<Sparkline values={[10, 20]} threshold={40} />);

  const lineY = Number(screen.getByTestId('sparkline-threshold').getAttribute('y1'));
  expect(lineY).toBeLessThan(Math.min(...ys()));
});
