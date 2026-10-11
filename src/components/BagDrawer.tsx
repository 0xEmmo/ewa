'use client'

import Link from 'next/link'
import { brandById } from '@/data/brands'
import { useBag } from '@/hooks/useBag'
import { formatNaira } from '@/lib/money'
import { freeDeliveryProgress } from '@/lib/pricing'
import { useCart } from '@/stores/cart'
import { useUi } from '@/stores/ui'
import { Dialog } from './Dialog'
import { Photo } from './Photo'
import { QuantityStepper } from './QuantityStepper'
import { useToast } from './toast'
import styles from './BagDrawer.module.css'

export function FreeDelivery({ subtotal }: { subtotal: number }) {
  const p = freeDeliveryProgress(subtotal, null)
  return (
    <div className={styles.free}>
      <p>
        {p.remaining > 0 ? (
          <>
            You’re <strong className="num">{formatNaira(p.remaining)}</strong> away from free Lagos delivery
          </>
        ) : (
          <>Free delivery in Lagos unlocked</>
        )}
      </p>
      <span className={styles.track} aria-hidden>
        <span style={{ transform: `scaleX(${p.ratio})` }} />
      </span>
    </div>
  )
}

export function BagLines({ compact = false }: { compact?: boolean }) {
  const { lines } = useBag()
  const setQty = useCart((s) => s.setQty)
  const remove = useCart((s) => s.remove)
  const restore = useCart((s) => s.restore)
  const toast = useToast()

  return (
    <ul role="list" className={styles.lines} data-compact={compact}>
      {lines.map((l) => (
        <li key={l.key} className={styles.line}>
          <Link href={`/shop/${l.slug}`} className={styles.thumb} tabIndex={-1} aria-hidden>
            <Photo name={l.product.photos[0]!.name} alt="" sizes="96px" ratio={4 / 5} />
          </Link>
          <div className={styles.info}>
            <p className={styles.brand}>{brandById(l.product.brandId).name}</p>
            <Link href={`/shop/${l.slug}`} className={styles.name}>
              {l.product.name}
            </Link>
            <p className={styles.meta}>
              {l.variantLabel}
              {l.shadeName && <> · {l.shadeName}</>}
              {l.routineId && <span className="pill pill-plum">Routine</span>}
            </p>
            {l.qty > l.available && (
              <p className="error">{l.available === 0 ? 'Sold out' : `Only ${l.available} left`}</p>
            )}
            <div className={styles.row}>
              <QuantityStepper size="sm" value={l.qty} max={Math.min(10, Math.max(1, l.available))} onChange={(n) => setQty(l.key, n)} label={`Quantity of ${l.product.name}`} />
              <button
                type="button"
                className={styles.remove}
                onClick={() => {
                  const removed = remove(l.key)
                  if (removed) toast(`Removed ${l.product.name}`, { action: { label: 'Undo', onClick: () => restore(removed.line, removed.index) } })
                }}
              >
                Remove<span className="sr-only"> {l.product.name}</span>
              </button>
            </div>
          </div>
          <p className={`${styles.price} num`}>{formatNaira(l.lineTotal)}</p>
        </li>
      ))}
    </ul>
  )
}

export function BagDrawer() {
  const open = useUi((s) => s.bagOpen)
  const close = useUi((s) => s.closeBag)
  const { lines, totals } = useBag()

  return (
    <Dialog
      open={open}
      onClose={close}
      title={lines.length ? `Your bag (${totals.itemCount})` : 'Your bag'}
      placement="right"
      footer={
        lines.length ? (
          <div className={styles.foot}>
            {totals.routineSavings > 0 && (
              <p className={styles.sum}>
                <span>Routine saving</span>
                <span className="num">−{formatNaira(totals.routineSavings)}</span>
              </p>
            )}
            <p className={`${styles.sum} ${styles.total}`}>
              <span>Subtotal</span>
              <span className="num">{formatNaira(totals.subtotal)}</span>
            </p>
            <p className="hint">Delivery and promo codes at checkout.</p>
            <Link href="/checkout" className="btn btn-plum btn-block" onClick={close}>
              Checkout
            </Link>
            <Link href="/bag" className="btn btn-ghost btn-block" onClick={close}>
              View bag
            </Link>
          </div>
        ) : undefined
      }
    >
      {lines.length ? (
        <>
          <FreeDelivery subtotal={totals.subtotal} />
          <BagLines compact />
        </>
      ) : (
        <div className={styles.empty}>
          <p className="display">Nothing in here yet.</p>
          <p className="muted">Not sure where to start? The quiz builds a routine in about a minute.</p>
          <Link href="/quiz" className="btn" onClick={close}>
            Find my routine
          </Link>
          <Link href="/shop" className="btn btn-ghost" onClick={close}>
            Browse the shop
          </Link>
        </div>
      )}
    </Dialog>
  )
}
