'use client'

import { useSyncExternalStore } from 'react'
import { Icon } from './Icon'
import styles from './OfflineBanner.module.css'

const subscribe = (cb: () => void) => {
  window.addEventListener('online', cb)
  window.addEventListener('offline', cb)
  return () => {
    window.removeEventListener('online', cb)
    window.removeEventListener('offline', cb)
  }
}

export function OfflineBanner() {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true)
  if (online) return null
  return (
    <p className={styles.banner} role="status">
      <Icon name="wifiOff" size={18} /> You’re offline. Pages you’ve visited still work, and your bag is saved on this device.
    </p>
  )
}
