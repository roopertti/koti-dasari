import type { TransportDeparture, TransportStop, VehicleType } from '@home-dashboard/shared';
import { apiRequest } from './client.js';

export function listStops(
  params: { vehicleType?: VehicleType; signal?: AbortSignal } = {},
): Promise<TransportStop[]> {
  const { signal, ...query } = params;
  return apiRequest<TransportStop[]>('/transport/stops', { query, signal });
}

export function listStopDepartures(
  stopId: string,
  params: { limit?: number; signal?: AbortSignal } = {},
): Promise<TransportStop[]> {
  const { signal, ...query } = params;
  return apiRequest<TransportStop[]>(`/transport/stops/${encodeURIComponent(stopId)}/departures`, {
    query,
    signal,
  });
}

export function listAllDepartures(
  params: { vehicleType?: VehicleType; limit?: number; signal?: AbortSignal } = {},
): Promise<TransportDeparture[]> {
  const { signal, ...query } = params;
  return apiRequest<TransportDeparture[]>('/transport/departures', {
    query,
    signal,
  });
}
