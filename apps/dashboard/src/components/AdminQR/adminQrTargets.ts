export interface AdminQrTarget {
  key: string;
  labelKey: string;
  url: string;
}

// `/admin/events` and `/admin/todos` each render an empty create form at the top
// of the page, so they double as the "new event" / "new todo" entry points —
// there are no separate `/new` routes to link at.
const PATHS = [
  { key: 'admin', labelKey: 'kiosk.adminQr.target.admin', path: '/admin/' },
  { key: 'newEvent', labelKey: 'kiosk.adminQr.target.newEvent', path: '/admin/events' },
  { key: 'newTodo', labelKey: 'kiosk.adminQr.target.newTodo', path: '/admin/todos' },
] as const;

/**
 * Builds the absolute admin URLs to encode, from the origin the kiosk itself was
 * reached by — so the codes resolve to whatever LAN IP or hostname is in use
 * without any build-time or env configuration.
 */
export function adminQrTargets(origin: string): AdminQrTarget[] {
  const base = origin.replace(/\/+$/, '');
  return PATHS.map(({ key, labelKey, path }) => ({ key, labelKey, url: `${base}${path}` }));
}
