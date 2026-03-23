'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0)
    onScroll() // check initial state
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      {/* Top Black Bar */}
      <div className="bg-gio-black h-[50px] w-full" />

      {/* Main Navigation */}
      <header className={`sticky top-0 z-50 bg-white border-b transition-colors duration-300 ${scrolled ? 'border-gio-black/10' : 'border-transparent'}`}>
        <div className="max-w-container mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between py-5">
            {/* Left: Logo + Nav Links */}
            <div className="flex items-center gap-12">
              {/* Logo */}
              <Link href="/" className="flex-shrink-0">
                <Image
                  src="/gio-logo.svg"
                  alt="GIO Architectural Tile & Stone"
                  width={131}
                  height={54}
                  priority
                />
              </Link>

              {/* Primary Nav Links */}
              <nav className="hidden lg:flex items-center gap-6">
                <NavLink href="/tile-stone">Tile &amp; Stone</NavLink>
                <NavLink href="/collections">Collections</NavLink>
                <NavLink href="/resources">Resources</NavLink>
              </nav>
            </div>

            {/* Right: Search + Secondary Nav */}
            <div className="flex items-center gap-6">
              {/* Search Pill */}
              <div className="hidden md:flex items-center gap-6 bg-gio-grey rounded-full px-6 py-4 cursor-pointer hover:bg-[#ebebeb] transition-colors">
                <SearchIcon />
                <span className="text-[14px] text-gio-black/80 tracking-[-0.02em] whitespace-nowrap">
                  What are you looking for?
                </span>
              </div>

              {/* Mobile Search Icon */}
              <button className="md:hidden p-2" aria-label="Search">
                <SearchIcon />
              </button>

              {/* Secondary Nav Links */}
              <nav className="hidden lg:flex items-center gap-6">
                <SecondaryNavLink href="/blog">Blog</SecondaryNavLink>
                <SecondaryNavLink href="/company">Company</SecondaryNavLink>
                <SecondaryNavLink href="/contact">Contact</SecondaryNavLink>
              </nav>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2"
                aria-label="Menu"
              >
                <MenuIcon open={mobileMenuOpen} />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`
            lg:hidden absolute left-0 right-0 top-full bg-white border-t border-gio-grey
            transition-all duration-300 overflow-hidden z-50
            ${mobileMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}
          `}
        >
          <nav className="max-w-container mx-auto px-6 lg:px-12 py-8 flex flex-col gap-5">
            {/* Mobile Search */}
            <div className="flex items-center gap-4 bg-gio-grey rounded-full px-6 py-4 md:hidden">
              <SearchIcon />
              <input
                type="text"
                placeholder="What are you looking for?"
                className="bg-transparent text-[14px] text-gio-black tracking-[-0.02em] w-full outline-none placeholder:text-gio-black/80"
              />
            </div>

            <MobileNavLink href="/tile-stone" onClick={() => setMobileMenuOpen(false)}>
              Tile &amp; Stone
            </MobileNavLink>
            <MobileNavLink href="/collections" onClick={() => setMobileMenuOpen(false)}>
              Collections
            </MobileNavLink>
            <MobileNavLink href="/resources" onClick={() => setMobileMenuOpen(false)}>
              Resources
            </MobileNavLink>
            <hr className="border-gio-grey" />
            <MobileNavLink href="/blog" onClick={() => setMobileMenuOpen(false)}>
              Blog
            </MobileNavLink>
            <MobileNavLink href="/company" onClick={() => setMobileMenuOpen(false)}>
              Company
            </MobileNavLink>
            <MobileNavLink href="/contact" onClick={() => setMobileMenuOpen(false)}>
              Contact
            </MobileNavLink>
          </nav>
        </div>
      </header>
    </>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-[16px] text-gio-black tracking-[-0.02em] leading-none whitespace-nowrap hover:text-gio-red transition-colors"
    >
      {children}
    </Link>
  )
}

function SecondaryNavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-[16px] text-gio-black tracking-[-0.02em] leading-none whitespace-nowrap hover:text-gio-red transition-colors"
    >
      {children}
    </Link>
  )
}

function MobileNavLink({
  href,
  children,
  onClick,
}: {
  href: string
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="text-[22px] text-gio-black tracking-[-0.02em] hover:text-gio-red transition-colors"
    >
      {children}
    </Link>
  )
}

function SearchIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 17 17"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-gio-black flex-shrink-0"
    >
      <circle cx="7.5" cy="7.5" r="6" />
      <path d="m12 12 4 4" />
    </svg>
  )
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="transition-transform duration-300"
    >
      {open ? (
        <>
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </>
      ) : (
        <>
          <path d="M4 12h16" />
          <path d="M4 6h16" />
          <path d="M4 18h16" />
        </>
      )}
    </svg>
  )
}
