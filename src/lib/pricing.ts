import type { Category, Product } from '@/data/types'
import { productBySlug } from './catalog'

export const MAX_PER_LINE = 10

export interface CartLine {
  slug: string
  variantId: string
  shadeId?: string
  qty: number
  /** Set when added as part of a quiz routine; complete routines get a discount. */
  routineId?: string
}

export interface PricedLine extends CartLine {
  key: string
  product: Product
  variantLabel: string
  shadeName?: string
  unitPrice: number
  lineTotal: number
  available: number
}

export const lineKey = (l: Pick<CartLine, 'slug' | 'variantId' | 'shadeId'>) =>
  [l.slug, l.variantId, l.shadeId ?? ''].join(':')

/** Look prices up from the catalogue; never trust a price that came from the browser. */
export function priceLines(lines: CartLine[]): PricedLine[] {
  const out: PricedLine[] = []
  for (const l of lines) {
    const product = productBySlug(l.slug)
    const variant = product?.variants.find((v) => v.id === l.variantId)
    if (!product || !variant) continue
    const shade = l.shadeId ? product.shades?.find((s) => s.id === l.shadeId) : undefined
    if (product.shades && !shade) continue
    const qty = Math.max(1, Math.min(MAX_PER_LINE, Math.floor(l.qty)))
    out.push({
      ...l,
      qty,
      key: lineKey(l),
      product,
      variantLabel: variant.label,
      shadeName: shade?.name,
      unitPrice: variant.price,
      lineTotal: variant.price * qty,
      available: variant.stock,
    })
  }
  return out
}

/* ---------------- routine bundles ---------------- */

export const ROUTINE_DISCOUNT = 0.1
export const ROUTINE_MIN_ITEMS = 3

/** 10% off every line in a routine that is still at least three products strong. */
export function routineDiscount(lines: PricedLine[]): number {
  const groups = new Map<string, PricedLine[]>()
  for (const l of lines) if (l.routineId) groups.set(l.routineId, [...(groups.get(l.routineId) ?? []), l])
  let discount = 0
  for (const group of groups.values()) {
    if (new Set(group.map((l) => l.slug)).size < ROUTINE_MIN_ITEMS) continue
    discount += group.reduce((s, l) => s + l.lineTotal, 0) * ROUTINE_DISCOUNT
  }
  return Math.round(discount)
}

/* ---------------- promo codes ---------------- */

export interface PromoContext {
  lines: PricedLine[]
  /** Subtotal after routine savings. */
  subtotal: number
  previousOrders: number
  today: string
}

interface PromoRule {
  code: string
  description: string
  expires?: string
  minSpend?: number
  firstOrderOnly?: boolean
  apply: (ctx: PromoContext) => { discount: number; freeShipping?: boolean }
}

const categoryTotal = (lines: PricedLine[], cats: Category[]) =>
  lines.filter((l) => cats.includes(l.product.category)).reduce((s, l) => s + l.lineTotal, 0)

export const PROMOS: PromoRule[] = [
  { code: 'EWA10', description: '10% off orders over ₦20,000', minSpend: 20000, apply: ({ subtotal }) => ({ discount: Math.round(subtotal * 0.1) }) },
  { code: 'FIRSTGLOW', description: '₦3,000 off your first order over ₦15,000', minSpend: 15000, firstOrderOnly: true, apply: () => ({ discount: 3000 }) },
  { code: 'FREESHIP', description: 'Free delivery on orders over ₦25,000', minSpend: 25000, apply: () => ({ discount: 0, freeShipping: true }) },
  {
    code: 'HARMATTAN',
    description: '15% off moisturisers, oils and body care',
    apply: ({ lines }) => ({ discount: Math.round(categoryTotal(lines, ['moisturise', 'body']) * 0.15) }),
  },
  { code: 'DETTY25', description: 'December 2025 sale', expires: '2026-01-05', apply: ({ subtotal }) => ({ discount: Math.round(subtotal * 0.25) }) },
]

export type PromoResult =
  | { ok: true; code: string; description: string; discount: number; freeShipping: boolean }
  | { ok: false; code: string; message: string }

