import type { ElectricityPrice } from '@home-dashboard/shared';
import { apiRequest } from './client.js';

export function getElectricityPrices(
  params: { from?: string; to?: string; signal?: AbortSignal } = {},
): Promise<ElectricityPrice[]> {
  const { signal, ...query } = params;
  return apiRequest<ElectricityPrice[]>('/electricity/prices', { query, signal });
}
