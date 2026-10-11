'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useId, useMemo, useRef, useState, type FormEvent } from 'react'
import { Icon } from '@/components/Icon'
import { Photo } from '@/components/Photo'
import { useBag } from '@/hooks/useBag'
import { type Address, type Contact, type FieldErrors, hasErrors, validateAddress, validateContact } from '@/lib/checkout'
import { formatNaira } from '@/lib/money'
import { COD_LIMIT, type CheckoutResult, type PaymentMethod } from '@/lib/orders'
import { detectBrand, formatCardNumber, formatExpiry, TEST_CARDS, validateCard, type CardErrors, type CardInput } from '@/lib/payment'
import { LAGOS_AREAS, STATES } from '@/lib/places'
import { applyPromo, computeTotals, deliveryOptions, type DeliveryMethod } from '@/lib/pricing'
import { useCart } from '@/stores/cart'
import { useOrders } from '@/stores/orders'
import styles from './checkout.module.css'

const lagosHour = () => Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hour12: false, timeZone: 'Africa/Lagos' }).format(new Date()))
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos' }).format(new Date())

const BANK = { name: 'Ẹwà Beauty Ltd', bank: 'Demo Bank', account: '0123456789' }

export function CheckoutForm() {
  const router = useRouter()
  const { hydrated, lines } = useBag()
  const rawLines = useCart((s) => s.lines)
  const promoCode = useCart((s) => s.promoCode)
  const setPromo = useCart((s) => s.setPromo)
  const clear = useCart((s) => s.clear)
  const orders = useOrders((s) => s.orders)
  const addOrder = useOrders((s) => s.add)
  const ids = useId()

  const [contact, setContact] = useState<Contact>({ name: '', email: '', phone: '' })
  const [address, setAddress] = useState<Address>({ state: '', area: '', street: '', landmark: '' })
  const [delivery, setDelivery] = useState<DeliveryMethod | null>(null)
  const [method, setMethod] = useState<PaymentMethod>('card')
  const [card, setCard] = useState<CardInput>({ number: '', expiry: '', cvv: '', name: '' })
  const [promoInput, setPromoInput] = useState('')
  const [promoMessage, setPromoMessage] = useState<string | null>(null)
  const [errors, setErrors] = useState<{ contact: FieldErrors<Contact>; address: FieldErrors<Address>; card: CardErrors; delivery?: string }>({ contact: {}, address: {}, card: {} })
  const [banner, setBanner] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const bannerRef = useRef<HTMLDivElement>(null)

  const options = useMemo(() => deliveryOptions(address.state || null, lagosHour()), [address.state])
  const option = options.find((o) => o.id === delivery)
  const base = computeTotals(lines)
  const promo = promoCode ? applyPromo(promoCode, { lines, subtotal: base.subtotal, previousOrders: orders.length, today: today() }) : null
  const totals = computeTotals(lines, { promo, delivery: option })
  const codAllowed = address.state === 'Lagos' && totals.total <= COD_LIMIT
  const brand = detectBrand(card.number)

  if (!hydrated) return <div className="wrap" style={{ minHeight: '70vh' }} aria-busy="true" />

  if (!lines.length) {
    return (
      <div className={`wrap ${styles.page}`}>
        <h1 className={`display ${styles.title}`}>Checkout</h1>
        <p className="muted">Your bag is empty.</p>
        <Link href="/shop" className="btn" style={{ marginTop: '1.5rem' }}>
          Back to the shop
        </Link>
      </div>
    )
  }

  const focusFirstError = () =>
    requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"], [data-invalid="true"] input')?.focus())

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (submitting) return
    const pickup = delivery === 'pickup'
    const next = {
      contact: validateContact(contact),
      address: validateAddress(address, pickup),
      card: method === 'card' ? validateCard(card) : {},
      delivery: delivery && options.some((o) => o.id === delivery) ? undefined : 'Choose how you’d like it delivered',
    }
    setErrors(next)
    setBanner(null)
    if (hasErrors(next.contact) || hasErrors(next.address) || hasErrors(next.card) || next.delivery) {
      focusFirstError()
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lines: rawLines,
          promoCode: promo?.ok ? promo.code : undefined,
          contact,
          address,
          delivery,
          payment: { method, card: method === 'card' ? card : undefined },
          previousOrders: orders.length,
        }),
      })
      const result = (await res.json()) as CheckoutResult
      if (result.ok) {
        addOrder(result.order)
        clear()
        router.push(`/orders/${result.order.id}?placed=1`)
        return
      }
      if (result.fields) {
        setErrors({ contact: result.fields.contact ?? {}, address: result.fields.address ?? {}, card: result.fields.card ?? {} })
        focusFirstError()
      }
      setBanner(result.message)
      requestAnimationFrame(() => bannerRef.current?.focus())
    } catch {
      setBanner('We couldn’t reach the payment service. Check your connection; you have not been charged.')
      requestAnimationFrame(() => bannerRef.current?.focus())
    } finally {
      setSubmitting(false)
    }
  }

  const field = <T extends object>(group: 'contact' | 'address', key: keyof T & string) => {
    const err = (errors[group] as Record<string, string | undefined>)[key]
    return {
      id: `${ids}-${key}`,
      'aria-invalid': !!err,
      'aria-describedby': err ? `${ids}-${key}-err` : undefined,
    }
  }
  const errorText = (group: 'contact' | 'address' | 'card', key: string) => {
    const err = (errors[group] as Record<string, string | undefined>)[key]
    return err ? (
      <p className="error" id={`${ids}-${key}-err`}>
        {err}
      </p>
    ) : null
  }

  return (
    <div className={`wrap ${styles.page}`}>
      <h1 className={`display ${styles.title}`}>Checkout</h1>
      <form ref={formRef} className={styles.layout} onSubmit={submit} noValidate>
        <div className={styles.main}>
          {banner && (
            <div ref={bannerRef} tabIndex={-1} className={styles.banner} role="alert">
              <Icon name="alert" size={20} />
              <p>{banner}</p>
            </div>
          )}

          <section className={styles.section} aria-labelledby="s-contact">
            <h2 id="s-contact" className={styles.h2}>
              <span className="num">1</span> Contact
            </h2>
            <div className={styles.grid2}>
              <div className={`field ${styles.full}`}>
                <label htmlFor={`${ids}-name`}>Full name</label>
                <input className="input" autoComplete="name" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} {...field<Contact>('contact', 'name')} />
                {errorText('contact', 'name')}
              </div>
              <div className="field">
                <label htmlFor={`${ids}-email`}>Email</label>
                <input className="input" type="email" autoComplete="email" inputMode="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} {...field<Contact>('contact', 'email')} />
                {errorText('contact', 'email')}
              </div>
              <div className="field">
                <label htmlFor={`${ids}-phone`}>Phone</label>
                <input className="input" type="tel" autoComplete="tel" inputMode="tel" placeholder="0803 123 4567" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} {...field<Contact>('contact', 'phone')} />
                {errorText('contact', 'phone')}
              </div>
            </div>
          </section>

          <section className={styles.section} aria-labelledby="s-delivery">
            <h2 id="s-delivery" className={styles.h2}>
              <span className="num">2</span> Delivery
            </h2>
            <div className={styles.grid2}>
              <div className="field">
                <label htmlFor={`${ids}-state`}>State</label>
                <select
                  className="input"
                  autoComplete="address-level1"
                  value={address.state}
                  onChange={(e) => {
                    setAddress({ ...address, state: e.target.value, area: '' })
                    setDelivery(null)
                    if (method === 'cod' && e.target.value !== 'Lagos') setMethod('card')
                  }}
                  {...field<Address>('address', 'state')}
                >
                  <option value="" disabled>
                    Choose a state
                  </option>
                  {STATES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                {errorText('address', 'state')}
              </div>
              {delivery !== 'pickup' && (
                <div className="field">
                  <label htmlFor={`${ids}-area`}>{address.state === 'Lagos' ? 'Area' : 'Town or city'}</label>
                  {address.state === 'Lagos' ? (
                    <select className="input" value={address.area} onChange={(e) => setAddress({ ...address, area: e.target.value })} {...field<Address>('address', 'area')}>
                      <option value="" disabled>
                        Choose your area
                      </option>
                      {LAGOS_AREAS.map((a) => (
                        <option key={a}>{a}</option>
                      ))}
                    </select>
                  ) : (
                    <input className="input" autoComplete="address-level2" value={address.area} onChange={(e) => setAddress({ ...address, area: e.target.value })} {...field<Address>('address', 'area')} />
                  )}
                  {errorText('address', 'area')}
                </div>
              )}
              {delivery !== 'pickup' && (
                <>
                  <div className={`field ${styles.full}`}>
                    <label htmlFor={`${ids}-street`}>House number and street</label>
                    <input className="input" autoComplete="street-address" value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} {...field<Address>('address', 'street')} />
                    {errorText('address', 'street')}
                  </div>
                  <div className={`field ${styles.full}`}>
                    <label htmlFor={`${ids}-landmark`}>
                      Nearest landmark <span className="muted">(optional)</span>
                    </label>
                    <input id={`${ids}-landmark`} className="input" placeholder="e.g. opposite the filling station" value={address.landmark} onChange={(e) => setAddress({ ...address, landmark: e.target.value })} />
                  </div>
                </>
              )}
            </div>

            <fieldset className={styles.options} data-invalid={!!errors.delivery} aria-describedby={errors.delivery ? `${ids}-delivery-err` : undefined}>
              <legend className="label">How should we get it to you?</legend>
              {options.length === 0 ? (
                <p className="hint">Choose a state to see delivery options.</p>
              ) : (
                options.map((o) => {
                  const fee = computeTotals(lines, { promo, delivery: o }).delivery
                  return (
                    <label key={o.id} className={styles.option}>
                      <input type="radio" name="delivery" checked={delivery === o.id} onChange={() => setDelivery(o.id)} />
                      <span className={styles.optionText}>
                        <strong>{o.label}</strong>
                        <span className="muted">{o.eta}</span>
                      </span>
                      <span className="num">{fee === 0 ? 'Free' : formatNaira(fee)}</span>
                    </label>
                  )
                })
              )}
              {errors.delivery && (
                <p className="error" id={`${ids}-delivery-err`}>
                  {errors.delivery}
                </p>
              )}
            </fieldset>
          </section>

          <section className={styles.section} aria-labelledby="s-pay">
            <h2 id="s-pay" className={styles.h2}>
              <span className="num">3</span> Payment
            </h2>
            <div className={styles.methods} role="radiogroup" aria-label="Payment method">
              {(
                [
                  ['card', 'Card'],
                  ['transfer', 'Bank transfer'],
                  ['cod', 'Pay on delivery'],
                ] as const
              ).map(([id, label]) => (
                <label key={id} className={styles.method} data-disabled={id === 'cod' && !codAllowed}>
                  <input type="radio" name="method" checked={method === id} disabled={id === 'cod' && !codAllowed} onChange={() => setMethod(id)} />
                  {label}
                </label>
              ))}
            </div>
            {!codAllowed && <p className="hint">Pay on delivery is available for Lagos orders under {formatNaira(COD_LIMIT)}.</p>}

            {method === 'card' && (
              <div className={styles.card}>
                <div className={styles.testCards}>
                  <span className="hint">Demo cards:</span>
                  <button type="button" className="link-btn" onClick={() => setCard({ number: TEST_CARDS.success, expiry: '12/29', cvv: '123', name: contact.name || 'Ada Obi' })}>
                    one that works
                  </button>
                  <button type="button" className="link-btn" onClick={() => setCard({ number: TEST_CARDS.declined, expiry: '12/29', cvv: '123', name: contact.name || 'Ada Obi' })}>
                    one that’s declined
                  </button>
                </div>
                <div className={styles.grid2}>
                  <div className={`field ${styles.full}`}>
                    <label htmlFor={`${ids}-card`}>Card number</label>
                    <div className={styles.cardInput}>
                      <input
                        id={`${ids}-card`}
                        className="input num"
                        inputMode="numeric"
                        autoComplete="cc-number"
                        placeholder="0000 0000 0000 0000"
                        value={card.number}
                        onChange={(e) => setCard({ ...card, number: formatCardNumber(e.target.value) })}
                        aria-invalid={!!errors.card.number}
                        aria-describedby={errors.card.number ? `${ids}-number-err` : undefined}
                      />
                      {brand !== 'unknown' && <span className={styles.brandTag}>{brand}</span>}
                    </div>
                    {errorText('card', 'number')}
                  </div>
                  <div className="field">
                    <label htmlFor={`${ids}-exp`}>Expiry</label>
                    <input id={`${ids}-exp`} className="input num" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY" value={card.expiry} onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })} aria-invalid={!!errors.card.expiry} aria-describedby={errors.card.expiry ? `${ids}-expiry-err` : undefined} />
                    {errorText('card', 'expiry')}
                  </div>
                  <div className="field">
                    <label htmlFor={`${ids}-cvv`}>CVV</label>
                    <input id={`${ids}-cvv`} className="input num" inputMode="numeric" autoComplete="cc-csc" maxLength={4} value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '') })} aria-invalid={!!errors.card.cvv} aria-describedby={errors.card.cvv ? `${ids}-cvv-err` : undefined} />
                    {errorText('card', 'cvv')}
                  </div>
                  <div className={`field ${styles.full}`}>
                    <label htmlFor={`${ids}-cname`}>Name on card</label>
                    <input id={`${ids}-cname`} className="input" autoComplete="cc-name" value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} aria-invalid={!!errors.card.name} aria-describedby={errors.card.name ? `${ids}-name-err` : undefined} />
                    {errorText('card', 'name')}
                  </div>
                </div>
              </div>
            )}
            {method === 'transfer' && (
              <div className={styles.transfer}>
                <p>Place the order, then send {formatNaira(totals.total)} to:</p>
                <dl>
                  <div>
                    <dt>Account name</dt>
                    <dd>{BANK.name}</dd>
                  </div>
                  <div>
                    <dt>Bank</dt>
                    <dd>{BANK.bank}</dd>
                  </div>
                  <div>
                    <dt>Account number</dt>
                    <dd className="num">{BANK.account}</dd>
                  </div>
                </dl>
                <p className="hint">Use your order number as the reference. We start packing once it lands.</p>
              </div>
            )}
            {method === 'cod' && <p className={styles.transfer}>Pay the rider by card or transfer when your order arrives.</p>}
          </section>
        </div>

        <aside className={styles.summary} aria-labelledby="s-summary">
          <h2 id="s-summary" className={styles.h2}>
            Your order
          </h2>
          <ul role="list" className={styles.items}>
            {lines.map((l) => (
              <li key={l.key}>
                <span className={styles.thumb}>
                  <Photo name={l.product.photos[0]!.name} alt="" sizes="56px" ratio={1} />
                  <span className={`${styles.qty} num`}>{l.qty}</span>
                </span>
                <span>
                  <strong>{l.product.name}</strong>
                  <span className="muted">
                    {l.variantLabel}
                    {l.shadeName && ` · ${l.shadeName}`}
                  </span>
                </span>
                <span className="num">{formatNaira(l.lineTotal)}</span>
              </li>
            ))}
          </ul>

          <div className={styles.promo}>
            {promo?.ok ? (
              <p className={styles.promoOk}>
                <Icon name="check" size={16} /> <strong>{promo.code}</strong> · {promo.description}
                <button type="button" className="link-btn" onClick={() => setPromo(null)}>
                  Remove
                </button>
              </p>
            ) : (
              <div className="field">
                <label htmlFor={`${ids}-promo`}>Promo code</label>
                <div className={styles.promoRow}>
                  <input
                    id={`${ids}-promo`}
                    className="input"
                    value={promoInput}
                    autoCapitalize="characters"
                    onChange={(e) => setPromoInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        ;(e.currentTarget.nextElementSibling as HTMLButtonElement)?.click()
                      }
                    }}
                    aria-describedby={`${ids}-promo-msg`}
                  />
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => {
                      const r = applyPromo(promoInput, { lines, subtotal: base.subtotal, previousOrders: orders.length, today: today() })
                      if (r.ok) {
                        setPromo(r.code)
                        setPromoInput('')
                        setPromoMessage(null)
                      } else setPromoMessage(r.message)
                    }}
                  >
                    Apply
                  </button>
                </div>
                <p id={`${ids}-promo-msg`} className={promoMessage ? 'error' : 'hint'} aria-live="polite">
                  {promoMessage ?? (promo && !promo.ok ? promo.message : 'Try EWA10, FIRSTGLOW, FREESHIP or HARMATTAN')}
                </p>
              </div>
            )}
          </div>

          <dl className={styles.rows}>
            <div>
              <dt>Items</dt>
              <dd className="num">{formatNaira(totals.merchandise)}</dd>
            </div>
            {totals.routineSavings > 0 && (
              <div className={styles.saving}>
                <dt>Routine saving</dt>
                <dd className="num">−{formatNaira(totals.routineSavings)}</dd>
              </div>
            )}
            {totals.promoDiscount > 0 && (
              <div className={styles.saving}>
                <dt>Promo</dt>
                <dd className="num">−{formatNaira(totals.promoDiscount)}</dd>
              </div>
            )}
            <div>
              <dt>Delivery</dt>
              <dd className="num">{option ? (totals.delivery ? formatNaira(totals.delivery) : 'Free') : '—'}</dd>
            </div>
            <div className={styles.total}>
              <dt>Total</dt>
              <dd className="num">{formatNaira(totals.total)}</dd>
            </div>
          </dl>
          <button type="submit" className="btn btn-plum btn-block" disabled={submitting} aria-busy={submitting}>
            {submitting ? 'Placing your order…' : method === 'card' ? `Pay ${formatNaira(totals.total)}` : 'Place order'}
          </button>
          <p className="hint">This is a demo shop. No money moves and nothing will be delivered.</p>
        </aside>
      </form>
    </div>
  )
}
