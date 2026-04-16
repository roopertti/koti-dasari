const DIGITRANSIT_URL = 'https://api.digitransit.fi/routing/v2/hsl/gtfs/v1';

interface StopsByRadiusNode {
  stop: {
    gtfsId: string;
    name: string;
    code: string | null;
    platformCode: string | null;
    lat: number;
    lon: number;
    vehicleMode: string;
  };
  distance: number;
}

interface StopsByRadiusResponse {
  data: {
    stopsByRadius: {
      edges: Array<{ node: StopsByRadiusNode }>;
    };
  };
}

interface StoptimeData {
  trip: {
    route: {
      shortName: string;
      mode: string;
    };
  };
  headsign: string;
  serviceDay: string;
  scheduledDeparture: number;
  realtimeDeparture: number;
  departureDelay: number;
  realtime: boolean;
}

interface StoptimesResponse {
  data: {
    stop: {
      stoptimesWithoutPatterns: StoptimeData[];
    } | null;
  };
}

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

async function query<T>(
  apiKey: string,
  graphql: string,
  variables: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(DIGITRANSIT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'digitransit-subscription-key': apiKey,
    },
    body: JSON.stringify({ query: graphql, variables }),
  });

  if (!response.ok) {
    throw new Error(`Digitransit API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
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
  const result = await query<StopsByRadiusResponse>(apiKey, STOPS_BY_RADIUS_QUERY, {
    lat,
    lon,
    radius,
  });

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
  const result = await query<StoptimesResponse>(apiKey, STOPTIMES_QUERY, {
    stopId,
    numberOfDepartures,
  });

  if (!result.data.stop) {
    return [];
  }

  return result.data.stop.stoptimesWithoutPatterns.map((st) => {
    // Digitransit serviceDay is epoch seconds at midnight Helsinki local time.
    // Adding 12h shifts it to noon local, so the UTC date always matches
    // the intended local date regardless of timezone offset.
    const noonEpochMs = Number(st.serviceDay) * 1000 + 12 * 3600_000;
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
