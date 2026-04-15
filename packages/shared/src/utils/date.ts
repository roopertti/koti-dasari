/**
 * Convert Digitransit departure time (seconds since midnight) and service day
 * to a Date object.
 */
export function departureToDate(serviceDay: string, secondsSinceMidnight: number): Date {
  const base = new Date(`${serviceDay}T00:00:00`);
  return new Date(base.getTime() + secondsSinceMidnight * 1000);
}

/**
 * Format seconds since midnight as HH:MM.
 */
export function formatDepartureTime(secondsSinceMidnight: number): string {
  const hours = Math.floor(secondsSinceMidnight / 3600) % 24;
  const minutes = Math.floor((secondsSinceMidnight % 3600) / 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}
