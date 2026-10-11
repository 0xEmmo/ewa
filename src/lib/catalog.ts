import { brandById } from '@/data/brands'
import { products } from '@/data/products'
import type { Category, Concern, Product, SkinType } from '@/data/types'

export const categoryLabels: Record<Category, string> = {
  cleanse: 'Cleansers',
  tone: 'Toners',
  treat: 'Serums & treatments',
  moisturise: 'Moisturisers & oils',
  protect: 'Sunscreen',
  body: 'Body',
  lips: 'Lips',
  tools: 'Tools',
}

export const concernLabels: Record<Concern, string> = {
  'dark-spots': 'Dark marks',
  dryness: 'Dryness',
  breakouts: 'Breakouts',
  oiliness: 'Oiliness',
  sensitivity: 'Sensitivity',
  dullness: 'Dullness',
  texture: 'Uneven texture',
}

export const skinTypeLabels: Record<SkinType, string> = {
  dry: 'Dry',
  oily: 'Oily',
  combination: 'Combination',
  normal: 'Normal',
  sensitive: 'Sensitive',
}

export type SortKey = 'featured' | 'price-asc' | 'price-desc' | 'rating' | 'new'
export const sortLabels: Record<SortKey, string> = {
  featured: 'Featured',
  'price-asc': 'Price, low to high',
  'price-desc': 'Price, high to low',
  rating: 'Best rated',
  new: 'Newest',
}

export interface Filters {
  q: string
  category: Category | null
  concerns: Concern[]
  skinType: SkinType | null
  brand: string | null
  maxPrice: number | null
  inStock: boolean
  sort: SortKey
}

export const emptyFilters: Filters = {
  q: '',
  category: null,
  concerns: [],
  skinType: null,
  brand: null,
  maxPrice: null,
  inStock: false,
  sort: 'featured',
}

type Params = Record<string, string | string[] | undefined> | URLSearchParams

function get(params: Params, key: string): string | undefined {
  if (params instanceof URLSearchParams) return params.get(key) ?? undefined
  const v = params[key]
  return Array.isArray(v) ? v[0] : v
}

const isIn = <T extends string>(map: Record<T, string>, v: string | undefined): v is T => !!v && v in map

/** Read filters from the URL, ignoring anything we don't recognise. */
export function parseFilters(params: Params): Filters {
  const category = get(params, 'category')
  const skin = get(params, 'skin')
  const sort = get(params, 'sort')
  const max = Number(get(params, 'max'))
  const concerns = (get(params, 'concern') ?? '').split(',').filter((c): c is Concern => isIn(concernLabels, c))
  const brand = get(params, 'brand')
  return {
    q: (get(params, 'q') ?? '').trim().slice(0, 80),
    category: isIn(categoryLabels, category) ? category : null,
    concerns,
    skinType: isIn(skinTypeLabels, skin) ? skin : null,
    brand: brand && brandExists(brand) ? brand : null,
    maxPrice: Number.isFinite(max) && max > 0 ? max : null,
    inStock: get(params, 'stock') === '1',
    sort: isIn(sortLabels, sort) ? sort : 'featured',
  }
}

function brandExists(id: string) {
  try {
    brandById(id)
    return true
  } catch {
    return false
  }
}

/** The inverse of parseFilters; only non-default values make it into the URL. */
export function filtersToQuery(f: Filters): string {
  const p = new URLSearchParams()
  if (f.q) p.set('q', f.q)
  if (f.category) p.set('category', f.category)
  if (f.concerns.length) p.set('concern', f.concerns.join(','))
  if (f.skinType) p.set('skin', f.skinType)
  if (f.brand) p.set('brand', f.brand)
  if (f.maxPrice) p.set('max', String(f.maxPrice))
  if (f.inStock) p.set('stock', '1')
  if (f.sort !== 'featured') p.set('sort', f.sort)
  const s = p.toString()
  return s ? `?${s}` : ''
}

export const fromPrice = (p: Product) => Math.min(...p.variants.map((v) => v.price))
export const inStock = (p: Product) => p.variants.some((v) => v.stock > 0)
export const averageRating = (p: Product) =>
  p.reviews.length ? p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length : 0

const normalise = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

function haystack(p: Product) {
  return normalise(
    [p.name, brandById(p.brandId).name, p.tagline, categoryLabels[p.category], ...p.concerns.map((c) => concernLabels[c]), ...p.keyIngredients.map((k) => k.name), ...(p.shades?.map((s) => s.name) ?? [])].join(' '),
  )
}

/** Every word must match somewhere; names count more than ingredients. */
export function searchScore(p: Product, q: string): number {
  const words = normalise(q).split(/\s+/).filter(Boolean)
  if (!words.length) return 1
  const hay = haystack(p)
  const name = normalise(p.name)
  let score = 0
  for (const w of words) {
    if (!hay.includes(w)) return 0
    score += name.includes(w) ? 3 : 1
  }
  return score
}

const badgeWeight = { bestseller: 3, restocked: 2, new: 1 } as const

export function filterProducts(list: Product[], f: Filters): Product[] {
  const scored = list
    .map((p) => ({ p, score: searchScore(p, f.q) }))
    .filter(({ p, score }) => {
      if (score === 0) return false
      if (f.category && p.category !== f.category) return false
      if (f.concerns.length && !f.concerns.some((c) => p.concerns.includes(c))) return false
      if (f.skinType && !p.skinTypes.includes(f.skinType)) return false
      if (f.brand && p.brandId !== f.brand) return false
      if (f.maxPrice && fromPrice(p) > f.maxPrice) return false
      if (f.inStock && !inStock(p)) return false
      return true
    })

  const by: Record<SortKey, (a: (typeof scored)[number], b: (typeof scored)[number]) => number> = {
    featured: (a, b) =>
      b.score - a.score || (b.p.badge ? badgeWeight[b.p.badge] : 0) - (a.p.badge ? badgeWeight[a.p.badge] : 0),
    'price-asc': (a, b) => fromPrice(a.p) - fromPrice(b.p),
    'price-desc': (a, b) => fromPrice(b.p) - fromPrice(a.p),
    rating: (a, b) => averageRating(b.p) - averageRating(a.p) || b.p.reviews.length - a.p.reviews.length,
    new: (a, b) => Number(b.p.badge === 'new') - Number(a.p.badge === 'new'),
  }
  // Array.prototype.sort is stable, so ties keep catalogue order.
  return scored.sort(by[f.sort]).map((s) => s.p)
}

export function activeFilterCount(f: Filters) {
  return (f.category ? 1 : 0) + f.concerns.length + (f.skinType ? 1 : 0) + (f.brand ? 1 : 0) + (f.maxPrice ? 1 : 0) + (f.inStock ? 1 : 0)
}

export function productBySlug(slug: string) {
  return products.find((p) => p.slug === slug)
}

export function requireProduct(slug: string) {
  const p = productBySlug(slug)
  if (!p) throw new Error(`Unknown product ${slug}`)
  return p
}
