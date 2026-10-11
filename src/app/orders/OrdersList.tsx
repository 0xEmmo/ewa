'use client'

import Link from 'next/link'
import { Photo } from '@/components/Photo'
import { useHydrated } from '@/hooks/useHydrated'
import { useNow } from '@/hooks/useNow'
import { formatNaira } from '@/lib/money'
import { STAGES, trackingStage } from '@/lib/orders'
import { useOrders } from '@/stores/orders'
import { formatPlaced } from './format'
import styles from './orders.module.css'

export function OrdersList() {
  const hydrated = useHydrated()
  const orders = useOrders((s) => s.orders)
  const now = useNow(15000)

  if (!hydrated) return <div className="wrap" style={{ minHeight: '60vh' }} aria-busy="true" />

  return (
    <div className={`wrap ${styles.page}`}>
      <h1 className={`display ${styles.title}`}>Your orders</h1>
      {orders.length === 0 ? (
        <div className={styles.empty}>
          <p className="muted">No orders yet. Orders you place are kept on this device.</p>
          <Link href="/shop" className="btn">
            Start shopping
          </Link>
        </div>
      ) : (
        <ul role="list" className={styles.list}>
          {orders.map((o) => {
            const stage = trackingStage(o, now)
            const label = stage === 'cancelled' ? 'Cancelled' : STAGES.find((s) => s.id === stage)![o.delivery.id === 'pickup' ? 'pickupLabel' : 'label'] ?? STAGES.find((s) => s.id === stage)!.label
            return (
              <li key={o.id}>
                <Link href={`/orders/${o.id}`} className={styles.row}>
                  <span className={styles.thumbs} aria-hidden="true">
                    {o.lines.slice(0, 3).map((l) => (
                      <Photo key={l.slug + l.variantLabel + l.shadeName} name={l.photo} alt="" sizes="56px" ratio={1} />
                    ))}
                  </span>
                  <span className={styles.rowText}>
                    <strong className="num">{o.id}</strong>
                    <span className="muted">
                      {formatPlaced(o.placedAt)} · {o.lines.reduce((n, l) => n + l.qty, 0)} items
                    </span>
                  </span>
                  <span className={styles.status} data-stage={stage}>
                    {label}
                  </span>
                  <span className={`num ${styles.amount}`}>{formatNaira(o.totals.total)}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
