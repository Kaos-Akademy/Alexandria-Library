import { Suspense } from 'react'
import Books from '@/components/Books'

export default function LibraryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <Books />
    </Suspense>
  )
}
