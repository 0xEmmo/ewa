import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Icon } from '@/components/Icon'
import { ProductCard } from '@/components/ProductCard'
import { brandById } from '@/data/brands'
import { onSkin } from '@/data/onSkin'
import { products } from '@/data/products'
import { averageRating, categoryLabels, concernLabels, fromPrice, productBySlug, requireProduct } from '@/lib/catalog'
import { BuyBox } from './BuyBox'
import { Gallery } from './Gallery'
import { Reviews } from './Reviews'
import styles from './product.module.css'

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: PageProps<'/shop/[slug]'>): Promise<Metadata> {
  const p = productBySlug((await params).slug)
  if (!p) return { title: 'Not found' }
  return {
    title: `${p.name} by ${brandById(p.brandId).name}`,
    description: p.tagline,
    openGraph: { images: [`/photos/${p.photos[0]!.name}-800.webp`] },
  }
}

export default async function ProductPage({ params }: PageProps<'/shop/[slug]'>) {
  const product = productBySlug((await params).slug)
  if (!product) notFound()
  const brand = brandById(product.brandId)
  const photos = onSkin[product.slug] ? [...product.photos, onSkin[product.slug]!] : product.photos
  const pairs = product.pairsWith.map(requireProduct)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    brand: { '@type': 'Brand', name: brand.name },
    description: product.description,
    image: product.photos.map((ph) => `/photos/${ph.name}-800.webp`),
    aggregateRating: product.reviews.length
      ? { '@type': 'AggregateRating', ratingValue: averageRating(product).toFixed(1), reviewCount: product.reviews.length }
      : undefined,
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'NGN',
      lowPrice: fromPrice(product),
      highPrice: Math.max(...product.variants.map((v) => v.price)),
      availability: product.variants.some((v) => v.stock > 0) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  }

  return (
    <article className={styles.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <div className="wrap">
        <nav aria-label="Breadcrumb" className={styles.crumbs}>
          <ol role="list">
            <li>
              <Link href="/shop">Shop</Link>
            </li>
            <li>
              <Link href={`/shop?category=${product.category}`}>{categoryLabels[product.category]}</Link>
            </li>
            <li aria-current="page">{product.name}</li>
          </ol>
        </nav>

        <div className={styles.top}>
          <Gallery photos={photos} name={product.name} />
          <BuyBox product={product} brandName={brand.name} />
        </div>

        <div className={styles.details}>
          <div className={styles.about}>
            <h2 className={`display ${styles.h2}`}>What it does</h2>
            <p className={styles.description}>{product.description}</p>
            {product.concerns.length > 0 && (
              <ul role="list" className={styles.tags} aria-label="Good for">
                {product.concerns.map((c) => (
                  <li key={c}>
                    <Link href={`/shop?concern=${c}`} className="pill">
                      {concernLabels[c]}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={styles.accordions}>
            <details open>
              <summary>
                Key ingredients <Icon name="down" size={18} />
              </summary>
              <dl className={styles.ingredients}>
                {product.keyIngredients.map((k) => (
                  <div key={k.name}>
                    <dt>{k.name}</dt>
                    <dd>{k.what}</dd>
                  </div>
                ))}
              </dl>
            </details>
            <details>
              <summary>
                How to use <Icon name="down" size={18} />
              </summary>
              <p>{product.howTo}</p>
            </details>
            <details>
              <summary>
                Full ingredient list <Icon name="down" size={18} />
              </summary>
              <p className={styles.inci}>{product.inci}</p>
            </details>
            <details>
              <summary>
                About {brand.name} <Icon name="down" size={18} />
              </summary>
              <p>
                {brand.story} <span className="muted">Founded in {brand.city}, {brand.founded}.</span>
              </p>
              <Link href={`/shop?brand=${brand.id}`}>Shop {brand.name}</Link>
            </details>
          </div>
        </div>

        <Reviews product={product} />

        {pairs.length > 0 && (
          <section className={styles.pairs} aria-labelledby="pairs-title">
            <h2 id="pairs-title" className={`display ${styles.h2}`}>
              Complete the routine
            </h2>
            <ul role="list" className={styles.pairGrid}>
              {pairs.map((p) => (
                <li key={p.slug}>
                  <ProductCard product={p} sizes="(min-width: 900px) 25vw, 60vw" />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </article>
  )
}
