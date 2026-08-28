import { describe, expect, it } from 'vitest';
import { isAsleep, parseHm, type SleepSettings, withinWindow } from '../src/types/sleep.js';

describe('parseHm', () => {
  it('parses HH:MM into minutes since midnight', () => {
    expect(parseHm('00:00')).toBe(0);
    expect(parseHm('06:30')).toBe(390);
    expect(parseHm('23:59')).toBe(1439);
  });

  it('rejects malformed values', () => {
    expect(parseHm('24:00')).toBeNull();
    expect(parseHm('7:30')).toBeNull();
    expect(parseHm('12:60')).toBeNull();
    expect(parseHm('nope')).toBeNull();
  });
});

describe('withinWindow', () => {
  it('handles a same-day window', () => {
    expect(withinWindow(13 * 60, 9 * 60, 17 * 60)).toBe(true);
    expect(withinWindow(8 * 60, 9 * 60, 17 * 60)).toBe(false);
    expect(withinWindow(17 * 60, 9 * 60, 17 * 60)).toBe(false); // end is exclusive
  });

  it('handles a window crossing midnight', () => {
    const start = 23 * 60;
    const end = 6 * 60 + 30;
    expect(withinWindow(23 * 60 + 30, start, end)).toBe(true); // late night
    expect(withinWindow(2 * 60, start, end)).toBe(true); // early morning
    expect(withinWindow(6 * 60 + 30, start, end)).toBe(false); // exactly wake
    expect(withinWindow(12 * 60, start, end)).toBe(false); // midday
  });

  it('treats an equal start/end as never asleep', () => {
    expect(withinWindow(12 * 60, 8 * 60, 8 * 60)).toBe(false);
  });
});

const base: SleepSettings = {
  enabled: true,
  start: '23:00',
  end: '06:30',
  override: 'auto',
  overrideUntil: null,
};

// A fixed instant; the minute-of-day is supplied explicitly so the test is
// timezone-independent.
const NOW = new Date('2026-06-13T12:00:00.000Z');

describe('isAsleep', () => {
  it('follows the schedule when no override is active', () => {
    expect(isAsleep(NOW, 2 * 60, base)).toBe(true); // 02:00 inside window
    expect(isAsleep(NOW, 12 * 60, base)).toBe(false); // midday outside
  });

  it('never sleeps when disabled', () => {
    expect(isAsleep(NOW, 2 * 60, { ...base, enabled: false })).toBe(false);
  });

  it('honors a live wake override inside the window', () => {
    const future = new Date(NOW.getTime() + 60_000).toISOString();
    expect(isAsleep(NOW, 2 * 60, { ...base, override: 'wake', overrideUntil: future })).toBe(false);
  });

  it('honors a live sleep override outside the window', () => {
    const future = new Date(NOW.getTime() + 60_000).toISOString();
    expect(isAsleep(NOW, 12 * 60, { ...base, override: 'sleep', overrideUntil: future })).toBe(
      true,
    );
  });

  it('falls back to the schedule once the override has expired', () => {
    const past = new Date(NOW.getTime() - 60_000).toISOString();
    // Override says wake, but it expired → schedule (asleep at 02:00) wins.
    expect(isAsleep(NOW, 2 * 60, { ...base, override: 'wake', overrideUntil: past })).toBe(true);
  });
});
