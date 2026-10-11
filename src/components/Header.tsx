'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, Suspense } from 'react'
import { useBag } from '@/hooks/useBag'
import { useHydrated } from '@/hooks/useHydrated'
import { categoryLabels } from '@/lib/catalog'
import { useUi } from '@/stores/ui'
import { useWishlist } from '@/stores/wishlist'
import { Dialog } from './Dialog'
import { Icon } from './Icon'
import { SearchPanel } from './SearchPanel'
import styles from './Header.module.css'

const NAV = [
  { href: '/shop', label: 'Shop all' },
  { href: '/shop?category=treat', label: 'Serums' },
  { href: '/shop?category=protect', label: 'Sunscreen' },
  { href: '/shop?category=body', label: 'Body' },
  { href: '/quiz', label: 'Routine quiz' },
]

export function Wordmark() {
  return (
    <Link href="/" className={styles.wordmark} aria-label="Ẹwà, home">
      Ẹwà
    </Link>
  )
}

/**
 * The pathname is request data on dynamic routes (order pages), so the
 * active-link state streams in; the fallback is the same header without it.
 */
export function Header() {
  return (
    <Suspense fallback={<HeaderView pathname={null} />}>
      <HeaderWithPath />
    </Suspense>
  )
}

function HeaderWithPath() {
  return <HeaderView pathname={usePathname()} />
}

function HeaderView({ pathname }: { pathname: string | null }) {
  const openBag = useUi((s) => s.openBag)
  const { totals } = useBag()
  const hydrated = useHydrated()
  const saved = useWishlist((s) => s.slugs.length)
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const count = totals.itemCount

  return (
    <>
      <p className={styles.notice}>
        Free Lagos delivery over ₦40,000<span className={styles.noticeMore}> · Order by noon for same-day</span>
      </p>
      <header className={styles.header}>
        <div className={`wrap ${styles.bar}`}>
          <button type="button" className={`${styles.iconBtn} ${styles.menuBtn}`} onClick={() => setMenuOpen(true)} aria-label="Menu">
            <Icon name="menu" size={22} />
          </button>

          <nav aria-label="Main" className={styles.nav}>
            <ul role="list">
              {NAV.slice(0, 4).map((n) => (
                <li key={n.href}>
                  <Link href={n.href} aria-current={pathname === n.href ? 'page' : undefined}>
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <Wordmark />

          <div className={styles.actions}>
            <Link href="/quiz" className={styles.quiz} aria-current={pathname === '/quiz' ? 'page' : undefined}>
              Find my routine
            </Link>
            <button type="button" className={styles.iconBtn} onClick={() => setSearchOpen(true)} aria-label="Search">
              <Icon name="search" size={22} />
            </button>
            <Link href="/wishlist" className={`${styles.iconBtn} ${styles.wish}`} aria-label={`Wishlist${hydrated && saved ? `, ${saved} saved` : ''}`}>
              <Icon name="heart" size={22} />
              {hydrated && saved > 0 && <span className={styles.dot} aria-hidden />}
            </Link>
            <button type="button" className={styles.iconBtn} onClick={openBag} aria-label={`Bag, ${count} ${count === 1 ? 'item' : 'items'}`}>
              <Icon name="bag" size={22} />
              {count > 0 && (
                <span className={`${styles.count} num`} aria-hidden>
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <SearchPanel open={searchOpen} onClose={() => setSearchOpen(false)} />

      <Dialog open={menuOpen} onClose={() => setMenuOpen(false)} title="Menu" placement="left">
        <nav aria-label="Mobile" className={styles.mobileNav}>
          <ul role="list">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} onClick={() => setMenuOpen(false)}>
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="eyebrow">By category</p>
          <ul role="list" className={styles.cats}>
            {Object.entries(categoryLabels).map(([id, label]) => (
              <li key={id}>
                <Link href={`/shop?category=${id}`} onClick={() => setMenuOpen(false)}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <ul role="list" className={styles.cats}>
            <li>
              <Link href="/wishlist" onClick={() => setMenuOpen(false)}>
                Wishlist
              </Link>
            </li>
            <li>
              <Link href="/orders" onClick={() => setMenuOpen(false)}>
                Orders
              </Link>
            </li>
          </ul>
        </nav>
      </Dialog>
    </>
  )
}
