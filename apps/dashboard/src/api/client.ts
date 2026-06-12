import { apiErrorMessage } from '@home-dashboard/i18n';
import type { ApiError, ApiResponse } from '@home-dashboard/shared';

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? '/api';

export class ApiRequestError extends Error {
  status: number;
  code: string;
  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = `${API_BASE}${path}`;

  if (!query) {
    return url;
  }

  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) {
      continue;
    }

    params.append(key, String(value));
  }

  const qs = params.toString();

  return qs ? `${url}?${qs}` : url;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, signal } = options;
  const headers: Record<string, string> = {};

  if (body !== undefined) {
    headers['content-type'] = 'application/json';
  }

  const response = await fetch(buildUrl(path, query), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const parsed = text ? (JSON.parse(text) as ApiResponse<T> | ApiError) : null;

  if (!response.ok) {
    const err = (parsed as ApiError | null)?.error;

    throw new ApiRequestError(
      err?.message ?? `Request failed with ${response.status}`,
      response.status,
      err?.code ?? 'INTERNAL_ERROR',
    );
  }

  return (parsed as ApiResponse<T>).data;
}

/**
 * Turn a thrown error into a user-facing message. `ApiRequestError`s resolve via
 * the localized error-code map (falling back to the server message for unknown
 * codes); anything else surfaces its own message.
 */
export function errorToMessage(err: unknown): string {
  if (err instanceof ApiRequestError) {
    return apiErrorMessage(err.code, err.message);
  }
  if (err instanceof Error) {
    return err.message;
  }
  return String(err);
}
