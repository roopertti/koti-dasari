export type VehicleType = 'BUS' | 'TRAM' | 'METRO' | 'TRAIN' | 'FERRY';

export interface TransportStop {
  id: string;
  name: string;
  code: string | null;
  platform: string | null;
  latitude: number;
  longitude: number;
  vehicleType: VehicleType;
  distanceM: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface TransportDeparture {
  id: string;
  stopId: string;
  routeShortName: string;
  headsign: string;
  scheduledDeparture: number;
  realtimeDeparture: number | null;
  departureDelay: number;
  isRealtime: boolean;
  serviceDay: string;
  vehicleType: VehicleType;
  fetchedAt: string;
}
