import { describe, expect, it } from 'vitest'
import { answersFromQuery, answersToQuery } from './quizParams'

describe('quiz params', () => {
  it('round-trips answers through the URL', () => {
    const a = { skinType: 'oily', concerns: ['breakouts', 'dark-spots'], reactive: true, sun: 'lots', size: 'full', pregnant: false } as const
    expect(answersFromQuery(new URLSearchParams(answersToQuery({ ...a, concerns: [...a.concerns] })))).toEqual(a)
  })

  it('rejects missing or unknown values', () => {
    expect(answersFromQuery(new URLSearchParams('skin=scaly&sun=some&size=full'))).toBeNull()
    expect(answersFromQuery(new URLSearchParams('skin=dry'))).toBeNull()
  })

  it('drops unknown concerns and caps at three', () => {
    const a = answersFromQuery(new URLSearchParams('skin=dry&sun=some&size=full&c=dryness,warts,texture,dullness,breakouts'))
    expect(a?.concerns).toEqual(['dryness', 'texture', 'dullness'])
  })
})
