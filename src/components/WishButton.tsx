'use client'

import { useHydrated } from '@/hooks/useHydrated'
import { useWishlist } from '@/stores/wishlist'
import { Icon } from './Icon'
import { useToast } from './toast'
import styles from './WishButton.module.css'

export function WishButton({ slug, name, variant = 'overlay' }: { slug: string; name: string; variant?: 'overlay' | 'inline' }) {
  const hydrated = useHydrated()
  const saved = useWishlist((s) => s.slugs.includes(slug)) && hydrated
  const toggle = useWishlist((s) => s.toggle)
  const toast = useToast()

  return (
    <button
      type="button"
      className={styles.btn}
      data-variant={variant}
      aria-pressed={saved}
      aria-label={variant === 'overlay' ? `Save ${name}` : undefined}
      onClick={() => toast(toggle(slug) ? `Saved ${name} to your wishlist` : `Removed ${name} from your wishlist`)}
    >
      <Icon name="heart" size={20} filled={saved} />
      {variant === 'inline' && <span>{saved ? 'Saved' : 'Save'}</span>}
    </button>
  )
}
