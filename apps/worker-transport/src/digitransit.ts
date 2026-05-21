import { z } from 'zod';

const DIGITRANSIT_URL = 'https://api.digitransit.fi/routing/v2/hsl/gtfs/v1';

const StopsByRadiusSchema = z.object({
  data: z.object({
    stopsByRadius: z.object({
      edges: z.array(
        z.object({
          node: z.object({
            stop: z.object({
              gtfsId: z.string(),
              name: z.string(),
              code: z.string().nullable(),
              platformCode: z.string().nullable(),
              lat: z.number(),
              lon: z.number(),
              vehicleMode: z.string(),
            }),
            distance: z.number(),
          }),
        }),
      ),
    }),
  }),
});

const StoptimesSchema = z.object({
  data: z.object({
    stop: z
      .object({
        stoptimesWithoutPatterns: z.array(
          z.object({
            trip: z.object({
              route: z.object({
                shortName: z.string(),
                mode: z.string(),
              }),
            }),
            headsign: z.string(),
            // GraphQL Long scalar — some implementations serialize as a string
            // to preserve precision; coerce to number to handle both shapes.
            serviceDay: z.coerce.number(),
            scheduledDeparture: z.number(),
            realtimeDeparture: z.number(),
            departureDelay: z.number(),
            realtime: z.boolean(),
          }),
        ),
      })
      .nullable(),
  }),
});

const VEHICLE_MODE_MAP = {
  BUS: 'BUS',
  TRAM: 'TRAM',
  SUBWAY: 'METRO',
  RAIL: 'TRAIN',
  FERRY: 'FERRY',
} as const;

type VehicleType = (typeof VEHICLE_MODE_MAP)[keyof typeof VEHICLE_MODE_MAP];

export function mapVehicleMode(mode: string): VehicleType {
  if (mode in VEHICLE_MODE_MAP) {
    return VEHICLE_MODE_MAP[mode as keyof typeof VEHICLE_MODE_MAP];
  }
  return 'BUS';
}

async function query<T extends z.ZodType>(
  apiKey: string,
  graphql: string,
  variables: Record<string, unknown>,
  schema: T,
): Promise<z.infer<T>> {
  const response = await fetch(DIGITRANSIT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'digitransit-subscription-key': apiKey,
    },
    body: JSON.stringify({ query: graphql, variables }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`Digitransit API error: ${response.status} ${response.statusText}`);
  }

  const json = (await response.json()) as { errors?: Array<{ message?: string }> };

  // GraphQL signals query-level failures via a top-level `errors` array (which
  // omits `data` entirely). Surface those directly so the worker log shows the
  // API's own message rather than a generic schema mismatch.
  if (Array.isArray(json.errors) && json.errors.length > 0) {
    const messages = json.errors.map((e) => e.message ?? 'unknown error').join('; ');
    throw new Error(`Digitransit GraphQL error: ${messages}`);
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new Error(`Digitransit response validation failed: ${parsed.error.message}`);
  }
  return parsed.data;
}

const STOPS_BY_RADIUS_QUERY = `
  query StopsByRadius($lat: Float!, $lon: Float!, $radius: Int!) {
    stopsByRadius(lat: $lat, lon: $lon, radius: $radius, first: 50) {
      edges {
        node {
          stop {
            gtfsId
            name
            code
            platformCode
            lat
            lon
            vehicleMode
          }
          distance
        }
      }
    }
  }
`;

export interface NearbyStop {
  id: string;
  name: string;
  code: string | null;
  platform: string | null;
  latitude: number;
  longitude: number;
  vehicleType: VehicleType;
  distanceM: number;
}

export async function fetchNearbyStops(
  apiKey: string,
  lat: number,
  lon: number,
  radius: number,
): Promise<NearbyStop[]> {
  const result = await query(
    apiKey,
    STOPS_BY_RADIUS_QUERY,
    { lat, lon, radius },
    StopsByRadiusSchema,
  );

  return result.data.stopsByRadius.edges.map(({ node }) => ({
    id: node.stop.gtfsId,
    name: node.stop.name,
    code: node.stop.code,
    platform: node.stop.platformCode,
    latitude: node.stop.lat,
    longitude: node.stop.lon,
    vehicleType: mapVehicleMode(node.stop.vehicleMode),
    distanceM: node.distance,
  }));
}

const STOPTIMES_QUERY = `
  query Stoptimes($stopId: String!, $numberOfDepartures: Int!) {
    stop(id: $stopId) {
      stoptimesWithoutPatterns(numberOfDepartures: $numberOfDepartures) {
        trip {
          route {
            shortName
            mode
          }
        }
        headsign
        serviceDay
        scheduledDeparture
        realtimeDeparture
        departureDelay
        realtime
      }
    }
  }
`;

export interface Departure {
  stopId: string;
  routeShortName: string;
  headsign: string;
  scheduledDeparture: number;
  realtimeDeparture: number | null;
  departureDelay: number;
  isRealtime: boolean;
  serviceDay: string;
  vehicleType: VehicleType;
}

export async function fetchDepartures(
  apiKey: string,
  stopId: string,
  numberOfDepartures = 20,
): Promise<Departure[]> {
  const result = await query(
    apiKey,
    STOPTIMES_QUERY,
    { stopId, numberOfDepartures },
    StoptimesSchema,
  );

  if (!result.data.stop) {
    return [];
  }

  return result.data.stop.stoptimesWithoutPatterns.map((st) => {
    // Digitransit serviceDay is epoch seconds at midnight Helsinki local time.
    // Adding 12h shifts it to noon local, so the UTC date always matches
    // the intended local date regardless of timezone offset.
    const noonEpochMs = st.serviceDay * 1000 + 12 * 3600_000;
    const serviceDay = new Date(noonEpochMs).toISOString().split('T')[0];

    return {
      stopId,
      routeShortName: st.trip.route.shortName,
      headsign: st.headsign,
      scheduledDeparture: st.scheduledDeparture,
      realtimeDeparture: st.realtime ? st.realtimeDeparture : null,
      departureDelay: st.departureDelay,
      isRealtime: st.realtime,
      serviceDay,
      vehicleType: mapVehicleMode(st.trip.route.mode),
    };
  });
}
