import type { Concern, SkinType } from '@/data/types'
import { concernLabels, skinTypeLabels } from './catalog'
import type { QuizAnswers } from './routine'

const SKIN = Object.keys(skinTypeLabels) as SkinType[]
const CONCERNS = Object.keys(concernLabels) as Concern[]
const SUN = ['indoors', 'some', 'lots'] as const
const SIZE = ['essentials', 'full'] as const

type Params = { get(name: string): string | null }

/** Results live in the URL so a routine can be bookmarked or shared. */
export function answersToQuery(a: QuizAnswers) {
  const q = new URLSearchParams({
    skin: a.skinType,
    c: a.concerns.join(','),
    r: a.reactive ? '1' : '0',
    sun: a.sun,
    size: a.size,
    p: a.pregnant ? '1' : '0',
  })
  return q.toString()
}

export function answersFromQuery(p: Params): QuizAnswers | null {
  const skin = p.get('skin') as SkinType | null
  const sun = p.get('sun') as QuizAnswers['sun'] | null
  const size = p.get('size') as QuizAnswers['size'] | null
  if (!skin || !SKIN.includes(skin) || !sun || !SUN.includes(sun) || !size || !SIZE.includes(size)) return null
  const concerns = (p.get('c') ?? '').split(',').filter((c): c is Concern => CONCERNS.includes(c as Concern)).slice(0, 3)
  return { skinType: skin, concerns, reactive: p.get('r') === '1', sun, size, pregnant: p.get('p') === '1' }
}
