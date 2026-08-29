import { expect, type Page, test } from '@playwright/test';

const EMPTY = { data: [] };

const WEATHER_CURRENT = {
  data: {
    temperature: 8.5,
    apparentTemp: 6.2,
    humidity: 72,
    windSpeed: 14,
    windDirection: 220,
    precipitation: 0,
    weatherCode: 2,
    cloudCover: 40,
    pressure: 1013,
    latitude: 60.17,
    longitude: 24.93,
    fetchedAt: '2026-04-17T12:00:00.000Z',
  },
};

// Match URL path exactly at the /api/ prefix so we don't also intercept
// Vite-served source modules like /src/api/todos.ts.
const apiPath = (suffix: string) => new RegExp(`/api/${suffix}(\\?|/|$)`);

async function stubReads(page: Page, overrides: Record<string, unknown> = {}) {
  const responses: Record<string, unknown> = {
    'calendar/events': EMPTY,
    todos: EMPTY,
    'transport/departures': EMPTY,
    'weather/current': WEATHER_CURRENT,
    'weather/forecast': EMPTY,
    'electricity/prices': EMPTY,
    news: EMPTY,
    ...overrides,
  };
  for (const [suffix, body] of Object.entries(responses)) {
    await page.route(apiPath(suffix), (route) => route.fulfill({ json: body }));
  }
}

