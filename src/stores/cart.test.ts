import { beforeEach, describe, expect, it } from 'vitest'
import { lineKey } from '@/lib/pricing'
import { useCart } from './cart'

const serum = { slug: 'even-tone-serum', variantId: '30ml', qty: 1 }
const lipstick = { slug: 'satin-lipstick', variantId: 'single', shadeId: 'kola', qty: 1 }

describe('cart store', () => {
  beforeEach(() => useCart.setState({ lines: [], promoCode: null }))

  it('merges the same product, size and shade into one line', () => {
    useCart.getState().add(serum)
    useCart.getState().add({ ...serum, qty: 2 })
    useCart.getState().add({ ...lipstick, shadeId: 'zobo' })
    useCart.getState().add(lipstick)
    expect(useCart.getState().lines.map((l) => [lineKey(l), l.qty])).toEqual([
      ['even-tone-serum:30ml:', 3],
      ['satin-lipstick:single:zobo', 1],
      ['satin-lipstick:single:kola', 1],
    ])
  })

  it('caps a line at ten', () => {
    useCart.getState().add({ ...serum, qty: 8 })
    useCart.getState().add({ ...serum, qty: 8 })
    expect(useCart.getState().lines[0]!.qty).toBe(10)
  })

  it('restores a removed line at its old position', () => {
    useCart.getState().addMany([serum, lipstick, { slug: 'glaze-lip-oil', variantId: '6ml', shadeId: 'honey', qty: 1 }])
    const removed = useCart.getState().remove(lineKey(lipstick))!
    expect(useCart.getState().lines).toHaveLength(2)
    useCart.getState().restore(removed.line, removed.index)
    expect(useCart.getState().lines[1]!.slug).toBe('satin-lipstick')
  })

  it('persists to localStorage', () => {
    useCart.getState().add(serum)
    expect(JSON.parse(localStorage.getItem('ewa.cart')!).state.lines).toHaveLength(1)
  })
})
