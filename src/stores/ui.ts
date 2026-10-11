'use client'

import { create } from 'zustand'

interface UiState {
  bagOpen: boolean
  openBag: () => void
  closeBag: () => void
}

export const useUi = create<UiState>()((set) => ({
  bagOpen: false,
  openBag: () => set({ bagOpen: true }),
  closeBag: () => set({ bagOpen: false }),
}))
