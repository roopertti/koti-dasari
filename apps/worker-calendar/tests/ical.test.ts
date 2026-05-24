import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parseIcal } from '../src/ical.js';

const fixturePath = fileURLToPath(
  new URL('./fixtures/finnish-holidays-sample.ics', import.meta.url),
);
const fixture = await readFile(fixturePath, 'utf8');

describe('parseIcal', () => {
  it('parses a single-day all-day holiday into UTC-midnight DTSTART/DTEND', () => {
    const events = parseIcal(fixture);
    const vappu = events.find((e) => e.uid === '20260501_bbb@google.com');
    expect(vappu).toEqual({
      uid: '20260501_bbb@google.com',
      title: 'Vappu',
      description: 'Yleinen vapaapäivä',
      location: null,
      startTime: '2026-05-01T00:00:00.000Z',
      endTime: '2026-05-02T00:00:00.000Z',
      allDay: true,
    });
  });

  it('preserves multi-day all-day range as-is', () => {
    const events = parseIcal(fixture);
    const juhannus = events.find((e) => e.uid === '20260620_multiday@google.com');
    expect(juhannus?.allDay).toBe(true);
    expect(juhannus?.startTime).toBe('2026-06-20T00:00:00.000Z');
    expect(juhannus?.endTime).toBe('2026-06-22T00:00:00.000Z');
    expect(juhannus?.location).toBe('Suomi');
  });

  it('parses timed events keeping their explicit UTC instants', () => {
    const events = parseIcal(fixture);
    const timed = events.find((e) => e.uid === '20260315_timed@google.com');
    expect(timed).toEqual({
      uid: '20260315_timed@google.com',
      title: 'Ajastettu testitapahtuma',
      description: null,
      location: null,
      startTime: '2026-03-15T12:00:00.000Z',
      endTime: '2026-03-15T13:30:00.000Z',
      allDay: false,
    });
  });

  it('normalizes empty LOCATION to null', () => {
    const events = parseIcal(fixture);
    const uusivuosi = events.find((e) => e.uid === '20260101_aaa@google.com');
    expect(uusivuosi?.location).toBeNull();
  });

  it('skips VEVENTs that are missing required fields', () => {
    const events = parseIcal(fixture);
    const uids = events.map((e) => e.uid);
    expect(uids).not.toContain('20260315_missing_dtstart@google.com');
    expect(uids).not.toContain('20260401_no_summary@google.com');
  });

  it('returns one entry per valid VEVENT', () => {
    const events = parseIcal(fixture);
    // Fixture has 6 VEVENTs total, 2 of which are intentionally malformed.
    expect(events).toHaveLength(4);
  });

  it('returns an empty array for a calendar with no VEVENTs', () => {
    const empty = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//test//EN',
      'END:VCALENDAR',
      '',
    ].join('\r\n');
    expect(parseIcal(empty)).toEqual([]);
  });
});
