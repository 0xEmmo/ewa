'use client'

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { lineKey, MAX_PER_LINE, type CartLine } from '@/lib/pricing'

interface CartState {
  lines: CartLine[]
  promoCode: string | null
  add: (line: CartLine) => void
  addMany: (lines: CartLine[]) => void
  setQty: (key: string, qty: number) => void
  remove: (key: string) => { line: CartLine; index: number } | null
  restore: (line: CartLine, index: number) => void
  setPromo: (code: string | null) => void
  clear: () => void
}

function merge(lines: CartLine[], incoming: CartLine): CartLine[] {
  const key = lineKey(incoming)
  const existing = lines.find((l) => lineKey(l) === key)
  if (!existing) return [...lines, { ...incoming, qty: Math.min(MAX_PER_LINE, incoming.qty) }]
  return lines.map((l) =>
    lineKey(l) === key ? { ...l, qty: Math.min(MAX_PER_LINE, l.qty + incoming.qty), routineId: l.routineId ?? incoming.routineId } : l,
  )
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      promoCode: null,
      add: (line) => set((s) => ({ lines: merge(s.lines, line) })),
      addMany: (lines) => set((s) => ({ lines: lines.reduce(merge, s.lines) })),
      setQty: (key, qty) =>
        set((s) => ({ lines: s.lines.map((l) => (lineKey(l) === key ? { ...l, qty: Math.max(1, Math.min(MAX_PER_LINE, qty)) } : l)) })),
      remove: (key) => {
        const index = get().lines.findIndex((l) => lineKey(l) === key)
        if (index < 0) return null
        const line = get().lines[index]!
        set((s) => ({ lines: s.lines.filter((_, i) => i !== index) }))
        return { line, index }
      },
      restore: (line, index) =>
        set((s) => {
          if (s.lines.some((l) => lineKey(l) === lineKey(line))) return s
          const lines = [...s.lines]
          lines.splice(index, 0, line)
          return { lines }
        }),
      setPromo: (promoCode) => set({ promoCode }),
      clear: () => set({ lines: [], promoCode: null }),
    }),
    { name: 'ewa.cart', version: 1, storage: createJSONStorage(() => localStorage) },
  ),
)
