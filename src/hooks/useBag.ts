'use client'

import { useMemo } from 'react'
import { computeTotals, priceLines } from '@/lib/pricing'
import { useCart } from '@/stores/cart'
import { useHydrated } from './useHydrated'

/** The bag, priced from the catalogue. Empty until hydrated so SSR and client agree. */
export function useBag() {
  const hydrated = useHydrated()
  const raw = useCart((s) => s.lines)
  const lines = useMemo(() => (hydrated ? priceLines(raw) : []), [raw, hydrated])
  const totals = useMemo(() => computeTotals(lines), [lines])
  return { hydrated, lines, totals }
}
