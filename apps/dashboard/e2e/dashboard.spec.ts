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
    reminders: EMPTY,
    'transport/departures': EMPTY,
    'weather/current': WEATHER_CURRENT,
    'weather/forecast': EMPTY,
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

  test('hides optional panels when their data is empty', async ({ page }) => {
    await stubReads(page);
    await page.goto('/');

    // Wait for the weather panel (which always renders) so we know the app has mounted.
    await expect(page.getByTestId('panel-weather')).toBeVisible();

    await expect(page.getByTestId('panel-calendar')).toHaveCount(0);
    await expect(page.getByTestId('panel-todos')).toHaveCount(0);
    await expect(page.getByTestId('panel-reminders')).toHaveCount(0);
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
    await expect(page.getByTestId('panel-calendar')).toHaveCount(0);
    await expect(page.getByTestId('panel-reminders')).toHaveCount(0);
  });

  test('toggling a todo calls the toggle endpoint', async ({ page }) => {
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
      reminders: EMPTY,
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

    const toggle = page.getByRole('button', {
      name: /Mark "Buy milk" as done/,
    });
    await expect(toggle).toBeVisible();
    await toggle.click();

    await expect.poll(() => toggled, { timeout: 2000 }).toBe(true);
  });
});
