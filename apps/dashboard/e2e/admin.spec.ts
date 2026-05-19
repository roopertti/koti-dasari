import { expect, type Page, test } from '@playwright/test';

const apiPath = (suffix: string) => new RegExp(`/api/${suffix}(\\?|/|$)`);

async function stubAdminSession(page: Page, authed: boolean) {
  await page.route(apiPath('admin/session'), (route) =>
    route.fulfill({
      json: { data: { authed, since: authed ? '2026-05-17T08:00:00.000Z' : null } },
    }),
  );
}

async function stubEmptyReads(page: Page) {
  await page.route(apiPath('calendar/events'), (route, request) => {
    if (request.method() === 'GET') {
      return route.fulfill({ json: { data: [] } });
    }
    return route.continue();
  });
  await page.route(apiPath('todos'), (route, request) => {
    if (request.method() === 'GET') {
      return route.fulfill({ json: { data: [] } });
    }
    return route.continue();
  });
  await page.route(apiPath('admin/settings'), (route, request) => {
    if (request.method() === 'GET') {
      return route.fulfill({ json: { data: {} } });
    }
    return route.continue();
  });
}

test.describe('admin', () => {
  test('shows the login screen when not authenticated', async ({ page }) => {
    await stubAdminSession(page, false);
    await page.goto('/admin');

    await expect(page.getByRole('heading', { name: 'Kirjaudu sisään' })).toBeVisible();
    await expect(page.getByLabel('PIN-koodi')).toBeVisible();
  });

  test('renders the events page when authenticated', async ({ page }) => {
    await stubAdminSession(page, true);
    await stubEmptyReads(page);
    await page.goto('/admin');

    await expect(page.getByRole('link', { name: 'Tapahtumat' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Uusi tapahtuma' })).toBeVisible();
  });

  test('navigating between tabs stays under /admin/<tab> (no relative-path loop)', async ({
    page,
  }) => {
    await stubAdminSession(page, true);
    await stubEmptyReads(page);
    await page.goto('/admin');

    await page.getByRole('link', { name: 'Tehtävät' }).click();
    await expect(page).toHaveURL(/\/admin\/todos$/);

    await page.getByRole('link', { name: 'Asetukset' }).click();
    await expect(page).toHaveURL(/\/admin\/settings$/);

    await page.getByRole('link', { name: 'Tapahtumat' }).click();
    await expect(page).toHaveURL(/\/admin\/events$/);

    // The bug we're guarding against: clicking the same tab while already on it.
    await page.getByRole('link', { name: 'Tapahtumat' }).click();
    await expect(page).toHaveURL(/\/admin\/events$/);
  });

  test('submitting the events form POSTs the typed values', async ({ page }) => {
    await stubAdminSession(page, true);
    await stubEmptyReads(page);

    let capturedBody: Record<string, unknown> | null = null;
    await page.route(apiPath('calendar/events'), (route, request) => {
      if (request.method() === 'POST') {
        capturedBody = JSON.parse(request.postData() ?? '{}');
        return route.fulfill({
          status: 201,
          json: {
            data: {
              id: 'new-id',
              title: 'New event',
              description: null,
              location: null,
              startTime: '2026-05-20T07:00:00.000Z',
              endTime: '2026-05-20T08:00:00.000Z',
              allDay: false,
              color: null,
              createdAt: '2026-05-17T08:00:00.000Z',
              updatedAt: '2026-05-17T08:00:00.000Z',
            },
          },
        });
      }
      return route.fulfill({ json: { data: [] } });
    });

    await page.goto('/admin/events');

    await page.getByLabel('Otsikko').fill('Hammaslääkäri');
    await page.getByLabel('Sijainti').fill('Helsinki');
    await page.getByLabel('Alkaa').fill('2026-05-20T10:00');
    await page.getByLabel('Päättyy').fill('2026-05-20T11:00');
    await page.getByRole('button', { name: 'Luo' }).click();

    await expect.poll(() => capturedBody).not.toBeNull();
    // datetime-local strings get converted to ISO via the user's local clock —
    // assert shape rather than an exact string so this isn't TZ-flaky.
    expect(capturedBody).toMatchObject({
      title: 'Hammaslääkäri',
      location: 'Helsinki',
      allDay: false,
      startTime: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/),
      endTime: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/),
    });
  });

  test('events form rejects end-before-start without calling the API', async ({ page }) => {
    await stubAdminSession(page, true);
    await stubEmptyReads(page);

    let posted = false;
    await page.route(apiPath('calendar/events'), (route, request) => {
      if (request.method() === 'POST') {
        posted = true;
        return route.fulfill({ status: 201, json: { data: {} } });
      }
      return route.fulfill({ json: { data: [] } });
    });

    await page.goto('/admin/events');
    await page.getByLabel('Otsikko').fill('Bad event');
    await page.getByLabel('Alkaa').fill('2026-05-20T12:00');
    await page.getByLabel('Päättyy').fill('2026-05-20T11:00');
    await page.getByRole('button', { name: 'Luo' }).click();

    await expect(page.getByText('Päättymisajan on oltava alkamisajan jälkeen')).toBeVisible();
    expect(posted).toBe(false);
  });

  test('submitting the todos form POSTs title + priority + due date', async ({ page }) => {
    await stubAdminSession(page, true);
    await stubEmptyReads(page);

    let capturedBody: Record<string, unknown> | null = null;
    await page.route(apiPath('todos'), (route, request) => {
      if (request.method() === 'POST') {
        capturedBody = JSON.parse(request.postData() ?? '{}');
        return route.fulfill({
          status: 201,
          json: {
            data: {
              id: 'todo-id',
              title: 'New todo',
              description: null,
              completed: false,
              priority: 'high',
              dueDate: '2026-05-25',
              sortOrder: 0,
              createdAt: '2026-05-17T08:00:00.000Z',
              updatedAt: '2026-05-17T08:00:00.000Z',
            },
          },
        });
      }
      if (request.method() === 'GET') {
        return route.fulfill({ json: { data: [] } });
      }
      return route.continue();
    });

    await page.goto('/admin/todos');

    await page.getByLabel('Otsikko').fill('Osta maitoa');
    await page.getByLabel('Prioriteetti').selectOption('high');
    await page.getByLabel('Deadline').fill('2026-05-25');
    await page.getByRole('button', { name: 'Luo' }).click();

    await expect.poll(() => capturedBody).not.toBeNull();
    expect(capturedBody).toMatchObject({
      title: 'Osta maitoa',
      priority: 'high',
      dueDate: '2026-05-25',
    });
  });

  test('submitting the settings form PUTs camelCase values', async ({ page }) => {
    await stubAdminSession(page, true);
    await stubEmptyReads(page);

    let capturedBody: Record<string, unknown> | null = null;
    await page.route(apiPath('admin/settings'), (route, request) => {
      if (request.method() === 'PUT') {
        capturedBody = JSON.parse(request.postData() ?? '{}');
        return route.fulfill({
          json: { data: { ...(capturedBody as Record<string, unknown>) } },
        });
      }
      return route.fulfill({ json: { data: {} } });
    });

    await page.goto('/admin/settings');

    await page.getByLabel('Kotipaikan leveysaste').fill('60.2');
    await page.getByLabel('Kotipaikan pituusaste').fill('24.95');
    await page.getByLabel('Pysäkkihaun säde (m)').fill('600');
    await page.getByLabel('Liikenteen hakuväli (ms)').fill('240000');
    await page.getByLabel('Sään hakuväli (ms)').fill('1200000');
    await page.getByRole('button', { name: 'Tallenna' }).click();

    await expect.poll(() => capturedBody).not.toBeNull();
    expect(capturedBody).toEqual({
      homeLatitude: 60.2,
      homeLongitude: 24.95,
      transportRadius: 600,
      transportIntervalMs: 240000,
      weatherIntervalMs: 1200000,
    });
    await expect(page.getByText('Tallennettu')).toBeVisible();
  });

  test('settings form skips empty fields in the PUT body', async ({ page }) => {
    await stubAdminSession(page, true);
    await stubEmptyReads(page);

    let capturedBody: Record<string, unknown> | null = null;
    await page.route(apiPath('admin/settings'), (route, request) => {
      if (request.method() === 'PUT') {
        capturedBody = JSON.parse(request.postData() ?? '{}');
        return route.fulfill({ json: { data: capturedBody } });
      }
      return route.fulfill({ json: { data: {} } });
    });

    await page.goto('/admin/settings');
    await page.getByLabel('Kotipaikan leveysaste').fill('60.5');
    await page.getByRole('button', { name: 'Tallenna' }).click();

    await expect.poll(() => capturedBody).not.toBeNull();
    expect(capturedBody).toEqual({ homeLatitude: 60.5 });
  });
});
