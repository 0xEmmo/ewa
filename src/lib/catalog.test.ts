import { products } from '@/data/products'
import { describe, expect, it } from 'vitest'
import { emptyFilters, filterProducts, filtersToQuery, parseFilters, searchScore, requireProduct } from './catalog'

describe('parseFilters / filtersToQuery', () => {
  it('round-trips through the URL', () => {
    const f = { ...emptyFilters, q: 'serum', category: 'treat' as const, concerns: ['dark-spots' as const, 'dryness' as const], skinType: 'oily' as const, maxPrice: 20000, inStock: true, sort: 'price-asc' as const }
    const q = filtersToQuery(f)
    expect(q).toBe('?q=serum&category=treat&concern=dark-spots%2Cdryness&skin=oily&max=20000&stock=1&sort=price-asc')
    expect(parseFilters(new URLSearchParams(q.slice(1)))).toEqual({ ...f, brand: null })
  })

  it('drops values it does not know', () => {
    const f = parseFilters({ category: 'shoes', concern: 'dryness,nonsense', skin: 'scaly', sort: 'random', max: '-5', brand: 'acme' })
    expect(f).toEqual({ ...emptyFilters, concerns: ['dryness'] })
  })

  it('omits defaults', () => {
    expect(filtersToQuery(emptyFilters)).toBe('')
  })
})

describe('search', () => {
  it('ignores diacritics so "oro" finds Ọ̀rọ̀ Botanicals', () => {
    const results = filterProducts(products, { ...emptyFilters, q: 'oro' })
    expect(results.length).toBeGreaterThan(3)
    expect(results.every((p) => p.brandId === 'oro')).toBe(true)
  })

  it('requires every word and ranks name matches first', () => {
    expect(searchScore(requireProduct('even-tone-serum'), 'niacinamide serum')).toBeGreaterThan(0)
    expect(searchScore(requireProduct('even-tone-serum'), 'niacinamide lipstick')).toBe(0)
    const [first] = filterProducts(products, { ...emptyFilters, q: 'shea' })
    expect(first!.name).toMatch(/shea/i)
  })

  it('finds products by shade name', () => {
    expect(filterProducts(products, { ...emptyFilters, q: 'hibiscus' }).map((p) => p.slug)).toEqual(['satin-lipstick'])
  })
})

describe('filterProducts', () => {
  it('matches any selected concern', () => {
    const r = filterProducts(products, { ...emptyFilters, concerns: ['breakouts', 'sensitivity'] })
    expect(r.every((p) => p.concerns.includes('breakouts') || p.concerns.includes('sensitivity'))).toBe(true)
  })

  it('applies price ceiling to the cheapest size', () => {
    const r = filterProducts(products, { ...emptyFilters, maxPrice: 10000 })
    expect(r.map((p) => p.slug)).toContain('black-soap-gel-cleanser')
    expect(r.map((p) => p.slug)).not.toContain('even-tone-serum')
  })

  it('sorts by price both ways', () => {
    const asc = filterProducts(products, { ...emptyFilters, sort: 'price-asc' })
    const desc = filterProducts(products, { ...emptyFilters, sort: 'price-desc' })
    expect(asc[0]!.slug).toBe('oat-and-shea-soap-bar')
    expect(desc[0]!.slug).toBe('overnight-renewal-cream')
  })

  it('puts bestsellers first by default', () => {
    expect(filterProducts(products, emptyFilters)[0]!.badge).toBe('bestseller')
  })
})
