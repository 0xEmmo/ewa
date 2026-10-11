'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Review } from '@/data/types'

interface ReviewsState {
  bySlug: Record<string, Review[]>
  add: (slug: string, review: Review) => void
}

/** Reviews you write stay in this browser; there is no server to send them to. */
export const useMyReviews = create<ReviewsState>()(
  persist(
    (set) => ({
      bySlug: {},
      add: (slug, review) => set((s) => ({ bySlug: { ...s.bySlug, [slug]: [review, ...(s.bySlug[slug] ?? [])] } })),
    }),
    { name: 'ewa.reviews', version: 1 },
  ),
)
