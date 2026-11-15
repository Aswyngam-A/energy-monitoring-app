// Tests for the date helpers. They are pure functions, so no mocking is needed. Everything is UTC,
// which also means these tests give the same result whatever timezone the machine is set to.
import { formatTimestamp, utcInputToIso } from './dates';

describe('formatTimestamp', () => {
  test('shows an ISO instant as "YYYY-MM-DD HH:mm:ss" in UTC', () => {
    expect(formatTimestamp('2024-05-01T10:15:30Z')).toBe('2024-05-01 10:15:30');
  });

  test('ignores fractional seconds', () => {
    expect(formatTimestamp('2024-05-01T10:15:30.123456Z')).toBe('2024-05-01 10:15:30');
  });

  test('returns the original text when it is not a valid date', () => {
    expect(formatTimestamp('not a date')).toBe('not a date');
  });
});

describe('utcInputToIso', () => {
  test('reads a datetime-local value as UTC and returns an ISO instant', () => {
    expect(utcInputToIso('2024-05-01T10:00')).toBe('2024-05-01T10:00:00.000Z');
  });

  test('keeps seconds when the input has them', () => {
    expect(utcInputToIso('2024-05-01T10:00:30')).toBe('2024-05-01T10:00:30.000Z');
  });

  test('returns an empty string for an empty input (no bound)', () => {
    expect(utcInputToIso('')).toBe('');
  });

  test('returns null for a value that is not a date', () => {
    expect(utcInputToIso('2024-13-45T99:99')).toBeNull();
  });
});
