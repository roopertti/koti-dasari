import { LOCALE, TIMEZONE } from './locale.js';

export const timeHm = new Intl.DateTimeFormat(LOCALE, {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export const hourShort = new Intl.DateTimeFormat(LOCALE, {
  hour: '2-digit',
  hour12: false,
});

export const weekdayShort = new Intl.DateTimeFormat(LOCALE, {
  weekday: 'short',
});

export const dayHeader = new Intl.DateTimeFormat(LOCALE, {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

export const dateLong = new Intl.DateTimeFormat(LOCALE, {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

export const dueDateShort = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'short',
});

export const dateMediumTimeShort = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

// en-CA's date shape is YYYY-MM-DD, which we use as a sortable/comparable
// "day in Helsinki" key — independent of where the host runs.
export const helsinkiDayKey = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

// Numeric hour-of-day in Helsinki, also runtime-TZ-independent.
export const helsinkiHour24 = new Intl.DateTimeFormat('en-US', {
  timeZone: TIMEZONE,
  hour: 'numeric',
  hour12: false,
});
