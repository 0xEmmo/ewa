import type { Metadata } from 'next'
import { WishlistView } from './WishlistView'

export const metadata: Metadata = { title: 'Wishlist' }

export default function WishlistPage() {
  return <WishlistView />
}
