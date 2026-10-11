'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useId, useState } from 'react'
import { formatNaira } from '@/lib/money'
import { Dialog } from './Dialog'
import { Icon } from './Icon'
import { Photo } from './Photo'
import styles from './SearchPanel.module.css'

interface Hit {
  slug: string
  name: string
  brand: string
  tagline: string
  fromPrice: number
  photo: string
}

const SUGGESTIONS = ['sunscreen', 'dark marks', 'shea', 'niacinamide', 'lipstick']

export function SearchPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [hits, setHits] = useState<Hit[] | null>(null)
  const [active, setActive] = useState(-1)
  const listId = useId()

  useEffect(() => {
    const term = q.trim()
    if (term.length < 2) return
    const ctrl = new AbortController()
    const t = window.setTimeout(() => {
      fetch(`/api/products?q=${encodeURIComponent(term)}&limit=6`, { signal: ctrl.signal })
        .then((r) => r.json() as Promise<Hit[]>)
        .then((h) => {
          setHits(h)
          setActive(-1)
        })
        .catch(() => {})
    }, 160)
    return () => {
      ctrl.abort()
      window.clearTimeout(t)
    }
  }, [q])

  const shown = q.trim().length >= 2 ? hits : null

  const go = (href: string) => {
    onClose()
    setQ('')
    setHits(null)
    router.push(href)
  }

  return (
    <Dialog open={open} onClose={onClose} title="Search" placement="top" hideTitle>
      <form
        role="search"
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault()
          const hit = shown && active >= 0 ? shown[active] : null
          if (hit) go(`/shop/${hit.slug}`)
          else if (q.trim()) go(`/shop?q=${encodeURIComponent(q.trim())}`)
        }}
      >
        <Icon name="search" size={22} />
        <input
          autoFocus
          type="search"
          role="combobox"
          aria-label="Search products, ingredients or concerns"
          aria-expanded={!!shown?.length}
          aria-controls={listId}
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          aria-autocomplete="list"
          placeholder="Try “sunscreen” or “dark marks”"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (!shown?.length) return
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setActive((i) => (i + 1) % shown.length)
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setActive((i) => (i <= 0 ? shown.length - 1 : i - 1))
            }
          }}
        />
      </form>

      {shown === null ? (
        <div className={styles.suggest}>
          <p className="eyebrow">Popular</p>
          <ul role="list">
            {SUGGESTIONS.map((s) => (
              <li key={s}>
                <button type="button" onClick={() => setQ(s)}>
                  {s}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : shown.length === 0 ? (
        <p className={styles.none} role="status">
          Nothing matches “{q.trim()}”. Try an ingredient like shea or niacinamide.
        </p>
      ) : (
        <>
          <ul id={listId} role="listbox" aria-label="Suggestions" className={styles.hits}>
            {shown.map((h, i) => (
              <li key={h.slug} id={`${listId}-${i}`} role="option" aria-selected={i === active} className={styles.hit} data-active={i === active}>
                <Link href={`/shop/${h.slug}`} onClick={(e) => (e.preventDefault(), go(`/shop/${h.slug}`))} tabIndex={-1}>
                  <Photo name={h.photo} alt="" sizes="56px" ratio={1} className={styles.thumb} />
                  <span>
                    <span className={styles.brand}>{h.brand}</span>
                    <span className={styles.name}>{h.name}</span>
                  </span>
                  <span className="num">{formatNaira(h.fromPrice)}</span>
                </Link>
              </li>
            ))}
          </ul>
          <button type="button" className={`link-btn ${styles.all}`} onClick={() => go(`/shop?q=${encodeURIComponent(q.trim())}`)}>
            See all results for “{q.trim()}”
          </button>
        </>
      )}
    </Dialog>
  )
}
