import { describe, expect, it } from 'vitest'
import {
  applyPromo,
  computeTotals,
  deliveryOptions,
  freeDeliveryProgress,
  priceLines,
  routineDiscount,
  type CartLine,
  type PromoContext,
} from './pricing'

const ctx = (lines: CartLine[], extra: Partial<PromoContext> = {}): PromoContext => {
  const priced = priceLines(lines)
  return { lines: priced, subtotal: priced.reduce((s, l) => s + l.lineTotal, 0), previousOrders: 0, today: '2026-10-11', ...extra }
}

describe('priceLines', () => {
  it('takes prices from the catalogue, not the cart', () => {
    const [line] = priceLines([{ slug: 'even-tone-serum', variantId: '60ml', qty: 2 }])
    expect(line!.unitPrice).toBe(31000)
    expect(line!.lineTotal).toBe(62000)
  })

  it('drops unknown products, unknown variants and missing shades', () => {
    expect(
      priceLines([
        { slug: 'nope', variantId: 'x', qty: 1 },
        { slug: 'even-tone-serum', variantId: '5l', qty: 1 },
        { slug: 'satin-lipstick', variantId: 'single', qty: 1 },
        { slug: 'satin-lipstick', variantId: 'single', shadeId: 'mauve', qty: 1 },
      ]),
    ).toEqual([])
  })

  it('clamps quantities between 1 and 10', () => {
    const lines = priceLines([
      { slug: 'oat-and-shea-soap-bar', variantId: 'single', qty: 40 },
      { slug: 'unrefined-shea-butter', variantId: '250g', qty: -3 },
    ])
    expect(lines.map((l) => l.qty)).toEqual([10, 1])
  })
})

describe('routineDiscount', () => {
  const routine: CartLine[] = [
    { slug: 'black-soap-gel-cleanser', variantId: '150ml', qty: 1, routineId: 'r1' },
    { slug: 'even-tone-serum', variantId: '30ml', qty: 1, routineId: 'r1' },
    { slug: 'barrier-repair-cream', variantId: '50ml', qty: 1, routineId: 'r1' },
  ]

  it('takes 10% off a complete routine', () => {
    expect(routineDiscount(priceLines(routine))).toBe(Math.round((9800 + 18500 + 19500) * 0.1))
  })

  it('stops once fewer than three products remain', () => {
    expect(routineDiscount(priceLines(routine.slice(0, 2)))).toBe(0)
  })

  it('ignores items added on their own', () => {
    expect(routineDiscount(priceLines([...routine, { slug: 'satin-lipstick', variantId: 'single', shadeId: 'kola', qty: 1 }]))).toBe(4780)
  })
})

describe('applyPromo', () => {
  const bag: CartLine[] = [{ slug: 'even-tone-serum', variantId: '30ml', qty: 2 }]

  it('is case-insensitive and applies a percentage', () => {
    const r = applyPromo(' ewa10 ', ctx(bag))
    expect(r).toMatchObject({ ok: true, code: 'EWA10', discount: 3700 })
  })

  it('explains how far off the minimum spend you are', () => {
    const r = applyPromo('EWA10', ctx([{ slug: 'oat-and-shea-soap-bar', variantId: 'single', qty: 1 }]))
    expect(r).toEqual({ ok: false, code: 'EWA10', message: 'Spend ₦16,500 more to use EWA10' })
  })

  it('rejects expired, unknown and repeat-customer codes', () => {
    expect(applyPromo('DETTY25', ctx(bag))).toMatchObject({ ok: false, message: 'DETTY25 has expired' })
    expect(applyPromo('FREEMONEY', ctx(bag))).toMatchObject({ ok: false })
    expect(applyPromo('FIRSTGLOW', ctx(bag, { previousOrders: 2 }))).toMatchObject({ ok: false, message: 'FIRSTGLOW is for first orders only' })
  })

  it('only discounts qualifying categories', () => {
    expect(applyPromo('HARMATTAN', ctx(bag))).toMatchObject({ ok: false })
    const r = applyPromo('HARMATTAN', ctx([...bag, { slug: 'whipped-shea-body-butter', variantId: 'unscented', qty: 1 }]))
    expect(r).toMatchObject({ ok: true, discount: 1800 })
  })
})

describe('delivery', () => {
  it('offers express same-day only before noon in Lagos', () => {
    expect(deliveryOptions('Lagos', 10).find((o) => o.id === 'lagos-express')!.eta).toMatch(/Today/)
    expect(deliveryOptions('Lagos', 15).find((o) => o.id === 'lagos-express')!.eta).toMatch(/Tomorrow/)
  })

  it('sends everyone else nationwide or to pickup', () => {
    expect(deliveryOptions('Kano', 10).map((o) => o.id)).toEqual(['nationwide', 'pickup'])
    expect(deliveryOptions(null, 10)).toEqual([])
  })

  it('shows progress towards free delivery', () => {
    expect(freeDeliveryProgress(30000, 'Lagos')).toEqual({ target: 40000, remaining: 10000, ratio: 0.75 })
    expect(freeDeliveryProgress(80000, 'Oyo').remaining).toBe(0)
  })
})

describe('computeTotals', () => {
  const lines = priceLines([{ slug: 'even-tone-serum', variantId: '30ml', qty: 1 }])
  const lagos = deliveryOptions('Lagos', 9)

  it('charges standard delivery under the threshold and none above it', () => {
    expect(computeTotals(lines, { delivery: lagos[0] })).toMatchObject({ subtotal: 18500, delivery: 2000, total: 20500 })
    const big = priceLines([{ slug: 'even-tone-serum', variantId: '60ml', qty: 2 }])
    expect(computeTotals(big, { delivery: lagos[0] }).delivery).toBe(0)
  })

  it('FREESHIP does not cover express', () => {
    const big = priceLines([{ slug: 'even-tone-serum', variantId: '30ml', qty: 2 }])
    const promo = applyPromo('FREESHIP', ctx([{ slug: 'even-tone-serum', variantId: '30ml', qty: 2 }]))
    expect(computeTotals(big, { promo, delivery: lagos[0] }).delivery).toBe(0)
    expect(computeTotals(big, { promo, delivery: lagos[1] }).delivery).toBe(3500)
  })

  it('charges nothing for delivery on an empty bag', () => {
    expect(computeTotals([], { delivery: lagos[0] }).total).toBe(0)
  })
})
