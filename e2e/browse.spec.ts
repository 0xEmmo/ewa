import { expect, expectAccessible, isMobile, test } from './fixtures'

test('home page is accessible and leads into the shop', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expectAccessible(page)
  await page.getByRole('link', { name: /shop/i }).first().click()
  await expect(page).toHaveURL(/\/shop/)
})

test('filters live in the URL and narrow the grid', async ({ page }) => {
  await page.goto('/shop')
  await expect(page.getByText('18 products')).toBeVisible()
  await expectAccessible(page)
  if (isMobile(page)) {
    await page.getByRole('button', { name: /^Filter/ }).click()
    const dialog = page.getByRole('dialog', { name: 'Filter' })
    await dialog.getByRole('checkbox', { name: 'Dark marks' }).check()
    await dialog.getByRole('button', { name: /^Show \d/ }).click()
  } else {
    await page.getByRole('complementary', { name: 'Filters' }).getByRole('checkbox', { name: 'Dark marks' }).check()
  }
  await expect(page).toHaveURL(/concern=dark-spots/)
  await expect(page.getByText('5 products')).toBeVisible()
  await page.reload()
  await expect(page.getByText('5 products')).toBeVisible()
  await page.getByRole('list', { name: 'Active filters' }).getByRole('button').first().click()
  await expect(page.getByText('18 products')).toBeVisible()
})

test('search suggests products as you type', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Search' }).click()
  await page.getByRole('combobox', { name: /search products/i }).fill('shea')
  const hits = page.getByRole('listbox', { name: 'Suggestions' })
  await expect(hits.getByRole('option').first()).toBeVisible()
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/shop\/.*shea/)
})

test('product page: shade finder picks a shade and adds it to the bag', async ({ page }) => {
  await page.goto('/shop/sheer-mineral-sunscreen-spf-50')
  await expectAccessible(page)
  await page.getByRole('button', { name: 'Add to bag' }).first().click()
  // no shade yet: the page asks for one instead of guessing
  await expect(page.getByText(/choose a shade/i).first()).toBeVisible()
  await page.getByRole('button', { name: 'Help me choose' }).click()
  const finder = page.getByRole('dialog', { name: 'Find your shade' })
  await finder.getByRole('radio').first().check()
  await finder.getByRole('radio', { name: /warm/i }).check()
  await finder.getByRole('button', { name: /^Use / }).click()
  await page.getByRole('button', { name: 'Add to bag' }).first().click()
  await expect(page.getByText(/Added Sheer Mineral Sunscreen SPF 50 in .+ to your bag/)).toBeVisible()
  await page.getByRole('button', { name: 'View bag' }).click()
  await expect(page.getByRole('dialog', { name: /Your bag \(1\)/ })).toBeVisible()
})

test('wishlist survives a reload', async ({ page }) => {
  await page.goto('/shop/even-tone-serum')
  await page.getByRole('button', { name: /save/i }).first().click()
  await page.goto('/wishlist')
  await expect(page.getByText('1 saved product')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Even Tone Serum' })).toBeVisible()
  await expectAccessible(page)
})
