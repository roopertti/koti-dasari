import type { Database } from '@home-dashboard/db';
import type { Kysely } from 'kysely';
import {
  type Departure,
  fetchDepartures,
  fetchNearbyStops,
  type NearbyStop,
} from './digitransit.js';

export interface TransportSchedulerConfig {
  db: Kysely<Database>;
  apiKey: string;
  latitude: number;
  longitude: number;
  radius: number;
  intervalMs: number;
}

export function startScheduler(config: TransportSchedulerConfig): () => void {
  const { db, apiKey, latitude, longitude, radius, intervalMs } = config;
  let timer: ReturnType<typeof setInterval> | null = null;
  let running = false;

  async function tick() {
    if (running) {
      return;
    }
    running = true;

    try {
      console.log('[transport] Fetching nearby stops...');
      const stops = await fetchNearbyStops(apiKey, latitude, longitude, radius);
      console.log(`[transport] Found ${stops.length} stops`);

      await upsertStops(db, stops);

      console.log('[transport] Fetching departures...');
      const allDepartures: Departure[] = [];
      for (const stop of stops) {
        try {
          const departures = await fetchDepartures(apiKey, stop.id);
          allDepartures.push(...departures);
        } catch (err) {
          console.error(`[transport] Failed to fetch departures for stop ${stop.id}:`, err);
        }
      }
      console.log(`[transport] Fetched ${allDepartures.length} departures`);

      await replaceDepartures(db, allDepartures);
      await cleanupStaleDepartures(db);

      console.log('[transport] Cycle complete');
    } catch (err) {
      console.error('[transport] Fetch cycle failed:', err);
    } finally {
      running = false;
    }
  }

  // Run immediately, then on interval
  tick();
  timer = setInterval(tick, intervalMs);

  return () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

async function upsertStops(db: Kysely<Database>, stops: NearbyStop[]) {
  for (const stop of stops) {
    await db
      .insertInto('transport_stops')
      .values({
        id: stop.id,
        name: stop.name,
        code: stop.code,
        platform: stop.platform,
        latitude: stop.latitude,
        longitude: stop.longitude,
        vehicle_type: stop.vehicleType,
        distance_m: stop.distanceM,
        updated_at: new Date().toISOString(),
      })
      .onConflict((oc) =>
        oc.column('id').doUpdateSet({
          name: stop.name,
          code: stop.code,
          platform: stop.platform,
          latitude: stop.latitude,
          longitude: stop.longitude,
          vehicle_type: stop.vehicleType,
          distance_m: stop.distanceM,
          updated_at: new Date().toISOString(),
        }),
      )
      .execute();
  }
}

async function replaceDepartures(db: Kysely<Database>, departures: Departure[]) {
  if (departures.length === 0) {
    return;
  }

  // Get unique stop IDs from the new data
  const stopIds = [...new Set(departures.map((d) => d.stopId))];

  await db.transaction().execute(async (trx) => {
    // Delete existing departures for affected stops
    await trx.deleteFrom('transport_departures').where('stop_id', 'in', stopIds).execute();

    // Insert new departures
    for (const dep of departures) {
      await trx
        .insertInto('transport_departures')
        .values({
          stop_id: dep.stopId,
          route_short_name: dep.routeShortName,
          headsign: dep.headsign,
          scheduled_departure: dep.scheduledDeparture,
          realtime_departure: dep.realtimeDeparture,
          departure_delay: dep.departureDelay,
          is_realtime: dep.isRealtime ? 1 : 0,
          service_day: dep.serviceDay,
          vehicle_type: dep.vehicleType,
        })
        .execute();
    }
  });
}

async function cleanupStaleDepartures(db: Kysely<Database>) {
  // Digitransit times use Helsinki local time, so derive "today" and
  // seconds-since-midnight in the same timezone the data was recorded in.
  const now = new Date();
  const helsinkiNow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Helsinki' }));
  const year = helsinkiNow.getFullYear();
  const month = String(helsinkiNow.getMonth() + 1).padStart(2, '0');
  const day = String(helsinkiNow.getDate()).padStart(2, '0');
  const today = `${year}-${month}-${day}`;
  const secondsSinceMidnight =
    helsinkiNow.getHours() * 3600 + helsinkiNow.getMinutes() * 60 + helsinkiNow.getSeconds();

  // Remove departures from past days, or from today where scheduled time has passed
  await db
    .deleteFrom('transport_departures')
    .where((eb) =>
      eb.or([
        eb('service_day', '<', today),
        eb.and([
          eb('service_day', '=', today),
          eb('scheduled_departure', '<', secondsSinceMidnight),
        ]),
      ]),
    )
    .execute();
}
