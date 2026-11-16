// Tests for usePolling: calls a function every N ms while mounted, skips ticks while the tab is
// hidden, stops on unmount, and always calls the latest version of the function.
import { act, renderHook } from '@testing-library/react';
import { POLL_INTERVAL_MS, usePolling } from './usePolling';

beforeEach(() => {
  // Fake clock: tests move time forward by hand instead of really waiting 30 seconds.
  jest.useFakeTimers();
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

/** Pretends the tab is hidden / visible (jsdom's document is always visible by default). */
function setHidden(hidden: boolean) {
  jest.spyOn(document, 'hidden', 'get').mockReturnValue(hidden);
}

test('the default interval is 30 seconds', () => {
  expect(POLL_INTERVAL_MS).toBe(30_000);
});

test('calls the function every interval, not before', () => {
  const callback = jest.fn();
  renderHook(() => { usePolling(callback, 1000); });

  act(() => { jest.advanceTimersByTime(999); });
  expect(callback).not.toHaveBeenCalled();
  act(() => { jest.advanceTimersByTime(1); });
  expect(callback).toHaveBeenCalledTimes(1);
  act(() => { jest.advanceTimersByTime(2000); });
  expect(callback).toHaveBeenCalledTimes(3);
});

test('skips the tick while the tab is hidden and resumes when it is visible again', () => {
  const callback = jest.fn();
  renderHook(() => { usePolling(callback, 1000); });

  setHidden(true);
  act(() => { jest.advanceTimersByTime(3000); });
  expect(callback).not.toHaveBeenCalled();

  setHidden(false);
  act(() => { jest.advanceTimersByTime(1000); });
  expect(callback).toHaveBeenCalledTimes(1);
});

test('stops when the component unmounts', () => {
  const callback = jest.fn();
  const { unmount } = renderHook(() => { usePolling(callback, 1000); });

  unmount();
  act(() => { jest.advanceTimersByTime(5000); });
  expect(callback).not.toHaveBeenCalled();
});

test('calls the latest function after a re-render, without restarting the timer', () => {
  const first = jest.fn();
  const second = jest.fn();
  const { rerender } = renderHook(({ fn }) => { usePolling(fn, 1000); }, { initialProps: { fn: first } });

  act(() => { jest.advanceTimersByTime(600); });
  rerender({ fn: second });
  // 400 ms later the ORIGINAL timer fires: it was not reset by the re-render.
  act(() => { jest.advanceTimersByTime(400); });

  expect(first).not.toHaveBeenCalled();
  expect(second).toHaveBeenCalledTimes(1);
});
