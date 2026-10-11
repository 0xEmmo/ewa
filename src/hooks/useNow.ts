'use client'

import { useCallback, useSyncExternalStore } from 'react'

const EPOCH = new Date(0)

/**
 * The current time, refreshed every `ms`. Reads as the epoch during
 * prerendering, so time-dependent UI must sit behind a hydration check.
 */
export function useNow(ms = 1000) {
  const subscribe = useCallback(
    (notify: () => void) => {
      const t = setInterval(() => {
        current = new Date()
        notify()
      }, ms)
      return () => clearInterval(t)
    },
    [ms],
  )
  return useSyncExternalStore(subscribe, snapshot, () => EPOCH)
}

let current: Date | null = null
function snapshot() {
  // Refresh lazily on the first read after hydration; the interval keeps it moving.
  if (!current || Date.now() - current.getTime() > 60000) current = new Date()
  return current
}
