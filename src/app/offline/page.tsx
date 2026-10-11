import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Offline' }

/** Served by the service worker when a page that was never visited is requested offline. */
export default function OfflinePage() {
  return (
    <div className="wrap" style={{ paddingBlock: 'var(--space-9)', display: 'grid', gap: 'var(--space-5)', justifyItems: 'start' }}>
      <p className="eyebrow">Offline</p>
      <h1 className="display" style={{ fontSize: 'var(--step-4)' }}>
        You’re offline
      </h1>
      <p className="muted" style={{ maxWidth: '34rem' }}>
        This page hasn’t been saved for offline use yet. Your bag, wishlist and orders are kept on this device, and any page you’ve opened before will still work.
      </p>
      <Link href="/" className="btn">
        Go home
      </Link>
    </div>
  )
}
