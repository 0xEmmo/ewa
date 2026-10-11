import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ProductCard } from '@/components/ProductCard'
import { brandById } from '@/data/brands'
import { products } from '@/data/products'
import { categoryLabels, concernLabels, filterProducts, parseFilters, type Filters } from '@/lib/catalog'
import { ClearFilters, FilterPanel } from './FilterPanel'
import styles from './shop.module.css'

export const metadata: Metadata = {
  title: 'Shop',
  description: 'Cleansers, serums, sunscreen, body care and lip colour for brown and deep skin.',
}

function heading(f: Filters) {
  if (f.q) return { eyebrow: 'Search', title: `“${f.q}”` }
  if (f.brand) return { eyebrow: 'Brand', title: brandById(f.brand).name }
  if (f.category) return { eyebrow: 'Shop', title: categoryLabels[f.category] }
  if (f.concerns.length === 1) return { eyebrow: 'For', title: concernLabels[f.concerns[0]!] }
  return { eyebrow: 'Shop', title: 'Everything' }
}

async function Results({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const filters = parseFilters(await searchParams)
  const list = filterProducts(products, filters)
  const h = heading(filters)

  return (
    <div className={styles.layout}>
      <header className={styles.head}>
        <p className="eyebrow">{h.eyebrow}</p>
        <h1 className={`display ${styles.title}`}>{h.title}</h1>
      </header>
      <FilterPanel filters={filters} resultCount={list.length} />
      <section aria-label="Products" className={styles.results}>
        <p className={styles.count} role="status">
          {list.length} {list.length === 1 ? 'product' : 'products'}
        </p>
        {list.length ? (
          <ul role="list" className={styles.grid}>
            {list.map((p, i) => (
              <li key={p.slug}>
                <ProductCard product={p} priority={i < 3} sizes="(min-width: 1100px) 22vw, (min-width: 700px) 33vw, 50vw" />
              </li>
            ))}
          </ul>
        ) : (
          <div className={styles.empty}>
            <p className="display">Nothing matches all of that.</p>
            <p className="muted">Try removing a filter, or search for an ingredient like shea, niacinamide or zinc.</p>
            <ClearFilters />
          </div>
        )}
      </section>
    </div>
  )
}

function ResultsSkeleton() {
  return (
    <div className={styles.layout} aria-busy="true">
      <header className={styles.head}>
        <p className="eyebrow">Shop</p>
        <h1 className={`display ${styles.title}`}>Everything</h1>
      </header>
      <div />
      <ul role="list" className={styles.grid}>
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i} className={styles.skeleton} />
        ))}
      </ul>
    </div>
  )
}

export default function ShopPage({ searchParams }: PageProps<'/shop'>) {
  return (
    <div className="wrap">
      <Suspense fallback={<ResultsSkeleton />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
