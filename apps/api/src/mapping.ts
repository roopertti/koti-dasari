import type {
  CalendarEventTable,
  TodoTable,
  TransportDepartureTable,
  TransportStopTable,
  WeatherCurrentTable,
  WeatherHourlyTable,
} from '@home-dashboard/db';
import type { Selectable } from 'kysely';

type SnakeToCamel<S extends string> = S extends `${infer T}_${infer U}`
  ? `${T}${Capitalize<SnakeToCamel<U>>}`
  : S;

type CamelCaseKeys<T> = {
  [K in keyof T as K extends string ? SnakeToCamel<K> : K]: T[K];
};

export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

export function mapRow<T extends Record<string, unknown>>(row: T): CamelCaseKeys<T> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    result[snakeToCamel(key)] = value;
  }
  return result as CamelCaseKeys<T>;
}

function mapBooleans<T extends Record<string, unknown>>(row: T, fields: (keyof T)[]): T {
  const result = { ...row } as Record<string, unknown>;
  for (const field of fields) {
    if (field in result) {
      result[field as string] = result[field as string] === 1 || result[field as string] === true;
    }
  }
  return result as T;
}

export function mapEventRow(row: Selectable<CalendarEventTable>) {
  const mapped = mapRow(row);
  const { icalUid: _icalUid, ...rest } = mapped;
  return mapBooleans(rest, ['allDay']);
}

export function mapTodoRow(row: Selectable<TodoTable>) {
  const mapped = mapRow(row);
  return mapBooleans(mapped, ['completed']);
}

export function mapDepartureRow(row: Selectable<TransportDepartureTable>) {
  const mapped = mapRow(row);
  return mapBooleans(mapped, ['isRealtime']);
}

export function mapStopRow(row: Selectable<TransportStopTable>) {
  return mapRow(row);
}

export function mapWeatherCurrentRow(row: Selectable<WeatherCurrentTable>) {
  const { id: _, ...rest } = mapRow(row);
  return rest;
}

export function mapWeatherHourlyRow(row: Selectable<WeatherHourlyTable>) {
  const { id: _, fetchedAt: __, ...rest } = mapRow(row);
  return rest;
}
