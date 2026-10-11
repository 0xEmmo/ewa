import { requireProduct } from '@/lib/catalog'
import { describe, expect, it } from 'vitest'
import { buildRoutine, routineProducts, type QuizAnswers } from './routine'

const base: QuizAnswers = { skinType: 'oily', concerns: ['dark-spots'], reactive: false, sun: 'some', size: 'full', pregnant: false }

describe('buildRoutine', () => {
  it('always cleanses, moisturises and ends the morning with sunscreen', () => {
    const r = buildRoutine(base)
    expect(r.am[0]!.step).toBe('Cleanse')
    expect(r.am.at(-1)!.slug).toBe('sheer-mineral-sunscreen-spf-50')
    expect(r.pm.at(-1)!.step === 'Moisturise' || r.pm.at(-1)!.step === 'Seal').toBe(true)
  })

  it('picks niacinamide for dark marks on oily skin', () => {
    expect(buildRoutine(base).am.map((s) => s.slug)).toContain('even-tone-serum')
  })

  it('never includes retinal when pregnant', () => {
    const r = buildRoutine({ ...base, concerns: ['texture', 'dark-spots'], pregnant: true })
    expect(routineProducts(r)).not.toContain('overnight-renewal-cream')
    expect(r.notes.join(' ')).toMatch(/pregnancy/)
  })

  it('keeps acids and fragrance away from reactive skin', () => {
    const r = buildRoutine({ ...base, skinType: 'sensitive', concerns: ['texture', 'breakouts'], reactive: true })
    for (const slug of routineProducts(r)) {
      const p = requireProduct(slug)
      if (slug === 'black-soap-gel-cleanser') continue
      expect(p.fragranceFree).toBe(true)
    }
    expect(routineProducts(r)).not.toContain('aha-clarifying-toner')
    expect(routineProducts(r)).not.toContain('overnight-renewal-cream')
  })

  it('uses at most one strong active at night', () => {
    const r = buildRoutine({ ...base, concerns: ['texture', 'breakouts'] })
    const actives = r.pm.filter((s) => ['overnight-renewal-cream', 'aha-clarifying-toner'].includes(s.slug))
    expect(actives).toHaveLength(1)
  })

  it('adds a face oil for dry skin in a full routine only', () => {
    const dry = { ...base, skinType: 'dry' as const, concerns: ['dryness' as const] }
    expect(routineProducts(buildRoutine(dry))).toContain('marula-face-oil')
    expect(routineProducts(buildRoutine({ ...dry, size: 'essentials' }))).not.toContain('marula-face-oil')
  })

  it('keeps an essentials night routine to three steps', () => {
    expect(buildRoutine({ ...base, size: 'essentials' }).pm).toHaveLength(3)
  })
})
