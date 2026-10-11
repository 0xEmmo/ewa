import { describe, expect, it } from 'vitest'
import { hasErrors, validateAddress, validateContact } from './checkout'

describe('validateContact', () => {
  it('accepts a complete contact', () => {
    expect(validateContact({ name: 'Ada Obi', email: 'ada@example.com', phone: '0803 123 4567' })).toEqual({})
  })
  it('flags every missing field with a useful message', () => {
    const e = validateContact({ name: '', email: 'ada@', phone: '12345' })
    expect(e).toEqual({
      name: 'Tell us who the order is for',
      email: 'That email doesn’t look right',
      phone: 'Use a Nigerian mobile number, like 0803 123 4567',
    })
  })
})

describe('validateAddress', () => {
  it('needs a known Lagos area in Lagos', () => {
    expect(validateAddress({ state: 'Lagos', area: 'Narnia', street: '12 Admiralty Way', landmark: '' })).toEqual({ area: 'Choose your area' })
    expect(validateAddress({ state: 'Lagos', area: 'Yaba', street: '12 Herbert Macaulay Way', landmark: '' })).toEqual({})
  })
  it('takes a free-text town elsewhere', () => {
    expect(hasErrors(validateAddress({ state: 'Kano', area: 'Nassarawa GRA', street: '4 Bompai Road', landmark: '' }))).toBe(false)
  })
  it('only needs a state for pickup', () => {
    expect(validateAddress({ state: 'Oyo', area: '', street: '', landmark: '' }, true)).toEqual({})
    expect(validateAddress({ state: 'Atlantis', area: '', street: '', landmark: '' }, true)).toEqual({ state: 'Choose a state' })
  })
})
