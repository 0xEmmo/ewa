import type { Metadata } from 'next'
import { Suspense } from 'react'
import { OrderView } from './OrderView'

export const metadata: Metadata = { title: 'Order' }

async function Resolve({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <OrderView id={decodeURIComponent(id)} />
}

export default function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="wrap" style={{ minHeight: '60vh' }} aria-busy="true" />}>
      <Resolve params={params} />
    </Suspense>
  )
}
