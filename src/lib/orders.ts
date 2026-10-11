import type { Address, Contact, FieldErrors } from './checkout'
import { hasErrors, validateAddress, validateContact } from './checkout'
import { simulateCharge, validateCard, type CardErrors, type CardInput } from './payment'
import {
  applyPromo,
  computeTotals,
  deliveryOptions,
  MAX_PER_LINE,
  priceLines,
  type CartLine,
  type DeliveryMethod,
  type DeliveryOption,
  type Totals,
} from './pricing'

export type PaymentMethod = 'card' | 'transfer' | 'cod'
export const COD_LIMIT = 100000

export interface CheckoutRequest {
  lines: CartLine[]
  promoCode?: string
  contact: Contact
  address: Address
  delivery: DeliveryMethod
  payment: { method: PaymentMethod; card?: CardInput }
  previousOrders: number
}

export interface OrderLine {
  slug: string
  name: string
  brandId: string
  variantLabel: string
  shadeName?: string
  qty: number
  unitPrice: number
  photo: string
}

export interface Order {
  id: string
  placedAt: string
  lines: OrderLine[]
  totals: Totals
  promoCode?: string
  contact: Contact
  address: Address
  delivery: DeliveryOption
  payment: { method: PaymentMethod; last4?: string; reference: string }
  cancelledAt?: string
}

export type CheckoutResult =
  | { ok: true; order: Order }
  | {
      ok: false
      kind: 'invalid' | 'payment' | 'stock' | 'empty'
      message: string
      fields?: { contact?: FieldErrors<Contact>; address?: FieldErrors<Address>; card?: CardErrors }
    }

const ORDER_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function orderId(rand: () => number = Math.random) {
  let s = 'EWA-'
  for (let i = 0; i < 6; i++) s += ORDER_ALPHABET[Math.floor(rand() * ORDER_ALPHABET.length)]
  return s
}

const lagosHour = (now: Date) => Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hour12: false, timeZone: 'Africa/Lagos' }).format(now))
const lagosDate = (now: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos' }).format(now)

/**
 * The whole checkout, run on the server: re-price from the catalogue, check
 * stock, validate every field, apply the promo, then "charge".
 */
export function placeOrder(req: CheckoutRequest, now = new Date(), rand: () => number = Math.random): CheckoutResult {
  // the bag clamps quantities itself, so anything outside 1..10 here was not sent by the app
  if ((req.lines ?? []).some((l) => !Number.isInteger(l.qty) || l.qty < 1 || l.qty > MAX_PER_LINE)) {
    return { ok: false, kind: 'invalid', message: 'One of the quantities in your bag isn’t valid.' }
  }
  const lines = priceLines(req.lines ?? [])
  if (!lines.length) return { ok: false, kind: 'empty', message: 'Your bag is empty.' }

  const short = lines.find((l) => l.qty > l.available)
  if (short) {
    const what = `${short.product.name} (${short.variantLabel})`
    return {
      ok: false,
      kind: 'stock',
      message: short.available === 0 ? `${what} has just sold out.` : `Only ${short.available} of ${what} left. Lower the quantity to continue.`,
    }
  }

  const options = deliveryOptions(req.address?.state ?? null, lagosHour(now))
  const delivery = options.find((o) => o.id === req.delivery)
  const contactErrors = validateContact(req.contact)
  const addressErrors = validateAddress(req.address, req.delivery === 'pickup')
  let cardErrors: CardErrors = {}
  if (req.payment.method === 'card') cardErrors = validateCard(req.payment.card ?? { number: '', expiry: '', cvv: '', name: '' }, now)

  if (hasErrors(contactErrors) || hasErrors(addressErrors) || hasErrors(cardErrors) || !delivery) {
    return {
      ok: false,
      kind: 'invalid',
      message: !delivery ? 'Choose a delivery option.' : 'Some details need fixing.',
      fields: { contact: contactErrors, address: addressErrors, card: cardErrors },
    }
  }

  const pre = computeTotals(lines)
  const promo = req.promoCode
    ? applyPromo(req.promoCode, { lines, subtotal: pre.subtotal, previousOrders: req.previousOrders, today: lagosDate(now) })
    : null
  const totals = computeTotals(lines, { promo, delivery })

  if (req.payment.method === 'cod' && (req.address.state !== 'Lagos' || totals.total > COD_LIMIT)) {
    return { ok: false, kind: 'payment', message: 'Pay on delivery is only for Lagos orders under ₦100,000.' }
  }

  const id = orderId(rand)
  let last4: string | undefined
  if (req.payment.method === 'card') {
    const result = simulateCharge(req.payment.card!.number, id)
    if (!result.ok) return { ok: false, kind: 'payment', message: result.message }
    last4 = req.payment.card!.number.replace(/\D/g, '').slice(-4)
  }

  return {
    ok: true,
    order: {
      id,
      placedAt: now.toISOString(),
      lines: lines.map((l) => ({
        slug: l.slug,
        name: l.product.name,
        brandId: l.product.brandId,
        variantLabel: l.variantLabel,
        shadeName: l.shadeName,
        qty: l.qty,
        unitPrice: l.unitPrice,
        photo: l.product.photos[0]!.name,
      })),
      totals,
      promoCode: promo?.ok ? promo.code : undefined,
      contact: req.contact,
      address: req.address,
      delivery,
      payment: { method: req.payment.method, last4, reference: `PAY-${id.slice(4)}` },
    },
  }
}

/* ---------------- tracking ---------------- */

export type TrackingStage = 'placed' | 'confirmed' | 'packed' | 'on-the-way' | 'delivered'

export const STAGES: { id: TrackingStage; label: string; pickupLabel?: string }[] = [
  { id: 'placed', label: 'Order placed' },
  { id: 'confirmed', label: 'Payment confirmed' },
  { id: 'packed', label: 'Packed at our Lekki studio', pickupLabel: 'Packed' },
  { id: 'on-the-way', label: 'With the rider', pickupLabel: 'Ready to collect' },
  { id: 'delivered', label: 'Delivered', pickupLabel: 'Collected' },
]

/**
 * Demo time runs fast so the timeline moves while you watch: minutes after
 * placing the order at which each stage is reached.
 */
export const STAGE_MINUTES: Record<TrackingStage, number> = { placed: 0, confirmed: 1, packed: 3, 'on-the-way': 6, delivered: 12 }

export function trackingStage(order: Pick<Order, 'placedAt' | 'payment' | 'cancelledAt'>, now = new Date()) {
  if (order.cancelledAt) return 'cancelled' as const
  const mins = (now.getTime() - new Date(order.placedAt).getTime()) / 60000
  let stage: TrackingStage = 'placed'
  for (const s of STAGES) {
    // Transfers wait for the money to land before anything else happens.
    const offset = order.payment.method === 'transfer' && s.id !== 'placed' ? 1 : 0
    if (mins >= STAGE_MINUTES[s.id] + offset) stage = s.id
  }
  return stage
}

export const canCancel = (order: Order, now = new Date()) => {
  const s = trackingStage(order, now)
  return s === 'placed' || s === 'confirmed'
}
