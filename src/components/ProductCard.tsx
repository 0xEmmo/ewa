import Link from 'next/link'
import { brandById } from '@/data/brands'
import type { Product } from '@/data/types'
import { averageRating, fromPrice } from '@/lib/catalog'
import { formatNaira } from '@/lib/money'
import { Photo } from './Photo'
import { QuickAdd } from './QuickAdd'
import { Stars } from './Stars'
import { WishButton } from './WishButton'
import styles from './ProductCard.module.css'

const badgeText = { bestseller: 'Bestseller', new: 'New', restocked: 'Back in stock' } as const

export function ProductCard({ product, priority = false, sizes = '(min-width: 1100px) 25vw, (min-width: 700px) 33vw, 50vw' }: { product: Product; priority?: boolean; sizes?: string }) {
  const [main, alt] = product.photos
  const multi = product.variants.length > 1

  return (
    <article className={styles.card}>
      <div className={styles.media}>
        <Link href={`/shop/${product.slug}`} tabIndex={-1} aria-hidden className={styles.mediaLink}>
          <Photo name={main!.name} alt="" sizes={sizes} ratio={4 / 5} priority={priority} />
          {alt && <Photo name={alt.name} alt="" sizes={sizes} ratio={4 / 5} className={styles.alt} />}
        </Link>
        {product.badge && <span className={`pill ${styles.badge}`}>{badgeText[product.badge]}</span>}
        <span className={styles.wish}>
          <WishButton slug={product.slug} name={product.name} />
        </span>
      </div>
      <div className={styles.body}>
        <p className={styles.brand}>{brandById(product.brandId).name}</p>
        <h3 className={styles.name}>
          <Link href={`/shop/${product.slug}`}>{product.name}</Link>
        </h3>
        <p className={styles.tagline}>{product.tagline}</p>
        <div className={styles.foot}>
          <p className={`${styles.price} num`}>
            {multi && <span className={styles.from}>from </span>}
            {formatNaira(fromPrice(product))}
          </p>
          {product.reviews.length > 0 && <Stars value={averageRating(product)} count={product.reviews.length} size={12} />}
        </div>
        <QuickAdd product={product} />
      </div>
    </article>
  )
}
