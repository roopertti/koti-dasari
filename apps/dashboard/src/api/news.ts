import type { NewsItem } from '@home-dashboard/shared';
import { apiRequest } from './client.js';

export function getNews(
  params: { limit?: number; signal?: AbortSignal } = {},
): Promise<NewsItem[]> {
  const { signal, ...query } = params;
  return apiRequest<NewsItem[]>('/news', { query, signal });
}
