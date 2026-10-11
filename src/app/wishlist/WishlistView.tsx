'use client'

import Link from 'next/link'
import { ProductCard } from '@/components/ProductCard'
import { useHydrated } from '@/hooks/useHydrated'
import { productBySlug } from '@/lib/catalog'
import { useWishlist } from '@/stores/wishlist'
import styles from '../bag/bag.module.css'

export function WishlistView() {
  const hydrated = useHydrated()
  const slugs = useWishlist((s) => s.slugs)
  const items = slugs.flatMap((s) => productBySlug(s) ?? [])

  return (
    <div className={`wrap ${styles.page}`}>
      <h1 className={`display ${styles.title}`}>Wishlist</h1>
      {!hydrated ? (
        <div style={{ minHeight: '40vh' }} aria-busy="true" />
      ) : items.length === 0 ? (
        <div className={styles.empty}>
          <p className="muted">Nothing saved yet. Tap the heart on anything you’d like to come back to.</p>
          <div className={styles.emptyActions}>
            <Link href="/shop" className="btn">
              Browse the shop
            </Link>
          </div>
        </div>
      ) : (
        <>
          <p className="muted">
            {items.length} saved {items.length === 1 ? 'product' : 'products'}
          </p>
          <ul role="list" className={styles.grid}>
            {items.map((p) => (
              <li key={p.slug}>
                <ProductCard product={p} sizes="(min-width: 900px) 25vw, 50vw" />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
