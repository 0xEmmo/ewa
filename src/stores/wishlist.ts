'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WishlistState {
  slugs: string[]
  toggle: (slug: string) => boolean
}

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      slugs: [],
      toggle: (slug) => {
        const has = get().slugs.includes(slug)
        set({ slugs: has ? get().slugs.filter((s) => s !== slug) : [slug, ...get().slugs] })
        return !has
      },
    }),
    { name: 'ewa.wishlist', version: 1 },
  ),
)
