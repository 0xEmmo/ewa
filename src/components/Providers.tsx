'use client'

import type { ReactNode } from 'react'
import { BagDrawer } from './BagDrawer'
import { OfflineBanner } from './OfflineBanner'
import { ServiceWorker } from './ServiceWorker'
import { Toaster } from './Toaster'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <Toaster>
      <OfflineBanner />
      {children}
      <BagDrawer />
      <ServiceWorker />
    </Toaster>
  )
}
