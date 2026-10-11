import AxeBuilder from '@axe-core/playwright'
import { test, expect, type Page } from '@playwright/test'

export { test, expect }
export type { Page }

export async function expectAccessible(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([])
}

export const isMobile = (page: Page) => (page.viewportSize()?.width ?? 1440) < 900

/** Bag contents are persisted, so tests can start mid-journey. */
export async function seedBag(page: Page, lines: { slug: string; variantId: string; shadeId?: string; qty: number; routineId?: string }[]) {
  await page.addInitScript((l) => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem('ewa.cart', JSON.stringify({ state: { lines: l, promoCode: null }, version: 1 }))
      sessionStorage.setItem('seeded', '1')
    }
  }, lines)
}
