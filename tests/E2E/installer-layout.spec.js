const { test, expect } = require('@playwright/test');

test('fresh installer uses the Bootstrap 5 form layout @fresh-installer', async ({ page }) => {
  test.skip(process.env.E2E_FRESH_INSTALLER !== '1', 'requires a fresh, unconfigured installation');

  if (page.viewportSize().width < 768) {
    await page.setViewportSize({ width: 320, height: 720 });
  }
  await page.goto('/install/index.php?route=install/step_3');

  const dbDriver = page.locator('#input-db-driver');
  await expect(dbDriver).toBeVisible();
  await expect(dbDriver).toHaveClass(/\bform-select\b/);
  expect(await dbDriver.evaluate(select =>
    getComputedStyle(select).getPropertyValue('--bs-form-select-bg-img').trim()
  )).toContain('url(');

  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(page.viewportSize().width + 1);

  const label = await page.locator('label[for="input-db-driver"]').boundingBox();
  const select = await dbDriver.boundingBox();
  if (page.viewportSize().width >= 768) {
    expect(select.x).toBeGreaterThan(label.x);
    expect(Math.abs(select.y - label.y)).toBeLessThan(8);
  } else {
    expect(select.y).toBeGreaterThanOrEqual(label.y + label.height - 1);
  }

  const password = page.locator('#input-password');
  const toggle = page.locator('button[data-password-target="#input-password"]');
  await expect(password).toHaveAttribute('type', 'password');
  await toggle.click();
  await expect(password).toHaveAttribute('type', 'text');
  await toggle.click();
  await expect(password).toHaveAttribute('type', 'password');
});
