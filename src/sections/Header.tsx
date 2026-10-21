import { useEffect, useState } from 'react'

const links = [
  { href: '#sorun', label: 'The Problem' },
  { href: '#nasil', label: 'How it works' },
  { href: '#teardown', label: 'What we learned' },
  { href: '#demo', label: 'Live demo' },
  { href: '#pilot', label: 'Pilot' },
  { href: '#sss', label: 'FAQ' },
]

function Logo() {
  return (
    <a href="#top" className="flex items-center gap-2.5 group" aria-label="Konum home">
      <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true" className="transition-transform duration-500 group-hover:rotate-180">
        <circle cx="12" cy="15" r="9" fill="hsl(14 100% 50%)" />
        <circle cx="21" cy="15" r="5.5" fill="none" stroke="hsl(0 0% 9.4%)" strokeWidth="2.5" />
      </svg>
      <span className="font-display font-bold text-xl tracking-tight">Konum</span>
    </a>
  )
}

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-200 ${
        scrolled ? 'bg-[#fcfcf9]/85 backdrop-blur-md border-b border-border' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto max-w-7xl px-5 md:px-8 h-16 grid grid-cols-2 md:grid-cols-3 items-center">
        <Logo />
        <nav className="hidden md:flex items-center justify-center gap-6" aria-label="Main navigation">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-semibold text-foreground/70 hover:text-foreground transition-colors duration-150"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center justify-end gap-3">
          <a
            href="#pilot"
            className="hidden md:inline-flex items-center rounded-md bg-foreground text-background px-4 py-2 text-sm font-bold transition-all duration-150 hover:bg-[#c52a00] active:scale-[0.97]"
          >
            Early access
          </a>
          <button
            type="button"
            className="md:hidden inline-flex h-11 w-11 items-center justify-center rounded-md border border-border bg-background cursor-pointer"
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
              {open ? (
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              ) : (
                <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>
      {open && (
        <nav className="md:hidden border-t border-border bg-[#fcfcf9] px-5 py-4 flex flex-col gap-1" aria-label="Mobile navigation">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="py-3 text-base font-semibold border-b border-border/60 last:border-0"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#pilot"
            onClick={() => setOpen(false)}
            className="mt-2 inline-flex items-center justify-center rounded-md bg-foreground text-background px-4 py-3 text-sm font-bold active:scale-[0.97]"
          >
            Early access
          </a>
        </nav>
      )}
    </header>
  )
}
