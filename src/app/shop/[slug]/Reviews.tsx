'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { Dialog } from '@/components/Dialog'
import { Icon } from '@/components/Icon'
import { Stars } from '@/components/Stars'
import { useToast } from '@/components/toast'
import type { Product, Review, SkinType } from '@/data/types'
import { useHydrated } from '@/hooks/useHydrated'
import { skinTypeLabels } from '@/lib/catalog'
import { useMyReviews } from '@/stores/reviews'
import styles from './product.module.css'

const EMPTY: Review[] = []
const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

type Sort = 'newest' | 'highest' | 'lowest'

export function Reviews({ product }: { product: Product }) {
  const hydrated = useHydrated()
  const mine = useMyReviews((s) => s.bySlug[product.slug] ?? EMPTY)
  const [skin, setSkin] = useState<SkinType | ''>('')
  const [stars, setStars] = useState<number | null>(null)
  const [sort, setSort] = useState<Sort>('newest')
  const [writing, setWriting] = useState(false)

  const all = useMemo(() => [...(hydrated ? mine : []), ...product.reviews], [hydrated, mine, product.reviews])
  const avg = all.length ? all.reduce((s, r) => s + r.rating, 0) / all.length : 0
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, count: all.filter((r) => r.rating === n).length }))
  const shown = all
    .filter((r) => (!skin || r.skinType === skin) && (!stars || r.rating === stars))
    .sort((a, b) => (sort === 'newest' ? b.date.localeCompare(a.date) : sort === 'highest' ? b.rating - a.rating : a.rating - b.rating))
  const mineIds = new Set(mine.map((r) => r.id))

  return (
    <section id="reviews" className={styles.reviews} aria-labelledby="reviews-title">
      <div className={styles.reviewSummary}>
        <h2 id="reviews-title" className={`display ${styles.h2}`}>
          Reviews
        </h2>
        {all.length > 0 && (
          <>
            <p className={styles.avg}>
              <span className="num">{avg.toFixed(1)}</span>
              <Stars value={avg} size={16} />
            </p>
            <p className="muted">From {all.length} {all.length === 1 ? 'review' : 'reviews'}</p>
            <ul role="list" className={styles.dist} aria-label="Filter by rating">
              {dist.map(({ n, count }) => (
                <li key={n}>
                  <button type="button" aria-pressed={stars === n} onClick={() => setStars(stars === n ? null : n)} disabled={!count}>
                    <span>{n} star</span>
                    <span className={styles.bar} aria-hidden>
                      <span style={{ transform: `scaleX(${all.length ? count / all.length : 0})` }} />
                    </span>
                    <span className="num">{count}</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
        <button type="button" className="btn btn-ghost" onClick={() => setWriting(true)}>
          Write a review
        </button>
      </div>

      <div className={styles.reviewList}>
        <div className={styles.reviewTools}>
          <div className="field">
            <label htmlFor="review-skin">Skin type</label>
            <select id="review-skin" className="input" value={skin} onChange={(e) => setSkin(e.target.value as SkinType | '')}>
              <option value="">All skin types</option>
              {(Object.keys(skinTypeLabels) as SkinType[]).map((s) => (
                <option key={s} value={s}>
                  {skinTypeLabels[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="review-sort">Sort</label>
            <select id="review-sort" className="input" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
              <option value="newest">Newest</option>
              <option value="highest">Highest rated</option>
              <option value="lowest">Lowest rated</option>
            </select>
          </div>
        </div>

        <p className="sr-only" role="status">
          Showing {shown.length} of {all.length} reviews
        </p>
        {shown.length ? (
          <ul role="list" className={styles.reviewItems}>
            {shown.map((r) => (
              <li key={r.id} className={styles.review}>
                <div className={styles.reviewHead}>
                  <Stars value={r.rating} size={13} />
                  {mineIds.has(r.id) ? <span className="pill pill-plum">Your review</span> : r.verified && <span className="pill pill-sage"><Icon name="check" size={12} /> Verified buyer</span>}
                </div>
                <h3 className={styles.reviewTitle}>{r.title}</h3>
                <p>{r.body}</p>
                <p className={styles.reviewMeta}>
                  {r.author}, {r.city} · {skinTypeLabels[r.skinType]} skin · <time dateTime={r.date}>{dateFmt.format(new Date(r.date))}</time>
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No reviews match. Try another skin type or rating.</p>
        )}
      </div>

      <WriteReview open={writing} onClose={() => setWriting(false)} product={product} />
    </section>
  )
}

function WriteReview({ open, onClose, product }: { open: boolean; onClose: () => void; product: Product }) {
  const add = useMyReviews((s) => s.add)
  const toast = useToast()
  const [errors, setErrors] = useState<Record<string, string>>({})

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const rating = Number(data.get('rating'))
    const title = String(data.get('title') ?? '').trim()
    const body = String(data.get('body') ?? '').trim()
    const author = String(data.get('author') ?? '').trim()
    const city = String(data.get('city') ?? '').trim()
    const skinType = String(data.get('skinType') ?? '') as SkinType
    const next: Record<string, string> = {}
    if (!rating) next.rating = 'Choose a star rating'
    if (title.length < 3) next.title = 'Give it a short headline'
    if (body.length < 20) next.body = 'Tell people a bit more (20 characters or so)'
    if (author.length < 2) next.author = 'Add your name, or just initials'
    if (!skinType) next.skinType = 'Choose your skin type'
    setErrors(next)
    if (Object.keys(next).length) {
      const first = e.currentTarget.querySelector<HTMLElement>(`[name="${Object.keys(next)[0]}"]`)
      first?.focus()
      return
    }
    add(product.slug, {
      id: `mine-${Date.now()}`,
      author,
      city: city || 'Lagos',
      skinType,
      rating: rating as Review['rating'],
      title,
      body,
      date: new Date().toISOString().slice(0, 10),
      verified: false,
    })
    toast('Thanks, your review is up', { tone: 'ok' })
    onClose()
  }

  const err = (k: string) =>
    errors[k] ? (
      <p className="error" id={`err-${k}`}>
        {errors[k]}
      </p>
    ) : null

  return (
    <Dialog open={open} onClose={onClose} title={`Review ${product.name}`}>
      <form className={styles.reviewForm} onSubmit={submit} noValidate>
        <fieldset data-invalid={!!errors.rating} aria-describedby={errors.rating ? 'err-rating' : undefined}>
          <legend className="label">Your rating</legend>
          <div className={styles.starInput}>
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n}>
                <input type="radio" name="rating" value={n} />
                <Icon name="star" size={28} />
                <span className="sr-only">{n} {n === 1 ? 'star' : 'stars'}</span>
              </label>
            ))}
          </div>
          {err('rating')}
        </fieldset>
        <div className="field">
          <label htmlFor="rv-title">Headline</label>
          <input id="rv-title" name="title" className="input" maxLength={80} aria-invalid={!!errors.title} aria-describedby={errors.title ? 'err-title' : undefined} />
          {err('title')}
        </div>
        <div className="field">
          <label htmlFor="rv-body">Your review</label>
          <textarea id="rv-body" name="body" className="input" rows={4} maxLength={800} aria-invalid={!!errors.body} aria-describedby={errors.body ? 'err-body' : undefined} />
          {err('body')}
        </div>
        <div className={styles.formRow}>
          <div className="field">
            <label htmlFor="rv-author">Name</label>
            <input id="rv-author" name="author" className="input" autoComplete="given-name" aria-invalid={!!errors.author} aria-describedby={errors.author ? 'err-author' : undefined} />
            {err('author')}
          </div>
          <div className="field">
            <label htmlFor="rv-city">City</label>
            <input id="rv-city" name="city" className="input" autoComplete="address-level2" />
          </div>
        </div>
        <div className="field">
          <label htmlFor="rv-skin">Skin type</label>
          <select id="rv-skin" name="skinType" className="input" defaultValue="" aria-invalid={!!errors.skinType} aria-describedby={errors.skinType ? 'err-skinType' : undefined}>
            <option value="" disabled>
              Choose one
            </option>
            {(Object.keys(skinTypeLabels) as SkinType[]).map((s) => (
              <option key={s} value={s}>
                {skinTypeLabels[s]}
              </option>
            ))}
          </select>
          {err('skinType')}
        </div>
        <p className="hint">Reviews you write are saved in this browser only.</p>
        <button type="submit" className="btn btn-plum btn-block">
          Post review
        </button>
      </form>
    </Dialog>
  )
}
