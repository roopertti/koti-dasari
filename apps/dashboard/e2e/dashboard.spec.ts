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
