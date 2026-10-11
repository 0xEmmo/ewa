'use client'

import Link from 'next/link'
import type { Product } from '@/data/types'
import { useCart } from '@/stores/cart'
import { useUi } from '@/stores/ui'
import { useToast } from './toast'
import styles from './ProductCard.module.css'

/** One-tap add when there's nothing to choose; otherwise go and choose. */
export function QuickAdd({ product }: { product: Product }) {
  const add = useCart((s) => s.add)
  const openBag = useUi((s) => s.openBag)
  const toast = useToast()
  const available = product.variants.filter((v) => v.stock > 0)
  const needsChoice = !!product.shades || product.variants.length > 1

  if (!available.length) {
    return (
      <span className={styles.quick} aria-disabled="true">
        Sold out
      </span>
    )
  }

  if (needsChoice) {
    return (
      <Link href={`/shop/${product.slug}`} className={styles.quick} aria-label={`Choose ${product.shades ? 'a shade' : 'a size'} for ${product.name}`}>
        {product.shades ? `${product.shades.length} shades` : `${product.variants.length} sizes`}
      </Link>
    )
  }

  return (
    <button
      type="button"
      className={styles.quick}
      onClick={() => {
        add({ slug: product.slug, variantId: available[0]!.id, qty: 1 })
        toast(`Added ${product.name} to your bag`, { tone: 'ok', action: { label: 'View bag', onClick: openBag } })
      }}
      aria-label={`Add ${product.name} to bag`}
    >
      Add to bag
    </button>
  )
}
