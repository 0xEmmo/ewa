import { requireProduct } from '@/lib/catalog'
import { describe, expect, it } from 'vitest'
import { rankShades } from './shades'

const spf = requireProduct('sheer-mineral-sunscreen-spf-50').shades!

describe('rankShades', () => {
  it('matches depth first', () => {
    expect(rankShades(spf, { depth: 5, undertone: 'neutral' })[0]!.id).toBe('ebony')
    expect(rankShades(spf, { depth: 2, undertone: 'warm' })[0]!.id).toBe('amber')
  })

  it('breaks a tie towards the deeper shade', () => {
    // depth 4 sits between cocoa (3) and ebony (5)
    expect(rankShades(spf, { depth: 4, undertone: 'neutral' })[0]!.id).toBe('ebony')
  })

  it('uses undertone when depth is equal', () => {
    const lips = requireProduct('satin-lipstick').shades!
    expect(rankShades(lips, { depth: 3, undertone: 'cool' })[0]!.id).toBe('hibiscus')
    expect(rankShades(lips, { depth: 3, undertone: 'warm' })[0]!.id).toBe('osun')
  })
})
