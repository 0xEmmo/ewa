import { describe, expect, it } from 'vitest'
import { formatNaira } from './money'

describe('formatNaira', () => {
  it('formats whole naira with the sign and separators', () => {
    expect(formatNaira(18500)).toBe('₦18,500')
    expect(formatNaira(0)).toBe('₦0')
  })
  it('rounds kobo away', () => {
    expect(formatNaira(1999.6)).toBe('₦2,000')
  })
})
