const { test, expect } = require('@playwright/test');

/**
 * Storefront visual/interaction regression guard.
 * Executes on the disposable CodeCart QA installation, never on production.
 * Geometry thresholds intentionally allow font/image rendering differences
 * across Chromium, Firefox and WebKit.
 */
const categoryPath = process.env.E2E_CATEGORY_PATH || '/index.php?route=product/category&path=20';

async function checkNoOverflow(page, label) {
  const sizes = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth
  }));
  expect.soft(sizes.document, label + ' document overflow')
    .toBeLessThanOrEqual(sizes.viewport + 2);
}

async function box(locator) {
  return locator.boundingBox();
}

test.describe('Storefront geometry and interactions', () => {
  test('header, search and cart remain usable at the active viewport', async ({ page }, testInfo) => {
    await page.goto('/');
    await expect(page.locator('#logo')).toBeVisible();
    await expect(page.locator('#search input[name="search"]')).toBeVisible();
    await expect(page.locator('#cart > button')).toBeVisible();
    await checkNoOverflow(page, 'home');

    const search = page.locator('#search');
    const input = page.locator('#search input[name="search"]');
    const button = page.locator('#search button').first();
    const [s, i, b] = await Promise.all([box(search), box(input), box(button)]);
    expect(s && i && b).toBeTruthy();
    // A previous Bootstrap 5 compatibility regression wrapped the search
    // button onto a second line on mobile.
    expect.soft(Math.abs(i.y - b.y), 'search input/button same row').toBeLessThanOrEqual(12);
    expect.soft(s.height, 'search occupies one row').toBeLessThanOrEqual(58);
    expect.soft(i.width, 'usable search field').toBeGreaterThan(80);

    await input.fill('MacBook');
    await expect(input).toHaveValue('MacBook');
    await page.locator('#cart > button').click();
    await expect(page.locator('#cart .dropdown-menu')).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('home-layout.png'), fullPage: false });
  });

  test('category, subcategories and product cards fill grid tracks', async ({ page }, testInfo) => {
    await page.goto(categoryPath);
    await expect(page.locator('#product-category #content')).toBeVisible();
    await checkNoOverflow(page, 'category');

    const container = page.locator('#product-category');
    const width = page.viewportSize().width;
    const containerBox = await box(container);
    if (width >= 1200) {
      expect.soft(containerBox.width, 'desktop category max width').toBeLessThanOrEqual(1502);
    }

    const subgrid = page.locator('#product-category .ccp-subcategory-grid');
    if (await subgrid.count()) {
      const item = subgrid.locator(':scope > div').first();
      if (await item.count()) {
        const group = await box(subgrid);
        const itemBox = await box(item);
        expect.soft(itemBox.width, 'subcategory must not collapse to 40px').toBeGreaterThan(95);
        expect.soft(itemBox.width, 'subcategory inside its grid').toBeLessThanOrEqual(group.width + 2);
      }
    }

    const grid = page.locator('#product-category .ccp-product-grid');
    const items = grid.locator(':scope > .product-layout.product-grid');
    await expect(items.first()).toBeVisible();
    const [g, c] = await Promise.all([box(grid), box(items.first())]);
    if (width >= 1200) {
      const columns = await grid.evaluate(node => {
        const styles = getComputedStyle(node);
        return styles.gridTemplateColumns.split(' ').filter(Boolean).length;
      });
      const hasSidebar = await page.locator('#product-category #column-left').count() > 0 ||
        await page.locator('#product-category > .row > #content.col-sm-9').count() > 0;
      expect.soft(columns, 'desktop catalog column count').toBe(hasSidebar ? 4 : 5);
    }

    expect.soft(c.width, 'product grid cell width').toBeGreaterThan(120);
    expect.soft(c.width, 'product does not exceed grid').toBeLessThanOrEqual(g.width + 2);
    const thumb = await box(items.first().locator('.product-thumb'));
    expect.soft(thumb.width, 'card fills grid cell').toBeGreaterThanOrEqual(c.width - 3);

    if (width < 768 && await items.count() >= 2) {
      const second = await box(items.nth(1));
      expect.soft(Math.abs(second.y - c.y), 'two mobile cards share row').toBeLessThan(5);
      expect.soft(second.x, 'second card to right').toBeGreaterThan(c.x + c.width - 2);
    }
    await page.screenshot({ path: testInfo.outputPath('category-layout.png'), fullPage: false });
  });

  test('product image, options and purchase controls respect columns', async ({ page }, testInfo) => {
    await page.goto(categoryPath);
    const productLink = page.locator('#product-category .ccp-product-grid .product-thumb h4 a').first();
    await expect(productLink).toBeVisible();
    await productLink.click();
    await expect(page.locator('#product-product')).toBeVisible();
    await checkNoOverflow(page, 'product');

    const media = page.locator('#product-product .ccp-product-media').first();
    const summary = page.locator('#product-product .ccp-product-summary').first();
    const [m, s] = await Promise.all([box(media), box(summary)]);
    expect(m && s).toBeTruthy();
    if (page.viewportSize().width < 768) {
      expect.soft(s.y, 'summary follows gallery on mobile').toBeGreaterThan(m.y + m.height - 3);
    } else {
      expect.soft(Math.abs(m.y - s.y), 'desktop gallery and summary same row').toBeLessThan(20);
    }

    const gallery = page.locator('#product-product .ccp-product-gallery-main > .thumbnail');
    if (await gallery.count()) {
      const g = await box(gallery);
      expect.soft(g.width, 'gallery width').toBeLessThanOrEqual(m.width + 3);
      if (page.viewportSize().width >= 1200) {
        expect.soft(g.height, 'desktop gallery is capped').toBeLessThanOrEqual(610);
      }
    }
    const quantity = page.locator('#input-quantity');
    if (await quantity.count()) {
      await expect(quantity).toBeVisible();
      const before = await quantity.inputValue();
      await page.locator('.ccp-qty-plus').first().click();
      const after = await quantity.inputValue();
      expect(Number(after)).toBeGreaterThanOrEqual(Number(before) + 1);
    }
    await page.screenshot({ path: testInfo.outputPath('product-layout.png'), fullPage: false });
  });
});
