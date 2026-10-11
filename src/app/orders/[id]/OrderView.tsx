'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Dialog } from '@/components/Dialog'
import { Icon } from '@/components/Icon'
import { Photo } from '@/components/Photo'
import { useToast } from '@/components/toast'
import { brandById } from '@/data/brands'
import { useHydrated } from '@/hooks/useHydrated'
import { useNow } from '@/hooks/useNow'
import { productBySlug } from '@/lib/catalog'
import { formatNaira } from '@/lib/money'
import { canCancel, STAGE_MINUTES, STAGES, trackingStage } from '@/lib/orders'
import { useCart } from '@/stores/cart'
import { useOrders } from '@/stores/orders'
import { useUi } from '@/stores/ui'
import { formatPlaced, formatTime } from '../format'
import styles from '../orders.module.css'

export function OrderView({ id }: { id: string }) {
  const hydrated = useHydrated()
  const order = useOrders((s) => s.orders.find((o) => o.id === id))
  const cancel = useOrders((s) => s.cancel)
  const addMany = useCart((s) => s.addMany)
  const openBag = useUi((s) => s.openBag)
  const toast = useToast()
  const router = useRouter()
  const placed = useSearchParams().get('placed') === '1'
  const now = useNow(5000)
  const [confirming, setConfirming] = useState(false)

  if (!hydrated) return <div className="wrap" style={{ minHeight: '60vh' }} aria-busy="true" />

  if (!order) {
    return (
      <div className={`wrap ${styles.page}`}>
        <h1 className={`display ${styles.title}`}>Order not found</h1>
        <p className="muted">We couldn’t find {id} on this device. Orders are stored in the browser you placed them from.</p>
        <Link href="/orders" className="btn" style={{ marginTop: '1.5rem' }}>
          All orders
        </Link>
      </div>
    )
  }

  const stage = trackingStage(order, now)
  const pickup = order.delivery.id === 'pickup'
  const reached = stage === 'cancelled' ? -1 : STAGES.findIndex((s) => s.id === stage)
  const placedMs = new Date(order.placedAt).getTime()
  const transferOffset = order.payment.method === 'transfer' ? 1 : 0

  const reorder = () => {
    const lines = order.lines.flatMap((l) => {
      const p = productBySlug(l.slug)
      const v = p?.variants.find((x) => x.label === l.variantLabel)
      if (!p || !v || v.stock === 0) return []
      const shade = p.shades?.find((s) => s.name === l.shadeName)
      return [{ slug: p.slug, variantId: v.id, shadeId: shade?.id, qty: l.qty }]
    })
    if (!lines.length) {
      toast('Everything in this order is sold out right now', { tone: 'danger' })
      return
    }
    addMany(lines)
    openBag()
  }

  return (
    <div className={`wrap ${styles.page}`}>
      {placed && stage !== 'cancelled' && (
        <div className={styles.thanks} role="status">
          <Icon name="check" size={22} />
          <div>
            <p className={styles.thanksTitle}>Thank you, {order.contact.name.split(' ')[0]}. Your order is in.</p>
            <p>
              A receipt is on its way to {order.contact.email}.{' '}
              {order.payment.method === 'transfer' && 'We’ll start packing as soon as your transfer lands.'}
            </p>
          </div>
        </div>
      )}
      <p className="eyebrow">Order</p>
      <h1 className={`display num ${styles.title}`}>{order.id}</h1>
      <p className="muted">Placed {formatPlaced(order.placedAt)}</p>

      <div className={styles.detail}>
        <section aria-labelledby="track-title" className={styles.card}>
          <h2 id="track-title" className={styles.h2}>
            {stage === 'cancelled' ? 'Cancelled' : pickup ? 'Collection' : 'Delivery'}
          </h2>
          {stage === 'cancelled' ? (
            <p className="muted">
              Cancelled at {formatTime(order.cancelledAt!)}.{' '}
              {order.payment.method === 'card' ? 'Your refund is on its way back to the card.' : 'Nothing more to pay.'}
            </p>
          ) : (
            <ol className={styles.timeline}>
              {STAGES.map((s, i) => {
                const at = new Date(placedMs + (STAGE_MINUTES[s.id] + (i > 0 ? transferOffset : 0)) * 60000)
                const state = i < reached ? 'done' : i === reached ? 'current' : 'todo'
                return (
                  <li key={s.id} data-state={state} aria-current={state === 'current' ? 'step' : undefined}>
                    <span className={styles.dot} aria-hidden="true">
                      {state !== 'todo' && <Icon name="check" size={12} />}
                    </span>
                    <span>
                      <strong>{(pickup && s.pickupLabel) || s.label}</strong>
                      <span className="muted">{state === 'todo' ? `Around ${formatTime(at.toISOString())}` : formatTime(at.toISOString())}</span>
                    </span>
                  </li>
                )
              })}
            </ol>
          )}
          {stage !== 'cancelled' && <p className="hint">Demo time runs fast: the whole journey takes about twelve minutes.</p>}
          <div className={styles.actions}>
            <button type="button" className="btn btn-ghost" onClick={reorder}>
              Buy again
            </button>
            {canCancel(order, now) && (
              <button type="button" className="btn btn-ghost" onClick={() => setConfirming(true)}>
                Cancel order
              </button>
            )}
          </div>
        </section>

        <section aria-labelledby="items-title" className={styles.card}>
          <h2 id="items-title" className={styles.h2}>
            Items
          </h2>
          <ul role="list" className={styles.items}>
            {order.lines.map((l) => (
              <li key={l.slug + l.variantLabel + l.shadeName}>
                <Photo name={l.photo} alt="" sizes="64px" ratio={1} />
                <span>
                  <span className="eyebrow">{brandById(l.brandId).name}</span>
                  <Link href={`/shop/${l.slug}`}>{l.name}</Link>
                  <span className="muted">
                    {l.variantLabel}
                    {l.shadeName && ` · ${l.shadeName}`} · Qty {l.qty}
                  </span>
                </span>
                <span className="num">{formatNaira(l.unitPrice * l.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className={styles.rows}>
            <div>
              <dt>Items</dt>
              <dd className="num">{formatNaira(order.totals.merchandise)}</dd>
            </div>
            {order.totals.routineSavings > 0 && (
              <div>
                <dt>Routine saving</dt>
                <dd className="num">−{formatNaira(order.totals.routineSavings)}</dd>
              </div>
            )}
            {order.totals.promoDiscount > 0 && (
              <div>
                <dt>Promo {order.promoCode}</dt>
                <dd className="num">−{formatNaira(order.totals.promoDiscount)}</dd>
              </div>
            )}
            <div>
              <dt>{order.delivery.label}</dt>
              <dd className="num">{order.totals.delivery ? formatNaira(order.totals.delivery) : 'Free'}</dd>
            </div>
            <div className={styles.total}>
              <dt>Total</dt>
              <dd className="num">{formatNaira(order.totals.total)}</dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="where-title" className={styles.card}>
          <h2 id="where-title" className={styles.h2}>
            Details
          </h2>
          <dl className={styles.facts}>
            <div>
              <dt>{pickup ? 'Collect from' : 'Deliver to'}</dt>
              <dd>
                {pickup ? (
                  'Ẹwà studio, 14 Admiralty Way, Lekki Phase 1'
                ) : (
                  <>
                    {order.address.street}, {order.address.area}, {order.address.state}
                    {order.address.landmark && <span className="muted"> ({order.address.landmark})</span>}
                  </>
                )}
              </dd>
            </div>
            <div>
              <dt>Contact</dt>
              <dd>
                {order.contact.name} · {order.contact.phone}
              </dd>
            </div>
            <div>
              <dt>Payment</dt>
              <dd>
                {order.payment.method === 'card' ? `Card ending ${order.payment.last4}` : order.payment.method === 'transfer' ? 'Bank transfer' : 'Pay on delivery'}
                <span className="muted num"> · Ref {order.payment.reference}</span>
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <Dialog open={confirming} onClose={() => setConfirming(false)} title="Cancel this order?">
        <p>
          {order.payment.method === 'card'
            ? `${formatNaira(order.totals.total)} goes back to the card ending ${order.payment.last4} within 3 working days.`
            : 'Nothing has been charged, so there’s nothing to refund.'}
        </p>
        <div className={styles.dialogActions}>
          <button type="button" className="btn btn-ghost" onClick={() => setConfirming(false)}>
            Keep it
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => {
              cancel(order.id)
              setConfirming(false)
              toast(`${order.id} cancelled`)
              router.replace(`/orders/${order.id}`)
            }}
          >
            Cancel order
          </button>
        </div>
      </Dialog>
    </div>
  )
}
