'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Order } from '@/lib/orders'

interface OrdersState {
  orders: Order[]
  add: (o: Order) => void
  cancel: (id: string) => void
}

export const useOrders = create<OrdersState>()(
  persist(
    (set) => ({
      orders: [],
      add: (o) => set((s) => ({ orders: [o, ...s.orders.filter((x) => x.id !== o.id)] })),
      cancel: (id) =>
        set((s) => ({ orders: s.orders.map((o) => (o.id === id ? { ...o, cancelledAt: new Date().toISOString() } : o)) })),
    }),
    { name: 'ewa.orders', version: 1 },
  ),
)
