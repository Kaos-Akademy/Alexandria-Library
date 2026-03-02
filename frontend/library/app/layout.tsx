import type { Metadata } from 'next'
import '@/components/ui/title-animation.css'
import './globals.css'
import Providers from '@/components/Providers'

export const metadata: Metadata = {
  title: 'Alexandria Library',
  description: 'Knowledge belongs to everyone, forever.',
  icons: { icon: '/owl.jpeg' },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
