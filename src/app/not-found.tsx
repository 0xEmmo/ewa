import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="wrap" style={{ paddingBlock: 'var(--space-9)', display: 'grid', gap: 'var(--space-5)', justifyItems: 'start' }}>
      <p className="eyebrow">404</p>
      <h1 className="display" style={{ fontSize: 'var(--step-4)' }}>
        That page has wandered off
      </h1>
      <p className="muted">It may have sold out for good, or the link has a typo.</p>
      <Link href="/shop" className="btn">
        Back to the shop
      </Link>
    </div>
  )
}
