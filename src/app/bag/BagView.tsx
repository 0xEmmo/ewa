'use client'

import Link from 'next/link'
import { BagLines, FreeDelivery } from '@/components/BagDrawer'
import { ProductCard } from '@/components/ProductCard'
import { useBag } from '@/hooks/useBag'
import { requireProduct } from '@/lib/catalog'
import { formatNaira } from '@/lib/money'
import styles from './bag.module.css'

export function BagView() {
  const { hydrated, lines, totals } = useBag()
  const inBag = new Set(lines.map((l) => l.slug))
  const suggestions = [...new Set(lines.flatMap((l) => l.product.pairsWith))].filter((s) => !inBag.has(s)).slice(0, 4).map(requireProduct)

  if (!hydrated) return <div className="wrap" style={{ minHeight: '60vh' }} aria-busy="true" />

  return (
    <div className={`wrap ${styles.page}`}>
      <h1 className={`display ${styles.title}`}>Your bag</h1>
      {lines.length === 0 ? (
        <div className={styles.empty}>
          <p className="muted">Your bag is empty. It’s saved on this device, so anything you add will still be here tomorrow.</p>
          <div className={styles.emptyActions}>
            <Link href="/shop" className="btn">
              Shop everything
            </Link>
            <Link href="/quiz" className="btn btn-ghost">
              Take the routine quiz
            </Link>
          </div>
        </div>
      ) : (
        <div className={styles.layout}>
          <section aria-label="Items">
            <BagLines />
          </section>
          <aside className={styles.summary} aria-labelledby="summary-title">
            <h2 id="summary-title" className={styles.h2}>
              Summary
            </h2>
            <FreeDelivery subtotal={totals.subtotal} />
            <dl className={styles.rows}>
              <div>
                <dt>Items ({totals.itemCount})</dt>
                <dd className="num">{formatNaira(totals.merchandise)}</dd>
              </div>
              {totals.routineSavings > 0 && (
                <div className={styles.saving}>
                  <dt>Routine saving (10%)</dt>
                  <dd className="num">−{formatNaira(totals.routineSavings)}</dd>
                </div>
              )}
              <div className={styles.total}>
                <dt>Subtotal</dt>
                <dd className="num">{formatNaira(totals.subtotal)}</dd>
              </div>
            </dl>
            <p className="hint">Delivery is worked out from your address. Promo codes go in at checkout.</p>
            <Link href="/checkout" className="btn btn-plum btn-block">
              Checkout
            </Link>
          </aside>
        </div>
      )}
      {suggestions.length > 0 && (
        <section className={styles.suggest} aria-labelledby="goes-title">
          <h2 id="goes-title" className={`display ${styles.h2}`}>
            Goes well with your bag
          </h2>
          <ul role="list" className={styles.grid}>
            {suggestions.map((p) => (
              <li key={p.slug}>
                <ProductCard product={p} sizes="(min-width: 900px) 25vw, 50vw" />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
