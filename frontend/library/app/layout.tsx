import type { Metadata, Viewport } from 'next'
import '@/components/ui/title-animation.css'
import './globals.css'
import Providers from '@/components/Providers'
import SiteChrome from '@/components/SiteChrome'

export const metadata: Metadata = {
  title: 'Alexandria Library — Knowledge Preserved Forever',
  description:
    'A decentralized, on-chain library of books — especially the ones they tried to ban. Free to read. Impossible to delete.',
  icons: { icon: '/owl.jpeg' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <SiteChrome>{children}</SiteChrome>
        </Providers>
      </body>
    </html>
  )
}
