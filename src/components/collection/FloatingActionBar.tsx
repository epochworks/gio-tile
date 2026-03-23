'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSampleCart } from '@/context/SampleCartContext'

/** Routes where the bar is always visible (regardless of sample count) */
const ALWAYS_VISIBLE_PREFIXES = ['/collections', '/tile-stone']

export default function FloatingActionBar() {
  const { count } = useSampleCart()
  const router = useRouter()
  const pathname = usePathname()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Always show on collection/archive pages, or on any page if samples are in cart
  const isAlwaysVisibleRoute = ALWAYS_VISIBLE_PREFIXES.some((p) => pathname.startsWith(p))
  const visible = isAlwaysVisibleRoute || count > 0

  if (!visible && !searchOpen) return null

  return (
    <>
      {/* Floating bar */}
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 ${
          visible
            ? 'translate-y-0 opacity-100'
            : 'translate-y-4 opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-1 bg-gio-black/90 backdrop-blur-md rounded-full px-2 py-2 shadow-2xl">
          {/* Search */}
          <ActionButton
            label="Search"
            onClick={() => setSearchOpen(!searchOpen)}
            icon={<SearchIcon />}
          />

          {/* Support */}
          <ActionButton
            label="Support"
            onClick={() => {}}
            icon={<SupportIcon />}
          />

          {/* Samples */}
          <ActionButton
            label={count > 0 ? `Samples (${count})` : 'Samples'}
            onClick={() => router.push('/samples')}
            icon={<SamplesIcon />}
            badge={count > 0 ? count : undefined}
          />
        </div>
      </div>

      {/* Search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-gio-black/80 backdrop-blur-sm flex items-start justify-center pt-[20vh]">
          <div className="w-full max-w-xl mx-4">
            <div className="relative">
              <svg
                className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setSearchOpen(false)
                    setSearchQuery('')
                  }
                }}
                placeholder="Search collections..."
                className="w-full bg-white/10 border border-white/20 rounded-full pl-14 pr-12 py-4 text-[16px] text-white placeholder:text-white/30 focus:outline-none focus:border-white/40"
              />
              <button
                type="button"
                onClick={() => {
                  setSearchOpen(false)
                  setSearchQuery('')
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path
                    d="M4 4L14 14M14 4L4 14"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* ── Action button with hover-expand label ── */

function ActionButton({
  label,
  onClick,
  icon,
  badge,
}: {
  label: string
  onClick: () => void
  icon: React.ReactNode
  badge?: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group/btn relative h-10 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all duration-500 ease-in-out px-3 gap-2"
      aria-label={label}
    >
      <span className="shrink-0 relative">
        {icon}
        {badge !== undefined && (
          <span className="absolute -top-2 -right-2.5 w-4 h-4 rounded-full bg-gio-red text-white text-[9px] flex items-center justify-center">
            {badge}
          </span>
        )}
      </span>
      <span className="max-w-0 overflow-hidden group-hover/btn:max-w-[100px] transition-all duration-500 ease-in-out text-[12px] tracking-[-0.02em] text-white whitespace-nowrap opacity-0 group-hover/btn:opacity-100">
        {label}
      </span>
    </button>
  )
}

/* ── Icons ── */

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  )
}

function SupportIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function SamplesIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  )
}
