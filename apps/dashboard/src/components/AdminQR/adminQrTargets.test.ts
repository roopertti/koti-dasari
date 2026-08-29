import { describe, expect, it } from 'vitest';
import { adminQrTargets } from './adminQrTargets.js';

describe('adminQrTargets', () => {
  it('builds absolute admin URLs from the kiosk origin', () => {
    const urls = adminQrTargets('http://192.168.1.50').map((target) => target.url);

    expect(urls).toEqual([
      'http://192.168.1.50/admin/',
      'http://192.168.1.50/admin/events',
      'http://192.168.1.50/admin/todos',
    ]);
  });

  it('keeps a non-default port, so a dev kiosk resolves too', () => {
    const [admin] = adminQrTargets('http://homepi.local:8080');

    expect(admin.url).toBe('http://homepi.local:8080/admin/');
  });

  it('does not double up the slash when the origin has a trailing one', () => {
    const urls = adminQrTargets('http://192.168.1.50/').map((target) => target.url);

    expect(urls).toEqual([
      'http://192.168.1.50/admin/',
      'http://192.168.1.50/admin/events',
      'http://192.168.1.50/admin/todos',
    ]);
  });

  it('labels every target with a translation key rather than literal text', () => {
    for (const target of adminQrTargets('http://192.168.1.50')) {
      expect(target.labelKey).toMatch(/^kiosk\.adminQr\.target\./);
    }
  });
});
