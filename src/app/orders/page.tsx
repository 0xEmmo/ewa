import type { Metadata } from 'next'
import { OrdersList } from './OrdersList'

export const metadata: Metadata = { title: 'Your orders' }

export default function OrdersPage() {
  return <OrdersList />
}
