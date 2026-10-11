import { products } from '@/data/products'
import type { Concern, Product, SkinType } from '@/data/types'

export interface QuizAnswers {
  skinType: SkinType
  concerns: Concern[]
  /** Reacts to fragrance or acids. */
  reactive: boolean
  sun: 'indoors' | 'some' | 'lots'
  size: 'essentials' | 'full'
  pregnant: boolean
}

export type StepName = 'Cleanse' | 'Tone' | 'Treat' | 'Hydrate' | 'Moisturise' | 'Protect' | 'Seal'

export interface RoutineStep {
  step: StepName
  slug: string
  why: string
}

export interface Routine {
  am: RoutineStep[]
  pm: RoutineStep[]
  notes: string[]
}

const ACTIVES = new Set(['overnight-renewal-cream', 'aha-clarifying-toner'])

function allowed(p: Product, a: QuizAnswers) {
  if (a.pregnant && !p.pregnancySafe) return false
  if (a.reactive && (ACTIVES.has(p.slug) || !p.fragranceFree)) return false
  return true
}

function score(p: Product, a: QuizAnswers) {
  const overlap = p.concerns.filter((c) => a.concerns.includes(c)).length
  const fits = p.skinTypes.includes(a.skinType) || (a.reactive && p.skinTypes.includes('sensitive'))
  return overlap * 3 + (fits ? 1 : -2)
}

function pick(candidates: Product[], a: QuizAnswers, exclude: Set<string>) {
  return candidates
    .filter((p) => allowed(p, a) && !exclude.has(p.slug))
    .map((p) => ({ p, s: score(p, a) }))
    .filter(({ s }) => s > 0)
    .sort((x, y) => y.s - x.s)[0]?.p
}

const byCategory = (cat: Product['category'], when?: 'am' | 'pm') =>
  products.filter((p) => p.category === cat && (!when || p.when === when || p.when === 'both'))

const concernPhrase: Record<Concern, string> = {
  'dark-spots': 'fade dark marks',
  dryness: 'deal with dryness',
  breakouts: 'keep breakouts down',
  oiliness: 'control shine',
  sensitivity: 'calm reactive skin',
  dullness: 'brighten dullness',
  texture: 'smooth texture',
}

function whyTreat(p: Product, a: QuizAnswers) {
  const hits = p.concerns.filter((c) => a.concerns.includes(c))
  return hits.length ? `Chosen to ${hits.map((c) => concernPhrase[c]).join(' and ')}.` : 'A gentle all-rounder for your skin type.'
}

/**
 * A small rules engine: one cleanser, the best-matching treatment(s), a
 * moisturiser, and sunscreen every morning. Keeps actives out of reactive
 * or pregnant routines, and never doubles up on strong actives at night.
 */
export function buildRoutine(a: QuizAnswers): Routine {
  const notes: string[] = []
  const used = new Set<string>()
  const am: RoutineStep[] = []
  const pm: RoutineStep[] = []

  const cleanser = byCategory('cleanse')[0]!
  const cleanseWhy = a.skinType === 'dry' ? 'Gentle enough for dry skin if you keep it to 30 seconds.' : 'Lifts sweat, oil and sunscreen without stripping.'
  am.push({ step: 'Cleanse', slug: cleanser.slug, why: cleanseWhy })
  pm.push({ step: 'Cleanse', slug: cleanser.slug, why: cleanseWhy })

  const amTreat = pick(byCategory('treat', 'am'), a, new Set(['kaolin-and-baobab-clay-mask', 'overnight-renewal-cream']))
  if (amTreat) {
    am.push({ step: 'Treat', slug: amTreat.slug, why: whyTreat(amTreat, a) })
    used.add(amTreat.slug)
  }

  const moisturiser = products.find((p) => p.slug === 'barrier-repair-cream')!
  am.push({ step: 'Moisturise', slug: moisturiser.slug, why: 'Ceramides keep water in and support everything else you use.' })

  const sunscreen = byCategory('protect')[0]!
  am.push({
    step: 'Protect',
    slug: sunscreen.slug,
    why:
      a.sun === 'lots'
        ? 'You are outdoors a lot: reapply at lunchtime. Sun is the main reason dark marks stick around.'
        : 'Every morning, even indoors. Sun darkens existing marks on deep skin.',
  })

  // Night: one strong active at most, then hydration.
  const nightActives = products.filter((p) => ACTIVES.has(p.slug))
  const pmActive = pick(nightActives, a, used)
  if (pmActive) {
    pm.push({ step: pmActive.category === 'tone' ? 'Tone' : 'Treat', slug: pmActive.slug, why: whyTreat(pmActive, a) })
    used.add(pmActive.slug)
    if (pmActive.slug === 'overnight-renewal-cream') notes.push('Start the retinal cream twice a week and build up over a month.')
    if (pmActive.slug === 'aha-clarifying-toner') notes.push('Use the toner on three nights a week, not every night.')
  }

  const wantsHydration = a.size === 'full' || !pmActive || a.concerns.includes('dryness') || a.reactive
  if (wantsHydration) {
    const hydrator = products.find((p) => p.slug === 'deep-drink-hyaluronic-serum')!
    if (!used.has(hydrator.slug)) pm.push({ step: 'Hydrate', slug: hydrator.slug, why: 'Pat onto damp skin so your moisturiser has water to seal in.' })
  }

  pm.push({ step: 'Moisturise', slug: moisturiser.slug, why: 'Your last step at night, to repair while you sleep.' })

  if (a.size === 'full' && (a.skinType === 'dry' || a.concerns.includes('dryness'))) {
    pm.push({ step: 'Seal', slug: 'marula-face-oil', why: 'A few drops over moisturiser on harmattan nights.' })
  }

  if (a.size === 'essentials') {
    // Trim to a cleanser, one treatment, moisturiser and sunscreen in the morning; three steps at night.
    while (pm.length > 3) pm.splice(pm.length - 2, 1)
  }

  if (a.pregnant) notes.push('We have left out retinal, which isn’t recommended during pregnancy or breastfeeding.')
  if (a.reactive) notes.push('Patch test new products on your jaw for two days before using them all over.')
  if (a.concerns.includes('dark-spots')) notes.push('Marks fade over 8 to 12 weeks. Sunscreen is what makes the difference.')

  return { am, pm, notes }
}

export function routineProducts(r: Routine): string[] {
  return [...new Set([...r.am, ...r.pm].map((s) => s.slug))]
}
