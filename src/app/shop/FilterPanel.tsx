'use client'

import { useRouter } from 'next/navigation'
import { useOptimistic, useState, useTransition } from 'react'
import { Dialog } from '@/components/Dialog'
import { Icon } from '@/components/Icon'
import { brands } from '@/data/brands'
import { products } from '@/data/products'
import type { Category, Concern, SkinType } from '@/data/types'
import {
  activeFilterCount,
  categoryLabels,
  concernLabels,
  emptyFilters,
  filterProducts,
  filtersToQuery,
  skinTypeLabels,
  sortLabels,
  type Filters,
  type SortKey,
} from '@/lib/catalog'
import { formatNaira } from '@/lib/money'
import styles from './shop.module.css'

const PRICE_STEPS = [10000, 15000, 20000]

function useFilterNav(filters: Filters) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [optimistic, setOptimistic] = useOptimistic(filters)
  const apply = (next: Filters) =>
    startTransition(() => {
      setOptimistic(next)
      router.replace(`/shop${filtersToQuery(next)}`, { scroll: false })
    })
  return { current: optimistic, apply, pending }
}

export function ClearFilters() {
  const router = useRouter()
  return (
    <button type="button" className="btn btn-ghost" onClick={() => router.replace('/shop', { scroll: false })}>
      Clear all filters
    </button>
  )
}

function Fields({ f, set }: { f: Filters; set: (next: Filters) => void }) {
  const toggleConcern = (c: Concern) =>
    set({ ...f, concerns: f.concerns.includes(c) ? f.concerns.filter((x) => x !== c) : [...f.concerns, c] })

  return (
    <div className={styles.fields}>
      <fieldset>
        <legend>Category</legend>
        <label className={styles.option}>
          <input type="radio" name="category" checked={!f.category} onChange={() => set({ ...f, category: null })} />
          All
        </label>
        {(Object.keys(categoryLabels) as Category[]).map((c) => (
          <label key={c} className={styles.option}>
            <input type="radio" name="category" checked={f.category === c} onChange={() => set({ ...f, category: c })} />
            {categoryLabels[c]}
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend>Concern</legend>
        {(Object.keys(concernLabels) as Concern[]).map((c) => (
          <label key={c} className={styles.option}>
            <input type="checkbox" checked={f.concerns.includes(c)} onChange={() => toggleConcern(c)} />
            {concernLabels[c]}
          </label>
        ))}
      </fieldset>

      <div className="field">
        <label htmlFor="filter-skin">Skin type</label>
        <select id="filter-skin" className="input" value={f.skinType ?? ''} onChange={(e) => set({ ...f, skinType: (e.target.value || null) as SkinType | null })}>
          <option value="">Any</option>
          {(Object.keys(skinTypeLabels) as SkinType[]).map((s) => (
            <option key={s} value={s}>
              {skinTypeLabels[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="filter-brand">Brand</label>
        <select id="filter-brand" className="input" value={f.brand ?? ''} onChange={(e) => set({ ...f, brand: e.target.value || null })}>
          <option value="">All brands</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <fieldset>
        <legend>Price</legend>
        <div className={styles.chips}>
          {PRICE_STEPS.map((p) => (
            <button key={p} type="button" className={styles.chip} aria-pressed={f.maxPrice === p} onClick={() => set({ ...f, maxPrice: f.maxPrice === p ? null : p })}>
              Under {formatNaira(p)}
            </button>
          ))}
        </div>
      </fieldset>

      <label className={styles.option}>
        <input type="checkbox" checked={f.inStock} onChange={(e) => set({ ...f, inStock: e.target.checked })} />
        Hide sold-out sizes
      </label>
    </div>
  )
}

function Chips({ f, set }: { f: Filters; set: (next: Filters) => void }) {
  const chips: { label: string; next: Filters }[] = []
  if (f.q) chips.push({ label: `“${f.q}”`, next: { ...f, q: '' } })
  if (f.category) chips.push({ label: categoryLabels[f.category], next: { ...f, category: null } })
  for (const c of f.concerns) chips.push({ label: concernLabels[c], next: { ...f, concerns: f.concerns.filter((x) => x !== c) } })
  if (f.skinType) chips.push({ label: `${skinTypeLabels[f.skinType]} skin`, next: { ...f, skinType: null } })
  if (f.brand) chips.push({ label: brands.find((b) => b.id === f.brand)!.name, next: { ...f, brand: null } })
  if (f.maxPrice) chips.push({ label: `Under ${formatNaira(f.maxPrice)}`, next: { ...f, maxPrice: null } })
  if (f.inStock) chips.push({ label: 'In stock', next: { ...f, inStock: false } })
  if (!chips.length) return null
  return (
    <ul role="list" className={styles.active} aria-label="Active filters">
      {chips.map((c) => (
        <li key={c.label}>
          <button type="button" onClick={() => set(c.next)}>
            {c.label}
            <Icon name="close" size={14} label={`Remove filter`} />
          </button>
        </li>
      ))}
    </ul>
  )
}

export function FilterPanel({ filters, resultCount }: { filters: Filters; resultCount: number }) {
  const { current, apply, pending } = useFilterNav(filters)
  const [open, setOpen] = useState(false)
  // In the sheet, changes are previewed locally and applied in one go.
  const [draft, setDraft] = useState<Filters>(filters)
  const draftCount = filterProducts(products, draft).length
  const count = activeFilterCount(current)

  return (
    <>
      <div className={styles.toolbar} data-pending={pending}>
        <button
          type="button"
          className={`btn btn-ghost ${styles.filterBtn}`}
          onClick={() => {
            setDraft(current)
            setOpen(true)
          }}
        >
          <Icon name="filter" size={18} /> Filter{count > 0 && <span className="num"> ({count})</span>}
        </button>
        <div className={styles.sort}>
          <label htmlFor="sort">Sort</label>
          <select id="sort" className="input" value={current.sort} onChange={(e) => apply({ ...current, sort: e.target.value as SortKey })}>
            {(Object.keys(sortLabels) as SortKey[]).map((s) => (
              <option key={s} value={s}>
                {sortLabels[s]}
              </option>
            ))}
          </select>
        </div>
        <Chips f={current} set={apply} />
      </div>

      <aside className={styles.sidebar} aria-label="Filters" data-pending={pending}>
        <Fields f={current} set={apply} />
        {count > 0 && (
          <button type="button" className="link-btn" onClick={() => apply({ ...emptyFilters, q: current.q, sort: current.sort })}>
            Clear filters
          </button>
        )}
        <p className="sr-only" aria-live="polite">
          {pending ? 'Updating results' : `${resultCount} results`}
        </p>
      </aside>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Filter"
        placement="left"
        footer={
          <div className={styles.sheetFoot}>
            <button type="button" className="btn btn-ghost" onClick={() => setDraft({ ...emptyFilters, q: draft.q, sort: draft.sort })}>
              Clear
            </button>
            <button
              type="button"
              className="btn btn-plum"
              disabled={draftCount === 0}
              onClick={() => {
                apply(draft)
                setOpen(false)
              }}
            >
              {draftCount === 0 ? 'No matches' : `Show ${draftCount} ${draftCount === 1 ? 'product' : 'products'}`}
            </button>
          </div>
        }
      >
        <Fields f={draft} set={setDraft} />
      </Dialog>
    </>
  )
}
