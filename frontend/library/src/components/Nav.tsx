'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Banned Books', href: '/banned-books', badge: true },
  { label: 'Library', href: '/library' },
  { label: 'Micro-Learning', href: '/learn' },
  { label: 'Contribute', href: '/contribute' },
]

function isDarkPage(pathname: string): boolean {
  return pathname === '/' || pathname.startsWith('/banned-books')
}

export default function Nav() {
  const pathname = usePathname()
  const dark = isDarkPage(pathname)
  const isLanding = pathname === '/'

  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!isLanding) return
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [isLanding])

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!menuOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [menuOpen])

  const atTop = isLanding && !scrolled
  const showDarkBg = dark ? (isLanding ? scrolled : true) : false

  const navBg = atTop
    ? 'rgba(255, 255, 255, 0.97)'
    : showDarkBg
      ? '#0d0d14'
      : 'rgba(255, 255, 255, 0.97)'

  const useLightText = dark && !atTop
  const textColor = useLightText ? '#ffffff' : '#0d0d14'
  const mutedColor = useLightText ? 'rgba(255,255,255,0.7)' : '#4b5563'
  const borderColor = useLightText ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const walletBorderColor = useLightText ? 'rgba(255,255,255,0.5)' : '#0d0d14'
  const walletTextColor = useLightText ? 'rgba(255,255,255,0.85)' : '#0d0d14'

  return (
    <>
      <nav
        style={{
          background: navBg,
          borderBottom: menuOpen ? 'none' : `1px solid ${borderColor}`,
          color: textColor,
          transition: 'background 0.3s ease, border-color 0.3s ease',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backdropFilter: showDarkBg || !dark ? 'blur(12px)' : 'none',
          WebkitBackdropFilter: showDarkBg || !dark ? 'blur(12px)' : 'none',
          height: 'var(--nav-height)',
        }}
      >
        <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="alex-gradient-text shrink-0 text-lg font-bold tracking-widest"
            style={{ fontFamily: "'Share Tech Mono', monospace", textDecoration: 'none' }}
          >
            ALEXANDRIA
          </Link>

          <div
            className="absolute left-1/2 flex max-w-[calc(100%-8rem)] -translate-x-1/2 items-center justify-center sm:max-w-none sm:px-32"
            style={{
              opacity: atTop ? 1 : 0,
              pointerEvents: atTop ? 'auto' : 'none',
              transition: 'opacity 0.3s ease',
            }}
          >
            <p
              className="text-center text-[11px] font-medium leading-snug tracking-wide sm:text-sm sm:whitespace-nowrap"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontStyle: 'italic',
                color: '#374151',
                margin: 0,
              }}
            >
              Knowledge belongs to everyone
            </p>
          </div>

          <div
            className="hidden-mobile absolute left-1/2 flex -translate-x-1/2 items-center gap-7"
            style={{
              opacity: atTop ? 0 : 1,
              pointerEvents: atTop ? 'none' : 'auto',
              transition: 'opacity 0.3s ease',
            }}
          >
            {NAV_LINKS.map(({ label, href, badge }) => {
              const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  style={{
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: isActive ? '#2ecc71' : mutedColor,
                    borderBottom: isActive ? '1.5px solid #2ecc71' : '1.5px solid transparent',
                    paddingBottom: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                  {badge && <span style={{ color: '#c0392b', fontSize: '1rem', lineHeight: 1 }}>•</span>}
                </Link>
              )
            })}
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <Link
              href="/contribute"
              className="hidden-mobile touch-target items-center justify-center rounded-md border px-3.5 text-xs font-semibold"
              style={{
                textDecoration: 'none',
                fontFamily: "'Share Tech Mono', monospace",
                letterSpacing: '0.05em',
                color: walletTextColor,
                borderColor: walletBorderColor,
              }}
            >
              Connect Wallet
            </Link>

            <button
              type="button"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
              className="show-mobile touch-target items-center justify-center border-0 bg-transparent text-2xl"
              style={{ color: textColor, cursor: 'pointer' }}
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </nav>

      {menuOpen && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="show-mobile fixed inset-0 z-[98] bg-black/50"
            onClick={() => setMenuOpen(false)}
          />
          <div
            className="show-mobile fixed left-0 right-0 z-[99] max-h-[calc(100dvh-var(--nav-height))] overflow-y-auto border-b shadow-xl"
            style={{
              top: 'var(--nav-height)',
              background: dark ? '#0d0d14' : 'rgba(255,255,255,0.98)',
              borderColor,
              backdropFilter: 'blur(12px)',
            }}
          >
            <div className="flex flex-col gap-1 px-4 py-4 pb-6">
              {NAV_LINKS.map(({ label, href, badge }) => {
                const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className="touch-target flex items-center gap-2 border-b px-1 text-base font-medium"
                    style={{
                      textDecoration: 'none',
                      color: isActive ? '#2ecc71' : dark ? 'rgba(255,255,255,0.85)' : '#111',
                      borderColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                    }}
                  >
                    {label}
                    {badge && <span style={{ color: '#c0392b' }}>•</span>}
                  </Link>
                )
              })}
              <Link
                href="/contribute"
                onClick={() => setMenuOpen(false)}
                className="touch-target mt-3 flex items-center justify-center rounded-md border px-4 text-sm font-semibold"
                style={{
                  textDecoration: 'none',
                  fontFamily: "'Share Tech Mono', monospace",
                  color: walletTextColor,
                  borderColor: walletBorderColor,
                }}
              >
                Connect Wallet
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  )
}
