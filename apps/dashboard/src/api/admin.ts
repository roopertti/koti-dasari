import { apiRequest } from './client.js';

export interface AdminSession {
  authed: boolean;
  since: string | null;
}

export interface AdminSettings {
  homeLatitude?: number;
  homeLongitude?: number;
  transportRadius?: number;
  transportIntervalMs?: number;
  weatherIntervalMs?: number;
}

export function getAdminSession(signal?: AbortSignal): Promise<AdminSession> {
  return apiRequest<AdminSession>('/admin/session', { signal });
}

export function adminLogin(pin: string): Promise<AdminSession> {
  return apiRequest<AdminSession>('/admin/login', {
    method: 'POST',
    body: { pin },
  });
}

export function adminLogout(): Promise<AdminSession> {
  return apiRequest<AdminSession>('/admin/logout', { method: 'POST' });
}

export function getAdminSettings(signal?: AbortSignal): Promise<AdminSettings> {
  return apiRequest<AdminSettings>('/admin/settings', { signal });
}

export function updateAdminSettings(patch: AdminSettings): Promise<AdminSettings> {
  return apiRequest<AdminSettings>('/admin/settings', {
    method: 'PUT',
    body: patch,
  });
}
