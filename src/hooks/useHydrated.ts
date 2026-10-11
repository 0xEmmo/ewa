'use client'

import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}

/**
 * False during SSR and the hydration render, true afterwards. Persisted
 * stores read localStorage, so anything that depends on them waits for this.
 */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
}
