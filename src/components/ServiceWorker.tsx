'use client'

import { useEffect } from 'react'
import { useToast } from './toast'

/** Registers public/sw.js in production and offers a reload when a new version has been cached. */
export function ServiceWorker() {
  const toast = useToast()

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return
    let cancelled = false
    // The very first install claims the page; only reload for real updates.
    const hadController = !!navigator.serviceWorker.controller
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).then((reg) => {
      reg.addEventListener('updatefound', () => {
        const next = reg.installing
        next?.addEventListener('statechange', () => {
          if (cancelled || next.state !== 'installed' || !navigator.serviceWorker.controller) return
          toast('A new version of Ẹwà is ready', {
            action: { label: 'Reload', onClick: () => next.postMessage('skip-waiting') },
          })
        })
      })
    })
    const onChange = () => hadController && window.location.reload()
    navigator.serviceWorker.addEventListener('controllerchange', onChange)
    return () => {
      cancelled = true
      navigator.serviceWorker.removeEventListener('controllerchange', onChange)
    }
  }, [toast])

  return null
}
