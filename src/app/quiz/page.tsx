import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Quiz } from './Quiz'

export const metadata: Metadata = {
  title: 'Find my routine',
  description: 'Six questions, two minutes: a morning and night routine built for your skin, with the reasoning for every step.',
}

export default function QuizPage() {
  return (
    <Suspense fallback={<div className="wrap" style={{ minHeight: '70vh' }} aria-busy="true" />}>
      <Quiz />
    </Suspense>
  )
}
