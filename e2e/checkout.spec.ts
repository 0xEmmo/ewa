import { expect, expectAccessible, seedBag, test, type Page } from './fixtures'

async function fillDetails(page: Page) {
  await page.getByLabel('Full name').fill('Ada Obi')
  await page.getByLabel('Email').fill('ada@example.com')
  await page.getByLabel('Phone').fill('08031234567')
  await page.getByLabel('State').selectOption('Lagos')
  await page.getByLabel('Area').selectOption('Yaba')
  await page.getByLabel('House number and street').fill('12 Herbert Macaulay Way')
  await page.getByRole('radio', { name: /standard/i }).check()
}

test.beforeEach(async ({ page }) => {
  await seedBag(page, [
    { slug: 'even-tone-serum', variantId: '30ml', qty: 1, routineId: 'r1' },
    { slug: 'black-soap-gel-cleanser', variantId: '150ml', qty: 1, routineId: 'r1' },
    { slug: 'barrier-repair-cream', variantId: '50ml', qty: 1, routineId: 'r1' },
  ])
})

test('bag page applies the routine saving for three products', async ({ page }) => {
  await page.goto('/bag')
  await expect(page.getByText('Routine saving (10%)')).toBeVisible()
  await expectAccessible(page)
})

test('checkout validates, survives a declined card, then places the order', async ({ page }) => {
  await page.goto('/checkout')
  await page.getByRole('button', { name: /^Pay/ }).click()
  await expect(page.getByLabel('Full name')).toBeFocused()
  await expect(page.getByText(/tell us who the order is for/i)).toBeVisible()

  await fillDetails(page)
  await page.getByLabel('Promo code').fill('ewa10')
  await page.getByRole('button', { name: 'Apply' }).click()
  await expect(page.getByText('EWA10', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'one that’s declined' }).click()
  await page.getByRole('button', { name: /^Pay/ }).click()
  await expect(page.getByRole('alert').filter({ hasText: /declined/i })).toBeVisible()
  await expectAccessible(page)

  await page.getByRole('button', { name: 'one that works' }).click()
  await page.getByRole('button', { name: /^Pay/ }).click()
  await expect(page).toHaveURL(/\/orders\/EWA-[A-Z0-9]{6}\?placed=1/)
  await expect(page.getByText(/Thank you, Ada/)).toBeVisible()
  await expect(page.getByText('Order placed')).toBeVisible()
  await expectAccessible(page)

  // bag is empty, order is listed
  await page.goto('/orders')
  await expect(page.getByRole('link', { name: /EWA-/ })).toHaveCount(1)
})

test('an order can be cancelled while it is still being confirmed', async ({ page }) => {
  await page.goto('/checkout')
  await fillDetails(page)
  await page.getByRole('radio', { name: 'Bank transfer' }).check()
  await page.getByRole('button', { name: 'Place order' }).click()
  await expect(page).toHaveURL(/\/orders\/EWA-/)
  await page.getByRole('button', { name: 'Cancel order' }).click()
  await page.getByRole('dialog', { name: 'Cancel this order?' }).getByRole('button', { name: 'Cancel order' }).click()
  await expect(page.getByRole('heading', { name: 'Cancelled' })).toBeVisible()
})

test('the server re-prices the bag and refuses a tampered quantity', async ({ request }) => {
  const res = await request.post('/api/checkout', {
    data: {
      lines: [{ slug: 'even-tone-serum', variantId: '30ml', qty: 999 }],
      contact: { name: 'Ada Obi', email: 'ada@example.com', phone: '08031234567' },
      address: { state: 'Lagos', area: 'Yaba', street: '1 Test St', landmark: '' },
      delivery: 'lagos-standard',
      payment: { method: 'transfer' },
      previousOrders: 0,
    },
  })
  expect(res.ok()).toBe(false)
  expect((await res.json()).ok).toBe(false)
})
