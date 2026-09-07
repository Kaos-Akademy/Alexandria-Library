'use client'

import { usePathname } from 'next/navigation'
import Nav from '@/components/Nav'
import Footer from '@/components/landing/Footer'

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isReaderRoute = pathname.startsWith('/read')

  if (isReaderRoute) {
    return <>{children}</>
  }

  return (
    <>
      <Nav />
      {children}
      <Footer />
    </>
  )
}
