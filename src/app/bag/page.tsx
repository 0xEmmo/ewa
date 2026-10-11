import type { Metadata } from 'next'
import { BagView } from './BagView'

export const metadata: Metadata = { title: 'Your bag' }

export default function BagPage() {
  return <BagView />
}
