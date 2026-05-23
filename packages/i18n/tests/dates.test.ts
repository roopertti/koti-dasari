import { describe, expect, it } from 'vitest';
import {
  departureToDate,
  diffDays,
  formatDepartureTime,
  horizonFromOffset,
  parseEventStart,
  parseLocalDate,
  startOfLocalDay,
} from '../src/dates.js';

describe('startOfLocalDay', () => {
  it('strips the time component, leaving local midnight', () => {
    const result = startOfLocalDay(new Date(2026, 4, 22, 13, 45, 17, 500));
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(4);
    expect(result.getDate()).toBe(22);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
  });

  it('is idempotent — calling twice yields the same instant', () => {
    const once = startOfLocalDay(new Date(2026, 4, 22, 13, 45));
    const twice = startOfLocalDay(once);
    expect(twice.getTime()).toBe(once.getTime());
  });
});

describe('diffDays', () => {
  it('returns 0 for the same calendar day, regardless of time', () => {
    const a = new Date(2026, 4, 22, 23, 59, 59);
    const b = new Date(2026, 4, 22, 0, 0, 1);
    expect(diffDays(a, b)).toBe(0);
  });

  it('returns positive when target is after base', () => {
    expect(diffDays(new Date(2026, 4, 25), new Date(2026, 4, 22))).toBe(3);
  });

  it('returns negative when target is before base', () => {
    expect(diffDays(new Date(2026, 4, 20), new Date(2026, 4, 22))).toBe(-2);
  });

  it('handles month boundaries', () => {
    expect(diffDays(new Date(2026, 5, 1), new Date(2026, 4, 31))).toBe(1);
  });

  it('handles year boundaries', () => {
    expect(diffDays(new Date(2027, 0, 1), new Date(2026, 11, 31))).toBe(1);
  });
});

describe('parseLocalDate', () => {
  it('parses YYYY-MM-DD as local midnight', () => {
    const result = parseLocalDate('2026-05-22');
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(4);
    expect(result.getDate()).toBe(22);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
  });

  it('ignores characters past the first 10 (accepts full ISO timestamps)', () => {
    const fromDateOnly = parseLocalDate('2026-05-22');
    const fromIso = parseLocalDate('2026-05-22T17:30:00Z');
    expect(fromIso.getTime()).toBe(fromDateOnly.getTime());
  });
});

describe('parseEventStart', () => {
  it('anchors all-day events at local midnight on their start date', () => {
    const result = parseEventStart({ allDay: true, startTime: '2026-05-22T15:00:00Z' });
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(4);
    expect(result.getDate()).toBe(22);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
  });

  it('passes through the ISO instant for timed events', () => {
    const iso = '2026-05-22T15:30:00Z';
    const result = parseEventStart({ allDay: false, startTime: iso });
    expect(result.getTime()).toBe(new Date(iso).getTime());
  });
});

describe('horizonFromOffset', () => {
  it('maps any negative offset to overdue', () => {
    expect(horizonFromOffset(-1)).toBe('overdue');
    expect(horizonFromOffset(-100)).toBe('overdue');
  });

  it('maps 0 to today', () => {
    expect(horizonFromOffset(0)).toBe('today');
  });

  it('maps 1 to tomorrow', () => {
    expect(horizonFromOffset(1)).toBe('tomorrow');
  });

  it('maps 2 through soonDays (default 7) to thisWeek', () => {
    expect(horizonFromOffset(2)).toBe('thisWeek');
    expect(horizonFromOffset(7)).toBe('thisWeek');
  });

  it('returns null when offset exceeds soonDays', () => {
    expect(horizonFromOffset(8)).toBeNull();
    expect(horizonFromOffset(365)).toBeNull();
  });

  it('honors a custom soonDays cutoff', () => {
    expect(horizonFromOffset(3, 2)).toBeNull();
    expect(horizonFromOffset(2, 2)).toBe('thisWeek');
    expect(horizonFromOffset(14, 14)).toBe('thisWeek');
  });
});

describe('departureToDate', () => {
  it('returns local midnight when seconds=0', () => {
    const result = departureToDate('2026-05-22', 0);
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(4);
    expect(result.getDate()).toBe(22);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
  });

  it('adds seconds-since-midnight to the service day', () => {
    // 13:45:30 → 13*3600 + 45*60 + 30 = 49530
    const result = departureToDate('2026-05-22', 49_530);
    expect(result.getHours()).toBe(13);
    expect(result.getMinutes()).toBe(45);
    expect(result.getSeconds()).toBe(30);
  });

  it('handles after-midnight transit times by rolling into the next day', () => {
    // 25:15 → 25*3600 + 15*60 = 90900 → 01:15 on the following day
    const result = departureToDate('2026-05-22', 90_900);
    expect(result.getDate()).toBe(23);
    expect(result.getHours()).toBe(1);
    expect(result.getMinutes()).toBe(15);
  });
});

describe('formatDepartureTime', () => {
  it('formats midnight as 00:00', () => {
    expect(formatDepartureTime(0)).toBe('00:00');
  });

  it('zero-pads single-digit hours and minutes', () => {
    expect(formatDepartureTime(9 * 3600 + 5 * 60)).toBe('09:05');
  });

  it('formats afternoon times in 24h', () => {
    expect(formatDepartureTime(13 * 3600 + 45 * 60)).toBe('13:45');
  });

  it('wraps after-midnight transit times modulo 24h', () => {
    expect(formatDepartureTime(25 * 3600 + 15 * 60)).toBe('01:15');
  });

  it('truncates fractional seconds rather than rounding', () => {
    expect(formatDepartureTime(59)).toBe('00:00');
    expect(formatDepartureTime(60)).toBe('00:01');
  });
});
