import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('calendar_events')
    .addColumn('id', 'text', (col) => col.primaryKey().defaultTo(sql`(lower(hex(randomblob(16))))`))
    .addColumn('title', 'text', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('location', 'text')
    .addColumn('start_time', 'text', (col) => col.notNull())
    .addColumn('end_time', 'text', (col) => col.notNull())
    .addColumn('all_day', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('color', 'text')
    .addColumn('created_at', 'text', (col) => col.notNull().defaultTo(sql`(datetime('now'))`))
    .addColumn('updated_at', 'text', (col) => col.notNull().defaultTo(sql`(datetime('now'))`))
    .execute();

  await db.schema
    .createIndex('idx_calendar_events_start')
    .on('calendar_events')
    .column('start_time')
    .execute();

  await db.schema
    .createIndex('idx_calendar_events_end')
    .on('calendar_events')
    .column('end_time')
    .execute();

  await db.schema
    .createTable('todos')
    .addColumn('id', 'text', (col) => col.primaryKey().defaultTo(sql`(lower(hex(randomblob(16))))`))
    .addColumn('title', 'text', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('completed', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('priority', 'text', (col) =>
      col.notNull().defaultTo('medium').check(sql`priority IN ('low', 'medium', 'high')`),
    )
    .addColumn('due_date', 'text')
    .addColumn('sort_order', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('created_at', 'text', (col) => col.notNull().defaultTo(sql`(datetime('now'))`))
    .addColumn('updated_at', 'text', (col) => col.notNull().defaultTo(sql`(datetime('now'))`))
    .execute();

  await db.schema.createIndex('idx_todos_completed').on('todos').column('completed').execute();

  await db.schema.createIndex('idx_todos_due_date').on('todos').column('due_date').execute();

  await db.schema
    .createTable('reminders')
    .addColumn('id', 'text', (col) => col.primaryKey().defaultTo(sql`(lower(hex(randomblob(16))))`))
    .addColumn('title', 'text', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('remind_at', 'text', (col) => col.notNull())
    .addColumn('acknowledged', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('recurring', 'text')
    .addColumn('created_at', 'text', (col) => col.notNull().defaultTo(sql`(datetime('now'))`))
    .addColumn('updated_at', 'text', (col) => col.notNull().defaultTo(sql`(datetime('now'))`))
    .execute();

  await db.schema
    .createIndex('idx_reminders_remind_at')
    .on('reminders')
    .column('remind_at')
    .execute();

  await db.schema
    .createIndex('idx_reminders_acknowledged')
    .on('reminders')
    .column('acknowledged')
    .execute();

  await db.schema
    .createTable('transport_stops')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('code', 'text')
    .addColumn('platform', 'text')
    .addColumn('latitude', 'real', (col) => col.notNull())
    .addColumn('longitude', 'real', (col) => col.notNull())
    .addColumn('vehicle_type', 'text', (col) =>
      col.notNull().check(sql`vehicle_type IN ('BUS', 'TRAM', 'METRO', 'TRAIN', 'FERRY')`),
    )
    .addColumn('distance_m', 'integer')
    .addColumn('created_at', 'text', (col) => col.notNull().defaultTo(sql`(datetime('now'))`))
    .addColumn('updated_at', 'text', (col) => col.notNull().defaultTo(sql`(datetime('now'))`))
    .execute();

  await db.schema
    .createTable('transport_departures')
    .addColumn('id', 'text', (col) => col.primaryKey().defaultTo(sql`(lower(hex(randomblob(16))))`))
    .addColumn('stop_id', 'text', (col) =>
      col.notNull().references('transport_stops.id').onDelete('cascade'),
    )
    .addColumn('route_short_name', 'text', (col) => col.notNull())
    .addColumn('headsign', 'text', (col) => col.notNull())
    .addColumn('scheduled_departure', 'integer', (col) => col.notNull())
    .addColumn('realtime_departure', 'integer')
    .addColumn('departure_delay', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('is_realtime', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('service_day', 'text', (col) => col.notNull())
    .addColumn('vehicle_type', 'text', (col) =>
      col.notNull().check(sql`vehicle_type IN ('BUS', 'TRAM', 'METRO', 'TRAIN', 'FERRY')`),
    )
    .addColumn('fetched_at', 'text', (col) => col.notNull().defaultTo(sql`(datetime('now'))`))
    .execute();

  await db.schema
    .createIndex('idx_departures_stop')
    .on('transport_departures')
    .column('stop_id')
    .execute();

  await db.schema
    .createIndex('idx_departures_service_day')
    .on('transport_departures')
    .column('service_day')
    .execute();

  await db.schema
    .createIndex('idx_departures_time')
    .on('transport_departures')
    .columns(['service_day', 'scheduled_departure'])
    .execute();

  await db.schema
    .createTable('weather_current')
    .addColumn('id', 'integer', (col) => col.primaryKey().defaultTo(1).check(sql`id = 1`))
    .addColumn('temperature', 'real', (col) => col.notNull())
    .addColumn('apparent_temp', 'real')
    .addColumn('humidity', 'integer')
    .addColumn('wind_speed', 'real')
    .addColumn('wind_direction', 'integer')
    .addColumn('precipitation', 'real')
    .addColumn('weather_code', 'integer', (col) => col.notNull())
    .addColumn('cloud_cover', 'integer')
    .addColumn('pressure', 'real')
    .addColumn('latitude', 'real', (col) => col.notNull())
    .addColumn('longitude', 'real', (col) => col.notNull())
    .addColumn('fetched_at', 'text', (col) => col.notNull().defaultTo(sql`(datetime('now'))`))
    .execute();

  await db.schema
    .createTable('weather_hourly')
    .addColumn('id', 'text', (col) => col.primaryKey().defaultTo(sql`(lower(hex(randomblob(16))))`))
    .addColumn('forecast_time', 'text', (col) => col.notNull())
    .addColumn('temperature', 'real', (col) => col.notNull())
    .addColumn('apparent_temp', 'real')
    .addColumn('humidity', 'integer')
    .addColumn('wind_speed', 'real')
    .addColumn('wind_direction', 'integer')
    .addColumn('precipitation', 'real')
    .addColumn('precipitation_probability', 'integer')
    .addColumn('weather_code', 'integer', (col) => col.notNull())
    .addColumn('cloud_cover', 'integer')
    .addColumn('fetched_at', 'text', (col) => col.notNull().defaultTo(sql`(datetime('now'))`))
    .execute();

  await db.schema
    .createIndex('idx_weather_hourly_time')
    .on('weather_hourly')
    .column('forecast_time')
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('weather_hourly').ifExists().execute();
  await db.schema.dropTable('weather_current').ifExists().execute();
  await db.schema.dropTable('transport_departures').ifExists().execute();
  await db.schema.dropTable('transport_stops').ifExists().execute();
  await db.schema.dropTable('reminders').ifExists().execute();
  await db.schema.dropTable('todos').ifExists().execute();
  await db.schema.dropTable('calendar_events').ifExists().execute();
}
