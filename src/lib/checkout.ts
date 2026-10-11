import { normaliseNigerianPhone, validEmail } from './phone'
import { LAGOS_AREAS, STATES } from './places'

export interface Contact {
  name: string
  email: string
  phone: string
}

export interface Address {
  state: string
  area: string
  street: string
  landmark: string
}

export type FieldErrors<T> = Partial<Record<keyof T, string>>

export function validateContact(c: Contact): FieldErrors<Contact> {
  const e: FieldErrors<Contact> = {}
  if (c.name.trim().length < 2) e.name = 'Tell us who the order is for'
  if (!c.email.trim()) e.email = 'We send your receipt here'
  else if (!validEmail(c.email)) e.email = 'That email doesn’t look right'
  if (!c.phone.trim()) e.phone = 'The rider will call this number'
  else if (!normaliseNigerianPhone(c.phone)) e.phone = 'Use a Nigerian mobile number, like 0803 123 4567'
  return e
}

export function validateAddress(a: Address, pickup = false): FieldErrors<Address> {
  const e: FieldErrors<Address> = {}
  if (!(STATES as readonly string[]).includes(a.state)) e.state = 'Choose a state'
  if (pickup) return e
  if (a.state === 'Lagos') {
    if (!(LAGOS_AREAS as readonly string[]).includes(a.area)) e.area = 'Choose your area'
  } else if (a.area.trim().length < 2) e.area = 'Enter your town or city'
  if (a.street.trim().length < 6) e.street = 'Add a house number and street'
  return e
}

export const hasErrors = (e: object) => Object.keys(e).length > 0