test.describe('dashboard', () => {
  test('always renders weather and transport hero panels', async ({ page }) => {
    await stubReads(page);
    await page.goto('/');

    await expect(page.getByTestId('panel-weather')).toBeVisible();
    await expect(page.getByTestId('panel-transport')).toBeVisible();
  });

  test('shows empty states on optional panels when their data is empty', async ({ page }) => {
    await stubReads(page);
    await page.goto('/');

    await expect(page.getByTestId('panel-weather')).toBeVisible();

    await expect(page.getByTestId('panel-calendar')).toContainText('Ei tulevia tapahtumia');
    await expect(page.getByTestId('panel-todos')).toContainText('Ei tehtäviä');
  });

  test('renders optional panels when they have data', async ({ page }) => {
    await stubReads(page, {
      todos: {
        data: [
          {
            id: 't1',
            title: 'Buy bread',
            description: null,
            completed: false,
            priority: 'medium',
            dueDate: null,
            sortOrder: 0,
            createdAt: '2026-04-15T08:00:00Z',
            updatedAt: '2026-04-15T08:00:00Z',
          },
        ],
      },
    });
    await page.goto('/');

    await expect(page.getByTestId('panel-todos')).toBeVisible();
    await expect(page.getByTestId('panel-todos')).toContainText('Buy bread');
    await expect(page.getByTestId('panel-calendar')).toContainText('Ei tulevia tapahtumia');
  });

  test('swiping horizontally advances to the secondary page', async ({ page }) => {
    await stubReads(page);
    await page.goto('/');

    await expect(page.getByTestId('panel-weather')).toBeVisible();

    const dots = page.getByTestId('pagination').locator('span');
    await expect(dots.nth(0)).toHaveAttribute('aria-current', 'page');

    const box = await page.getByTestId('page-primary').boundingBox();
    if (!box) {
      throw new Error('primary page bounding box not found');
    }
    const y = box.y + box.height / 2;
    const startX = box.x + box.width * 0.8;
    const endX = box.x + box.width * 0.2;

    // Flick left: fast, horizontal-dominant drag > 40px triggers the page advance.
    await page.mouse.move(startX, y);
    await page.mouse.down();
    await page.mouse.move(startX - 20, y);
    await page.mouse.move(endX, y);
    await page.mouse.up();

    await expect(dots.nth(1)).toHaveAttribute('aria-current', 'page');
  });

  test('error boundary catches render-time crashes inside a panel', async ({ page }) => {
    // Surface real render errors when they happen but suppress the noisy
    // React StrictMode double-render console output for the expected throw.
    page.on('pageerror', () => {});

    // Calendar panel maps over events and calls startTime.slice(0, 10) — a
    // malformed event with startTime: null forces a TypeError during render,
    // which the ErrorBoundary should catch and replace with the fallback.
    await stubReads(page, {
      'calendar/events': {
        data: [
          {
            id: 'bad',
            title: 'Broken event',
            description: null,
            location: null,
            startTime: null,
            endTime: '2026-04-15T10:00:00Z',
            allDay: false,
            color: null,
            createdAt: '2026-04-10T12:00:00Z',
            updatedAt: '2026-04-10T12:00:00Z',
          },
        ],
      },
    });

    await page.goto('/');

    const fallback = page.getByTestId('error-boundary');
    await expect(fallback).toBeVisible();
    await expect(fallback).toContainText('Näyttö kaatui');
    await expect(page.getByRole('button', { name: 'Lataa uudelleen' })).toBeVisible();
  });

  test('toggling a todo via the Done button calls the toggle endpoint', async ({ page }) => {
    const todo = {
      id: 'todo-1',
      title: 'Buy milk',
      description: null,
      completed: false,
      priority: 'medium',
      dueDate: null,
      sortOrder: 0,
      createdAt: '2026-04-15T08:00:00Z',
      updatedAt: '2026-04-15T08:00:00Z',
    };

    await stubReads(page, {
      'calendar/events': EMPTY,
      'transport/departures': EMPTY,
      'weather/forecast': EMPTY,
    });

    let toggled = false;
    await page.route(/\/api\/todos(\?|$)/, (route) => {
      return route.fulfill({
        json: { data: [{ ...todo, completed: toggled }] },
      });
    });
    await page.route(/\/api\/todos\/todo-1\/toggle$/, (route) => {
      toggled = true;
      return route.fulfill({ json: { data: { ...todo, completed: true } } });
    });

    await page.goto('/');

    const doneButton = page.getByRole('button', {
      name: 'Merkitse "Buy milk" valmiiksi',
    });
    await expect(doneButton).toBeVisible();
    await expect(doneButton).toHaveText('Valmis');
    await doneButton.click();

    await expect.poll(() => toggled, { timeout: 2000 }).toBe(true);
  });

  test('Today & Soon rail surfaces overdue todos prominently', async ({ page }) => {
    await stubReads(page, {
      todos: { data: [makeTodo({ id: 'overdue-1', title: 'Maksa lasku', dayOffset: -2 })] },
    });

    await page.goto('/');

    const rail = page.getByTestId('today-soon-rail');
    await expect(rail).toBeVisible();
    await expect(rail).toContainText('Maksa lasku');
    await expect(rail).toContainText('Myöhässä');
  });

  test('Today & Soon rail buckets items into today / tomorrow / this week', async ({ page }) => {
    await stubReads(page, {
      todos: {
        data: [
          makeTodo({ id: 't-today', title: 'Tehtävä tänään', dayOffset: 0 }),
          makeTodo({ id: 't-tomorrow', title: 'Tehtävä huomenna', dayOffset: 1 }),
          makeTodo({ id: 't-week', title: 'Tehtävä viikolla', dayOffset: 5 }),
        ],
      },
    });

    await page.goto('/');

    const rail = page.getByTestId('today-soon-rail');
    await expect(rail).toBeVisible();
    await expect(rail).toContainText('Tänään');
    await expect(rail).toContainText('Huomenna');
    await expect(rail).toContainText('Tällä viikolla');
    await expect(rail).toContainText('Tehtävä tänään');
    await expect(rail).toContainText('Tehtävä huomenna');
    await expect(rail).toContainText('Tehtävä viikolla');
  });

  test('Today & Soon rail shows "+N muuta" overflow when items exceed the visible cap', async ({
    page,
  }) => {
    // 6 todos in horizon → 4 visible, 2 hidden → "+2 muuta".
    const data = Array.from({ length: 6 }, (_, i) =>
      makeTodo({ id: `t-${i}`, title: `Tehtävä ${i}`, dayOffset: i, sortOrder: i }),
    );
    await stubReads(page, { todos: { data } });

    await page.goto('/');

    const rail = page.getByTestId('today-soon-rail');
    await expect(rail).toContainText('+2 muuta');
  });

  test('Today & Soon rail uses singular "+1 muu" when exactly one item is hidden', async ({
    page,
  }) => {
    // 5 todos in horizon → 4 visible, 1 hidden → "+1 muu" (Finnish nominative).
    const data = Array.from({ length: 5 }, (_, i) =>
      makeTodo({ id: `t-${i}`, title: `Tehtävä ${i}`, dayOffset: i, sortOrder: i }),
    );
    await stubReads(page, { todos: { data } });

    await page.goto('/');

    const rail = page.getByTestId('today-soon-rail');
    // \b ensures we don't accidentally match "+1 muuta".
    await expect(rail).toContainText(/\+1 muu\b/);
  });

  test('electricity panel renders prices and chart bars when data is present', async ({ page }) => {
    const now = new Date();
    const topOfHour = new Date(Math.floor(now.getTime() / 3_600_000) * 3_600_000);
    const data = Array.from({ length: 24 }, (_, i) => ({
      hourStart: new Date(topOfHour.getTime() + i * 3_600_000).toISOString(),
      priceCentsPerKwh: 4 + Math.sin(i / 3) * 6,
      fetchedAt: now.toISOString(),
    }));
    await stubReads(page, { 'electricity/prices': { data } });

    await page.goto('/');

    const panel = page.getByTestId('panel-electricity');
    await expect(panel).toBeVisible();
    await expect(panel).toContainText('Sähkönhinta');
    await expect(panel).toContainText('snt/kWh');
    // The chart is an inline SVG with one rect per hour.
    await expect(panel.locator('svg rect')).toHaveCount(24);
    // Status pill is shown for the current hour (the first synthetic data entry is at "now").
    await expect(page.getByTestId('electricity-status-pill')).toBeVisible();
  });

  test('electricity status pill reads "Kallis" when the current price is above the expensive threshold', async ({
    page,
  }) => {
    const now = new Date();
    const topOfHour = new Date(Math.floor(now.getTime() / 3_600_000) * 3_600_000);
    const data = Array.from({ length: 6 }, (_, i) => ({
      hourStart: new Date(topOfHour.getTime() + i * 3_600_000).toISOString(),
      // First entry is the current hour — push it well above the 15 c/kWh expensive threshold.
      priceCentsPerKwh: i === 0 ? 25 : 6,
      fetchedAt: now.toISOString(),
    }));
    await stubReads(page, { 'electricity/prices': { data } });

    await page.goto('/');

    await expect(page.getByTestId('electricity-status-pill')).toContainText('Kallis');
  });

  test('news panel renders headlines from the news feed', async ({ page }) => {
    const now = new Date();
    const data = [
      {
        guid: 'yle-1',
        title: 'Tärkeä uutinen',
        link: 'https://yle.fi/a/1',
        summary: null,
        publishedAt: new Date(now.getTime() - 5 * 60_000).toISOString(),
        source: 'yle',
        fetchedAt: now.toISOString(),
      },
      {
        guid: 'yle-2',
        title: 'Toinen uutinen',
        link: 'https://yle.fi/a/2',
        summary: null,
        publishedAt: new Date(now.getTime() - 2 * 3_600_000).toISOString(),
        source: 'yle',
        fetchedAt: now.toISOString(),
      },
    ];
    await stubReads(page, { news: { data } });

    await page.goto('/');

    const panel = page.getByTestId('panel-news');
    await expect(panel).toBeVisible();
    await expect(panel).toContainText('Uutiset');
    await expect(panel).toContainText('Tärkeä uutinen');
    await expect(panel).toContainText('Toinen uutinen');
    await expect(panel.getByTestId('news-list').locator('> li')).toHaveCount(2);
  });

  test('tapping a news headline opens a QR modal', async ({ page }) => {
    const now = new Date();
    await stubReads(page, {
      news: {
        data: [
          {
            guid: 'yle-1',
            title: 'Avattava juttu',
            link: 'https://yle.fi/a/open-me',
            summary: null,
            publishedAt: new Date(now.getTime() - 60_000).toISOString(),
            source: 'yle',
            fetchedAt: now.toISOString(),
          },
        ],
      },
    });

    await page.goto('/');

    const panel = page.getByTestId('panel-news');
    await expect(panel).toBeVisible();
    await panel.getByText('Avattava juttu').click();

    const modal = page.getByTestId('news-qr-modal');
    await expect(modal).toBeVisible();
    await expect(modal.getByTestId('news-qr-image')).toBeVisible();
    await expect(modal).toContainText('Avattava juttu');
  });

  test('the header QR button opens a modal with codes for the admin entry points', async ({
    page,
  }) => {
    await stubReads(page);
    await page.goto('/');

    const trigger = page.getByTestId('admin-qr-button');
    await expect(trigger).toBeVisible();
    // Touch target minimum from the kiosk conventions.
    const box = await trigger.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);

    await trigger.click();

    const modal = page.getByTestId('admin-qr-modal');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('Hallinta puhelimella');

    // One code per admin entry point, each rendered as a real image.
    await expect(modal.getByTestId('admin-qr-list').locator('> li')).toHaveCount(3);
    for (const key of ['admin', 'newEvent', 'newTodo']) {
      await expect(modal.getByTestId(`admin-qr-code-${key}`)).toBeVisible();
    }

    // Codes are encoded locally as data URIs — no network round trip.
    const src = await modal.getByTestId('admin-qr-code-admin').getAttribute('src');
    expect(src).toMatch(/^data:image\/png;base64,/);

    // The origin the kiosk was reached by is shown as a typo-able fallback.
    const origin = new URL(page.url()).origin;
    await expect(modal).toContainText(origin);

    await modal.getByTestId('admin-qr-modal-close').click();
    await expect(modal).toBeHidden();
  });

  test('news panel shows empty state when no items are available', async ({ page }) => {
    await stubReads(page);

    await page.goto('/');

    await expect(page.getByTestId('panel-news')).toContainText('Ei uutisia saatavilla');
  });

  test('tapping a todo row opens its read-only detail dialog', async ({ page }) => {
    await stubReads(page, {
      todos: {
        data: [
          {
            id: 'todo-detail',
            title: 'Vie roskat',
            description: 'Biojäte ja pahvi maanantaina.',
            completed: false,
            priority: 'high',
            dueDate: '2026-09-01',
            sortOrder: 0,
            createdAt: '2026-08-20T08:00:00Z',
            updatedAt: '2026-08-20T08:00:00Z',
          },
        ],
      },
    });

    await page.goto('/');

    // The visible row content stays the accessible name; the "open details" hint is
    // only a description, so a screen reader still announces priority and due date.
    const row = page.getByRole('button', { name: /^Vie roskat/ });
    await expect(row).toHaveAccessibleName(/korkea/);
    await expect(row).toHaveAccessibleDescription('Avaa tehtävän tiedot');
    await row.click();

    const dialog = page.getByTestId('todo-detail-dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Vie roskat');
    await expect(dialog).toContainText('Kesken');
    await expect(dialog).toContainText('korkea');
    await expect(dialog.getByTestId('todo-detail-dialog-description')).toContainText(
      'Biojäte ja pahvi maanantaina.',
    );
    // Read-only on the kiosk: no edit or delete affordances.
    await expect(dialog.getByRole('button', { name: /Muokkaa|Poista/ })).toHaveCount(0);

    await dialog.getByTestId('todo-detail-dialog-close').click();
    await expect(dialog).toBeHidden();
  });

  test('a todo without a description says so in the detail dialog', async ({ page }) => {
    await stubReads(page, {
      todos: {
        data: [
          {
            id: 'todo-bare',
            title: 'Soita lääkärille',
            description: null,
            completed: true,
            priority: 'medium',
            dueDate: null,
            sortOrder: 0,
            createdAt: '2026-08-20T08:00:00Z',
            updatedAt: '2026-08-20T08:00:00Z',
          },
        ],
      },
    });

    await page.goto('/');

    await page.getByRole('button', { name: /^Soita lääkärille/ }).click();

    const dialog = page.getByTestId('todo-detail-dialog');
    await expect(dialog).toContainText('Ei kuvausta');
    await expect(dialog).toContainText('Valmis');
  });

  test('tapping a calendar event opens its detail dialog, dismissible by backdrop tap', async ({
    page,
  }) => {
    await stubReads(page, {
      'calendar/events': {
        data: [
          {
            id: 'evt-1',
            title: 'Hammaslääkäri',
            description: 'Muista Kela-kortti.',
            location: 'Kamppi',
            startTime: '2026-09-02T07:00:00.000Z',
            endTime: '2026-09-02T08:00:00.000Z',
            allDay: false,
            color: null,
            source: 'manual',
            createdAt: '2026-08-20T08:00:00Z',
            updatedAt: '2026-08-20T08:00:00Z',
          },
        ],
      },
    });

    await page.goto('/');

    await page.getByRole('button', { name: /^Hammaslääkäri/ }).click();

    const dialog = page.getByTestId('event-detail-dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Kamppi');
    await expect(dialog).toContainText('Lisätty käsin');
    await expect(dialog.getByTestId('event-detail-dialog-description')).toContainText(
      'Muista Kela-kortti.',
    );

    // Tapping the backdrop (the top-left corner is outside the centred dialog) closes it.
    await page.mouse.click(5, 5);
    await expect(dialog).toBeHidden();
  });

  test('expanding the transport panel shows all departures grouped by stop', async ({ page }) => {
    const departures = Array.from({ length: 14 }, (_, i) => ({
      id: `dep-${i}`,
      stopId: i % 2 === 0 ? 'HSL:1' : 'HSL:2',
      routeShortName: `${550 + i}`,
      headsign: `Kohde ${i}`,
      scheduledDeparture: 40_000 + i * 120,
      realtimeDeparture: null,
      departureDelay: 0,
      isRealtime: false,
      serviceDay: '2026-08-29',
      vehicleType: 'BUS',
      fetchedAt: '2026-08-29T08:00:00Z',
    }));

    await stubReads(page, {
      'transport/departures': { data: departures },
      'transport/stops': {
        data: [
          {
            id: 'HSL:1',
            name: 'Rautatientori',
            code: 'H1234',
            platform: '3',
            latitude: 60.17,
            longitude: 24.94,
            vehicleType: 'BUS',
            distanceM: 120,
            createdAt: '2026-08-01T00:00:00Z',
            updatedAt: '2026-08-01T00:00:00Z',
          },
          {
            id: 'HSL:2',
            name: 'Kaisaniemi',
            code: 'H4321',
            platform: null,
            latitude: 60.18,
            longitude: 24.95,
            vehicleType: 'BUS',
            distanceM: 260,
            createdAt: '2026-08-01T00:00:00Z',
            updatedAt: '2026-08-01T00:00:00Z',
          },
        ],
      },
    });

    await page.goto('/');

    // The compact panel caps the list at 10 of the 14 departures.
    const panel = page.getByTestId('panel-transport');
    await expect(panel.locator('ul > li')).toHaveCount(10);

    await page.getByTestId('panel-transport-expand').click();

    const expanded = page.getByTestId('panel-transport-expanded');
    await expect(expanded).toBeVisible();
    await expect(expanded).toContainText('Rautatientori');
    await expect(expanded).toContainText('laituri 3');
    await expect(expanded).toContainText('Kaisaniemi');
    // All 14 departures, split across the two stop groups.
    await expect(expanded.getByTestId('transport-stop-groups').locator('> li')).toHaveCount(2);
    await expect(expanded.getByText(/Kohde \d+/)).toHaveCount(14);

    await expanded.getByTestId('panel-transport-expanded-close').click();
    await expect(expanded).toBeHidden();
  });

  test('the expanded calendar panel still opens event detail dialogs', async ({ page }) => {
    await stubReads(page, {
      'calendar/events': {
        data: [
          {
            id: 'evt-2',
            title: 'Kokous',
            description: 'Neljännesvuosikatsaus.',
            location: null,
            startTime: '2026-09-03T07:00:00.000Z',
            endTime: '2026-09-03T08:00:00.000Z',
            allDay: false,
            color: null,
            source: 'manual',
            createdAt: '2026-08-20T08:00:00Z',
            updatedAt: '2026-08-20T08:00:00Z',
          },
        ],
      },
    });

    await page.goto('/');

    await page.getByTestId('panel-calendar-expand').click();

    const expanded = page.getByTestId('panel-calendar-expanded');
    await expect(expanded).toBeVisible();
    // The full-screen view surfaces the description inline as well.
    await expect(expanded).toContainText('Neljännesvuosikatsaus.');

    await expanded.getByRole('button', { name: /^Kokous/ }).click();
    await expect(page.getByTestId('event-detail-dialog')).toBeVisible();
  });

  test('the expanded weather panel shows the full 24-hour forecast', async ({ page }) => {
    const now = Date.now();
    const hours = Array.from({ length: 24 }, (_, i) => ({
      forecastTime: new Date(now + i * 3_600_000).toISOString(),
      temperature: 8,
      apparentTemp: 6,
      weatherCode: 2,
      precipitation: 0,
      precipitationProbability: 0,
      windSpeed: 12,
      windDirection: 200,
      humidity: 70,
      cloudCover: 40,
      fetchedAt: new Date(now).toISOString(),
    }));
    await stubReads(page, { 'weather/forecast': { data: hours } });

    await page.goto('/');

    // Compact shows half a day.
    const panel = page.getByTestId('panel-weather');
    await expect(panel.locator('ul > li')).toHaveCount(12);

    await page.getByTestId('panel-weather-expand').click();

    const expanded = page.getByTestId('panel-weather-expanded');
    await expect(expanded).toBeVisible();
    await expect(expanded.locator('ul > li')).toHaveCount(24);
  });

  test('the QR modal opens on top of the expanded news panel', async ({ page }) => {
    const now = Date.now();
    await stubReads(page, {
      news: {
        data: [
          {
            guid: 'yle-1',
            title: 'Laajennettu juttu',
            link: 'https://yle.fi/a/expanded',
            summary: 'Tiivistelmä näkyy vain laajennetussa näkymässä.',
            publishedAt: new Date(now - 60_000).toISOString(),
            source: 'yle',
            fetchedAt: new Date(now).toISOString(),
          },
        ],
      },
    });

    await page.goto('/');

    await page.getByTestId('panel-news-expand').click();

    const expanded = page.getByTestId('panel-news-expanded');
    // The summary is the extra detail the full-screen view adds.
    await expect(expanded).toContainText('Tiivistelmä näkyy vain laajennetussa näkymässä.');

    await expanded.getByText('Laajennettu juttu').click();

    const qr = page.getByTestId('news-qr-modal');
    await expect(qr).toBeVisible();
    await expect(qr.getByTestId('news-qr-image')).toBeVisible();

    // Escape closes only the topmost dialog; the expanded panel stays open.
    await page.keyboard.press('Escape');
    await expect(qr).toBeHidden();
    await expect(expanded).toBeVisible();
  });

  test('panels with no data offer no expand affordance', async ({ page }) => {
    await stubReads(page);

    await page.goto('/');

    await expect(page.getByTestId('panel-calendar')).toContainText('Ei tulevia tapahtumia');
    await expect(page.getByTestId('panel-calendar-expand')).toHaveCount(0);
    await expect(page.getByTestId('panel-todos-expand')).toHaveCount(0);
  });

  test('electricity panel shows "tomorrow pending" note when only today is published', async ({
    page,
  }) => {
    const now = new Date();
    const startOfHelsinkiToday = new Date(
      now.toLocaleString('en-US', { timeZone: 'Europe/Helsinki' }),
    );
    startOfHelsinkiToday.setHours(0, 0, 0, 0);
    // Generate prices only for "today" Helsinki time — no tomorrow entries.
    const data = Array.from({ length: 6 }, (_, i) => ({
      hourStart: new Date(startOfHelsinkiToday.getTime() + i * 3_600_000).toISOString(),
      priceCentsPerKwh: 5,
      fetchedAt: now.toISOString(),
    }));
    await stubReads(page, { 'electricity/prices': { data } });

    await page.goto('/');

    await expect(page.getByTestId('electricity-tomorrow-pending')).toBeVisible();
  });
});

function localDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

interface MakeTodoOptions {
  id: string;
  title: string;
  dayOffset: number;
  sortOrder?: number;
  priority?: 'low' | 'medium' | 'high';
}

function makeTodo({ id, title, dayOffset, sortOrder = 0, priority = 'medium' }: MakeTodoOptions) {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  return {
    id,
    title,
    description: null,
    completed: false,
    priority,
    dueDate: localDateKey(date),
    sortOrder,
    createdAt: '2026-04-10T12:00:00Z',
    updatedAt: '2026-04-10T12:00:00Z',
  };
}

const NEWS_ITEM = {
  guid: 'yle-1',
  title: 'Iltajuttu',
  link: 'https://yle.fi/a/late',
  summary: null,
  publishedAt: '2026-04-17T20:00:00.000Z',
  source: 'yle',
  fetchedAt: '2026-04-17T20:00:00.000Z',
};

async function openAdminQrDialog(page: Page) {
  await page.getByTestId('admin-qr-button').click();
}

async function openNewsQrDialog(page: Page) {
  await page.getByTestId('panel-news').getByText(NEWS_ITEM.title).click();
}

test.describe('kiosk sleep mode', () => {
  const FAR_FUTURE = '2999-01-01T00:00:00.000Z';
  // Mirrors REFRESH_MS in useDisplaySettings.
  const DISPLAY_POLL_MS = 30_000;

  function sleepDisplay(override: 'auto' | 'wake' | 'sleep', enabled = true) {
    return {
      data: {
        sleep: {
          enabled,
          start: '23:00',
          end: '06:30',
          override,
          overrideUntil: override === 'auto' ? null : FAR_FUTURE,
        },
      },
    };
  }

  test('shows the sleep overlay when the display config is asleep, and a tap wakes it', async ({
    page,
  }) => {
    await stubReads(page, { 'settings/display': sleepDisplay('sleep') });
    await page.goto('/');

    const overlay = page.getByTestId('sleep-overlay');
    await expect(overlay).toHaveAttribute('data-asleep', 'true');

    // A tap wakes the dashboard for the idle window.
    await overlay.click();
    await expect(overlay).toHaveAttribute('data-asleep', 'false');
  });

  // A <dialog> opened with showModal() lives in the browser's top layer, which
  // paints above the sleep overlay whatever its z-index. Without an explicit
  // teardown these dialogs would stay lit through the whole sleep window.
  for (const dialog of [
    { name: 'admin QR', open: openAdminQrDialog, testId: 'admin-qr-modal' },
    { name: 'news QR', open: openNewsQrDialog, testId: 'news-qr-modal' },
  ]) {
    test(`closes the ${dialog.name} dialog when the sleep window begins`, async ({ page }) => {
      let mode: 'wake' | 'sleep' = 'wake';
      await page.route(apiPath('settings/display'), (route) =>
        route.fulfill({
          json: {
            data: {
              sleep: {
                enabled: true,
                start: '23:00',
                end: '06:30',
                override: mode,
                overrideUntil: FAR_FUTURE,
              },
            },
          },
        }),
      );
      await stubReads(page, { news: { data: [NEWS_ITEM] } });

      // Lets us jump the 30s display-config poll instead of waiting it out.
      await page.clock.install();
      await page.goto('/');
      await dialog.open(page);
      await expect(page.getByTestId(dialog.testId)).toBeVisible();

      // The sleep window arrives while the dialog is still open.
      mode = 'sleep';
      await page.clock.fastForward(DISPLAY_POLL_MS + 1_000);
      await expect(page.getByTestId('sleep-overlay')).toHaveAttribute('data-asleep', 'true');

      await expect(page.getByTestId(dialog.testId)).toBeHidden();
    });
  }

  test('stays awake when the schedule is disabled', async ({ page }) => {
    await stubReads(page, { 'settings/display': sleepDisplay('auto', false) });
    await page.goto('/');

    await expect(page.getByTestId('sleep-overlay')).toHaveAttribute('data-asleep', 'false');
    await expect(page.getByTestId('panel-weather')).toBeVisible();
  });
});
