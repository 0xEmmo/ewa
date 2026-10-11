import { describe, expect, it } from 'vitest'
import { TEST_CARDS } from './payment'
import { canCancel, placeOrder, trackingStage, type CheckoutRequest } from './orders'

const morning = new Date('2026-10-12T09:30:00+01:00')
const good: CheckoutRequest = {
  lines: [{ slug: 'even-tone-serum', variantId: '30ml', qty: 1 }],
  contact: { name: 'Ada Obi', email: 'ada@example.com', phone: '08031234567' },
  address: { state: 'Lagos', area: 'Yaba', street: '12 Herbert Macaulay Way', landmark: '' },
  delivery: 'lagos-standard',
  payment: { method: 'card', card: { number: TEST_CARDS.success, expiry: '12/29', cvv: '123', name: 'Ada Obi' } },
  previousOrders: 0,
}

describe('placeOrder', () => {
  it('re-prices on the server and records only the last four digits', () => {
    const r = placeOrder({ ...good, lines: [{ ...good.lines[0]!, qty: 2 }] }, morning, () => 0)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.order.id).toBe('EWA-AAAAAA')
    expect(r.order.totals).toMatchObject({ subtotal: 37000, delivery: 2000, total: 39000 })
    expect(r.order.payment.last4).toBe('4081')
    expect(JSON.stringify(r.order)).not.toContain('4084084084084081')
  })

  it('applies a valid promo and ignores an invalid one', () => {
    const withPromo = placeOrder({ ...good, lines: [{ ...good.lines[0]!, qty: 2 }], promoCode: 'ewa10' }, morning)
    expect(withPromo.ok && withPromo.order.totals.promoDiscount).toBe(3700)
    const bogus = placeOrder({ ...good, promoCode: 'NOPE' }, morning)
    expect(bogus.ok && bogus.order.promoCode).toBeUndefined()
  })

  it('returns field errors together', () => {
    const r = placeOrder({ ...good, contact: { name: '', email: '', phone: '' }, payment: { method: 'card', card: { number: '1', expiry: '', cvv: '', name: '' } } }, morning)
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.kind).toBe('invalid')
    expect(Object.keys(r.fields!.contact!)).toEqual(['name', 'email', 'phone'])
    expect(r.fields!.card!.number).toBeDefined()
  })

  it('passes on a declined card', () => {
    const r = placeOrder({ ...good, payment: { method: 'card', card: { ...good.payment.card!, number: TEST_CARDS.declined } } }, morning)
    expect(r).toMatchObject({ ok: false, kind: 'payment' })
  })

  it('refuses sold-out variants and quantities over stock', () => {
    expect(placeOrder({ ...good, lines: [{ slug: 'deep-drink-hyaluronic-serum', variantId: '60ml', qty: 1 }] }, morning)).toMatchObject({ ok: false, kind: 'stock' })
    const r = placeOrder({ ...good, lines: [{ slug: 'rose-quartz-gua-sha', variantId: 'one', qty: 5 }] }, morning)
    expect(r).toMatchObject({ ok: false, kind: 'stock', message: 'Only 3 of Rose Quartz Gua Sha (One stone, pouch) left. Lower the quantity to continue.' })
  })

  it('limits pay on delivery to Lagos', () => {
    const r = placeOrder({ ...good, address: { state: 'Oyo', area: 'Bodija', street: '3 Awolowo Avenue', landmark: '' }, delivery: 'nationwide', payment: { method: 'cod' } }, morning)
    expect(r).toMatchObject({ ok: false, kind: 'payment' })
  })

  it('rejects delivery options that do not exist for the state', () => {
    const r = placeOrder({ ...good, address: { ...good.address, state: 'Kano', area: 'Fagge' }, delivery: 'lagos-express' }, morning)
    expect(r).toMatchObject({ ok: false, message: 'Choose a delivery option.' })
  })
})

describe('tracking', () => {
  const order = { placedAt: '2026-10-12T09:00:00.000Z', payment: { method: 'card' as const, reference: 'x' } }
  const at = (mins: number) => new Date(Date.parse(order.placedAt) + mins * 60000)

  it('moves through the stages over demo minutes', () => {
    expect(trackingStage(order, at(0))).toBe('placed')
    expect(trackingStage(order, at(2))).toBe('confirmed')
    expect(trackingStage(order, at(7))).toBe('on-the-way')
    expect(trackingStage(order, at(60))).toBe('delivered')
  })

  it('holds transfers a minute longer', () => {
    expect(trackingStage({ ...order, payment: { method: 'transfer', reference: 'x' } }, at(1.5))).toBe('placed')
  })

  it('can be cancelled until it is packed', () => {
    const r = placeOrder(good, new Date(order.placedAt))
    if (!r.ok) throw new Error('setup')
    expect(canCancel(r.order, at(2))).toBe(true)
    expect(canCancel(r.order, at(4))).toBe(false)
    expect(trackingStage({ ...order, cancelledAt: at(1).toISOString() }, at(30))).toBe('cancelled')
  })
})
