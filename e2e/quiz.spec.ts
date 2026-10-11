import { expect, expectAccessible, test } from './fixtures'

test('quiz builds a shareable routine and adds it to the bag', async ({ page }) => {
  await page.goto('/quiz')
  await expectAccessible(page)
  await page.getByRole('button', { name: 'Start the quiz' }).click()
  await page.getByRole('radio', { name: /^Oily/ }).check()
  await page.getByRole('checkbox', { name: 'Dark marks' }).check()
  await page.getByRole('checkbox', { name: 'Breakouts' }).check()
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('radio', { name: 'Rarely or never' }).check()
  await page.getByRole('radio', { name: /A bit/ }).check()
  await page.getByRole('radio', { name: 'No' }).check()
  await page.getByRole('radio', { name: /full routine/ }).check()

  await expect(page).toHaveURL(/skin=oily/)
  await expect(page.getByRole('heading', { name: 'Morning' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Night' })).toBeVisible()
  await expectAccessible(page)

  // the URL alone reproduces the result
  await page.reload()
  await expect(page.getByRole('heading', { name: /dark marks, breakouts/i })).toBeVisible()

  // the sunscreen is tinted, so it waits for a shade before it can join the bag
  await expect(page.getByRole('button', { name: /Add 5 of 6/ })).toBeVisible()
  await page.getByRole('group', { name: /Shade of Sheer Mineral/ }).first().getByRole('radio').first().check()
  await page.getByRole('button', { name: /Add all 6/ }).click()
  const bag = page.getByRole('dialog', { name: /Your bag/ })
  await expect(bag).toBeVisible()
  await expect(bag.getByText('Routine saving', { exact: true })).toBeVisible()
})

test('app is installable: manifest and service worker', async ({ page }) => {
  await page.goto('/')
  const manifest = await page.request.get('/manifest.webmanifest')
  expect(manifest.ok()).toBe(true)
  const json = await manifest.json()
  expect(json.display).toBe('standalone')
  expect(json.icons.some((i: { purpose?: string }) => i.purpose === 'maskable')).toBe(true)
  await expect.poll(() => page.evaluate(async () => !!(await navigator.serviceWorker.getRegistration())), { timeout: 10000 }).toBe(true)
})