export function applyPromo(rawCode: string, ctx: PromoContext): PromoResult {
  const code = rawCode.trim().toUpperCase()
  const rule = PROMOS.find((p) => p.code === code)
  if (!code) return { ok: false, code, message: 'Enter a code' }
  if (!rule) return { ok: false, code, message: `We don’t recognise “${code}”` }
  if (rule.expires && ctx.today > rule.expires) return { ok: false, code, message: `${code} has expired` }
  if (rule.firstOrderOnly && ctx.previousOrders > 0) return { ok: false, code, message: `${code} is for first orders only` }
  if (rule.minSpend && ctx.subtotal < rule.minSpend) {
    return { ok: false, code, message: `Spend ${naira(rule.minSpend - ctx.subtotal)} more to use ${code}` }
  }
  const { discount, freeShipping = false } = rule.apply(ctx)
  if (discount === 0 && !freeShipping) return { ok: false, code, message: `Nothing in your bag qualifies for ${code}` }
  return { ok: true, code, description: rule.description, discount: Math.min(discount, ctx.subtotal), freeShipping }
}

const naira = (n: number) => `₦${n.toLocaleString('en-NG')}`

/* ---------------- delivery ---------------- */

export type DeliveryMethod = 'lagos-express' | 'lagos-standard' | 'nationwide' | 'pickup'

export interface DeliveryOption {
  id: DeliveryMethod
  label: string
  fee: number
  freeOver?: number
  eta: string
}

export const LAGOS_FREE_OVER = 40000
export const NATIONWIDE_FREE_OVER = 75000

/** Lagos orders placed before noon go out the same day. */
export function deliveryOptions(state: string | null, hour: number): DeliveryOption[] {
  if (!state) return []
  const pickup: DeliveryOption = { id: 'pickup', label: 'Pick up in Lekki', fee: 0, eta: 'Ready in 2 hours, Admiralty Way' }
  if (state === 'Lagos') {
    return [
      { id: 'lagos-standard', label: 'Standard', fee: 2000, freeOver: LAGOS_FREE_OVER, eta: 'Tomorrow' },
      { id: 'lagos-express', label: 'Express', fee: 3500, eta: hour < 12 ? 'Today, by 7pm' : 'Tomorrow, by noon' },
      pickup,
    ]
  }
  return [{ id: 'nationwide', label: 'Nationwide courier', fee: 4500, freeOver: NATIONWIDE_FREE_OVER, eta: '2 to 4 working days' }, pickup]
}

export function deliveryFee(option: DeliveryOption | undefined, subtotal: number, freeShipping: boolean) {
  if (!option) return 0
  if (freeShipping && option.id !== 'lagos-express') return 0
  if (option.freeOver && subtotal >= option.freeOver) return 0
  return option.fee
}

/** For the progress bar in the bag; assumes Lagos until we know better. */
export function freeDeliveryProgress(subtotal: number, state: string | null) {
  const target = !state || state === 'Lagos' ? LAGOS_FREE_OVER : NATIONWIDE_FREE_OVER
  return { target, remaining: Math.max(0, target - subtotal), ratio: Math.min(1, subtotal / target) }
}

/* ---------------- totals ---------------- */

export interface Totals {
  itemCount: number
  merchandise: number
  routineSavings: number
  subtotal: number
  promoDiscount: number
  delivery: number
  total: number
}

export function computeTotals(
  lines: PricedLine[],
  opts: { promo?: PromoResult | null; delivery?: DeliveryOption } = {},
): Totals {
  const merchandise = lines.reduce((s, l) => s + l.lineTotal, 0)
  const routineSavings = routineDiscount(lines)
  const subtotal = merchandise - routineSavings
  const promo = opts.promo?.ok ? opts.promo : null
  const promoDiscount = promo ? Math.min(promo.discount, subtotal) : 0
  const delivery = lines.length ? deliveryFee(opts.delivery, subtotal - promoDiscount, promo?.freeShipping ?? false) : 0
  return {
    itemCount: lines.reduce((s, l) => s + l.qty, 0),
    merchandise,
    routineSavings,
    subtotal,
    promoDiscount,
    delivery,
    total: subtotal - promoDiscount + delivery,
  }
}
