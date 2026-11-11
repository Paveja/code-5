import { expect, test, type Page } from 'playwright/test';

const baseURL = process.env.BASE_URL;
test.use({ baseURL });

function displayPanel(page: Page) {
  return page.locator('[aria-live="polite"]');
}

async function pressButtons(page: Page, labels: string[]) {
  for (const label of labels) {
    await page.getByRole('button', { name: label, exact: true }).click();
  }
}

test.describe('calculator page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders the initial calculator state and accessible controls', async ({ page }) => {
    await expect(page).toHaveTitle('Clear Answer — Everyday Calculator');
    await expect(page.getByRole('heading', { name: 'The clear answer.' })).toBeVisible();
    await expect(page.getByText('Ready', { exact: true })).toBeVisible();
    await expect(displayPanel(page).getByText('0', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Calculator keypad')).toBeVisible();
    await expect(page.getByText('Your completed calculations will land here.', { exact: true })).toBeVisible();

    const namedButtons = [
      'AC',
      'Backspace',
      'Percent',
      'divide',
      'multiply',
      'minus',
      'plus',
      '0',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '.',
      '=',
    ];
    for (const name of namedButtons) {
      await expect(page.getByRole('button', { name, exact: true })).toBeVisible();
    }
  });

  test('performs all four arithmetic operations and records history', async ({ page }) => {
    const cases = [
      { input: ['7', 'plus', '3', '='], expression: '7 + 3', result: '10' },
      { input: ['9', 'minus', '4', '='], expression: '9 − 4', result: '5' },
      { input: ['6', 'multiply', '7', '='], expression: '6 × 7', result: '42' },
      { input: ['8', 'divide', '2', '='], expression: '8 ÷ 2', result: '4' },
    ];

    for (const calculation of cases) {
      await pressButtons(page, calculation.input);
      await expect(displayPanel(page).getByText(calculation.result, { exact: true })).toBeVisible();
      await expect(
        page.getByRole('button', {
          name: `${calculation.expression} ${calculation.result}`,
          exact: false,
        })
      ).toBeVisible();
    }
  });

  test('handles decimal input, repeated decimals, and percentages', async ({ page }) => {
    await pressButtons(page, ['1', '.', '2', '.', '5', 'plus', '0', '.', '5', '=']);
    await expect(displayPanel(page).getByText('1.75', { exact: true })).toBeVisible();

    await pressButtons(page, ['AC', '5', '0', 'Percent']);
    await expect(displayPanel(page).getByText('0.5', { exact: true })).toBeVisible();
  });

  test('supports backspace and clear-all', async ({ page }) => {
    await pressButtons(page, ['1', '2', '3', 'Backspace']);
    await expect(displayPanel(page).getByText('12', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'AC', exact: true }).click();
    await expect(displayPanel(page).getByText('0', { exact: true })).toBeVisible();
    await expect(page.getByText('Ready when you are', { exact: true })).toBeVisible();
  });

  test('repeats the last operation when equals is pressed again', async ({ page }) => {
    await pressButtons(page, ['2', 'plus', '3', '=']);
    await expect(displayPanel(page).getByText('5', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: '=', exact: true }).click();
    await expect(displayPanel(page).getByText('8', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '5 + 3', exact: false })).toBeVisible();
  });

  test('shows an error and no invalid history for division by zero', async ({ page }) => {
    await pressButtons(page, ['9', 'divide', '0', '=']);

    await expect(displayPanel(page).getByText('Cannot divide by zero', { exact: true })).toBeVisible();
    await expect(page.getByText('Your completed calculations will land here.', { exact: true })).toBeVisible();
    await expect(displayPanel(page).getByText('0', { exact: true })).toBeVisible();
  });

  test('supports keyboard input for calculation and editing controls', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'The clear answer.' })).toBeVisible();
    await page.keyboard.press('1');
    await page.keyboard.press('2');
    await page.keyboard.press('+');
    await page.keyboard.press('3');
    await page.keyboard.press('Enter');
    await expect(displayPanel(page).getByText('15', { exact: true })).toBeVisible();

    await page.keyboard.press('Backspace');
    await expect(displayPanel(page).getByText('1', { exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(displayPanel(page).getByText('0', { exact: true })).toBeVisible();

    await page.keyboard.type('50%');
    await expect(displayPanel(page).getByText('0.5', { exact: true })).toBeVisible();
  });

  test('restores history results, clears history, and does not retain it after refresh', async ({ page }) => {
    await pressButtons(page, ['4', 'plus', '6', '=']);
    const historyEntry = page.getByRole('button', { name: '4 + 6 10', exact: false });
    await expect(historyEntry).toBeVisible();

    await pressButtons(page, ['9']);
    await historyEntry.click();
    await expect(displayPanel(page).getByText('10', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Clear', exact: true }).click();
    await expect(page.getByText('Your completed calculations will land here.', { exact: true })).toBeVisible();

    await pressButtons(page, ['2', 'multiply', '3', '=']);
    await page.reload();
    await expect(page.getByText('Your completed calculations will land here.', { exact: true })).toBeVisible();
  });

  test('moves focus to the first keypad control and keeps controls keyboard reachable', async ({ page }) => {
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'AC', exact: true })).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(displayPanel(page).getByText('0', { exact: true })).toBeVisible();

    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Backspace', exact: true })).toBeFocused();
  });
});

test.describe('calculator responsive layout', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('keeps calculator and history usable on a phone viewport', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'The clear answer.' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Recent work' })).toBeVisible();
    await expect(page.getByRole('button', { name: '0', exact: true })).toBeVisible();

    const bodyWidth = await page.locator('body').evaluate((body) => body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(390);
  });
});
