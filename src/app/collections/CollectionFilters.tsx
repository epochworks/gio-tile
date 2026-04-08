'use client'

import { useState, useMemo } from 'react'
import ScrollReveal from '@/components/ScrollReveal'
import CollectionCard from '@/components/collections/CollectionCard'
import FeaturedCard from '@/components/collections/FeaturedCard'
import FilterTag from '@/components/collections/FilterTag'

interface CollectionGridProps {
  collections: any[]
  looks: string[]
  styles: string[]
}

const SURFACE_OPTIONS = ['Floor', 'Wall', 'Countertop', 'Outdoor']
const FILTER_TABS = ['Surface', 'Look', 'Style'] as const
type FilterTab = (typeof FILTER_TABS)[number]

const SORT_OPTIONS = [
  { label: 'A – Z', value: 'az' },
  { label: 'Z – A', value: 'za' },
]

export default function CollectionGrid({
  collections,
  looks,
  styles,
}: CollectionGridProps) {
  const [activeSurfaces, setActiveSurfaces] = useState<string[]>([])
  const [activeLook, setActiveLook] = useState<string | null>(null)
  const [activeStyle, setActiveStyle] = useState<string | null>(null)
  const [activeFilterTab, setActiveFilterTab] = useState<FilterTab | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [sort, setSort] = useState('az')

  const hasActiveFilters =
    activeSurfaces.length > 0 || activeLook !== null || activeStyle !== null || searchQuery.length >= 2

  // Separate featured collections from the rest
  const featuredCollections = useMemo(
    () => collections.filter((c) => c.featured),
    [collections]
  )

  const toggleSurface = (surface: string) => {
    setActiveSurfaces((prev) =>
      prev.includes(surface)
        ? prev.filter((s) => s !== surface)
        : [...prev, surface]
    )
  }

  const clearAllFilters = () => {
    setActiveSurfaces([])
    setActiveLook(null)
    setActiveStyle(null)
    setSearchQuery('')
    setActiveFilterTab(null)
  }

  const filtered = useMemo(() => {
    let result = [...collections]

    // Filter by surface
    if (activeSurfaces.length > 0) {
      result = result.filter((c) =>
        activeSurfaces.some((s) => (c.surfaces || []).includes(s))
      )
    }

    // Filter by look
    if (activeLook) {
      result = result.filter((c) => c.look?.title === activeLook)
    }

    // Filter by style
    if (activeStyle) {
      result = result.filter((c) => c.style?.title === activeStyle)
    }

    // Filter by search
    if (searchQuery.length >= 2) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          (c.technicalSummary || '').toLowerCase().includes(q)
      )
    }

    // Sort
    if (sort === 'za') {
      result.sort((a, b) => b.title.localeCompare(a.title))
    } else {
      result.sort((a, b) => a.title.localeCompare(b.title))
    }

    return result
  }, [collections, activeSurfaces, activeLook, activeStyle, searchQuery, sort])

  // Non-featured items for the standard grid
  const standardItems = useMemo(() => {
    if (hasActiveFilters) return filtered
    const featuredIds = new Set(featuredCollections.map((c) => c._id))
    return filtered.filter((c) => !featuredIds.has(c._id))
  }, [filtered, featuredCollections, hasActiveFilters])

  const handleTabClick = (tab: FilterTab) => {
    setActiveFilterTab((prev) => (prev === tab ? null : tab))
  }

  // Determine which filter options to show
  const filterOptions =
    activeFilterTab === 'Surface'
      ? SURFACE_OPTIONS
      : activeFilterTab === 'Look'
        ? looks
        : activeFilterTab === 'Style'
          ? styles
          : []

  return (
    <>
      {/* Filter bar */}
      <ScrollReveal delay={100}>
        <div className="mb-10">
          {/* Row 1: Tabs + Search + Sort */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
            {/* Filter tabs */}
            <div className="flex items-center gap-1 overflow-x-auto">
              {FILTER_TABS.map((tab) => {
                const isActive = activeFilterTab === tab
                const hasValue =
                  (tab === 'Surface' && activeSurfaces.length > 0) ||
                  (tab === 'Look' && activeLook) ||
                  (tab === 'Style' && activeStyle)

                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => handleTabClick(tab)}
                    className={`relative px-4 py-2.5 text-[14px] tracking-[-0.02em] transition-all duration-300 whitespace-nowrap ${
                      isActive
                        ? 'text-gio-black'
                        : hasValue
                          ? 'text-gio-black/70'
                          : 'text-gio-black/35 hover:text-gio-black/55'
                    }`}
                  >
                    {tab}
                    {isActive && (
                      <span className="absolute bottom-0 left-4 right-4 h-px bg-gio-black" />
                    )}
                    {hasValue && !isActive && (
                      <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-gio-red" />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Search — animated expand from icon to pill */}
            <div className="flex items-center gap-3 sm:ml-auto">
              <div
                className="flex items-center gap-3 rounded-full overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer"
                style={{
                  width: searchOpen ? 280 : 40,
                  backgroundColor: searchOpen ? '#F5F5F5' : 'transparent',
                  padding: searchOpen ? '10px 20px' : '10px',
                }}
                onClick={() => !searchOpen && setSearchOpen(true)}
                role={searchOpen ? undefined : 'button'}
                aria-label={searchOpen ? undefined : 'Search collections'}
              >
                <svg
                  className={`flex-shrink-0 transition-colors duration-300 ${searchOpen ? 'text-gio-black' : 'text-gio-black/30 hover:text-gio-black/60'}`}
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                {searchOpen && (
                  <>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search collections..."
                      autoFocus
                      className="bg-transparent text-[14px] text-gio-black tracking-[-0.02em] w-full outline-none placeholder:text-gio-black/40 min-w-0"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSearchOpen(false)
                        setSearchQuery('')
                      }}
                      className="text-gio-black/25 hover:text-gio-black/50 transition-colors flex-shrink-0"
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M1 1l8 8M9 1l-8 8" />
                      </svg>
                    </button>
                  </>
                )}
              </div>

              {/* Sort */}
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] text-gio-black/30 tracking-[-0.02em]">
                  Sort
                </span>
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSort(opt.value)}
                    className={`px-2.5 py-2 text-[13px] tracking-[-0.02em] transition-colors ${
                      sort === opt.value
                        ? 'text-gio-black'
                        : 'text-gio-black/25 hover:text-gio-black/50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: Filter options (conditional) */}
          {activeFilterTab && filterOptions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pb-4">
              {filterOptions.map((option) => {
                const isSelected =
                  activeFilterTab === 'Surface'
                    ? activeSurfaces.includes(option)
                    : activeFilterTab === 'Look'
                      ? activeLook === option
                      : activeStyle === option

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      if (activeFilterTab === 'Surface') {
                        toggleSurface(option)
                      } else if (activeFilterTab === 'Look') {
                        setActiveLook((prev) => (prev === option ? null : option))
                      } else if (activeFilterTab === 'Style') {
                        setActiveStyle((prev) => (prev === option ? null : option))
                      }
                    }}
                    className={`toggle-btn ${
                      isSelected ? 'toggle-btn-active' : 'toggle-btn-inactive'
                    }`}
                  >
                    {option}
                  </button>
                )
              })}
            </div>
          )}

          {/* Active filters summary */}
          <div className="flex flex-wrap items-center gap-2 text-small text-gio-black/30">
            <span>
              {filtered.length} collection{filtered.length !== 1 ? 's' : ''}
            </span>

            {activeSurfaces.map((s) => (
              <FilterTag key={`s-${s}`} label={s} onRemove={() => toggleSurface(s)} />
            ))}
            {activeLook && (
              <FilterTag label={activeLook} onRemove={() => setActiveLook(null)} />
            )}
            {activeStyle && (
              <FilterTag label={activeStyle} onRemove={() => setActiveStyle(null)} />
            )}
            {searchQuery.length >= 2 && (
              <FilterTag label={`"${searchQuery}"`} onRemove={() => setSearchQuery('')} />
            )}

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-gio-red hover:text-gio-red/70 transition-colors ml-1"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      </ScrollReveal>

      {/* Featured collections (default view only, when no filters active) */}
      {!hasActiveFilters && featuredCollections.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-10">
          {featuredCollections.slice(0, 4).map((collection: any, i: number) => (
            <ScrollReveal key={collection._id} delay={i * 80}>
              <FeaturedCard collection={collection} />
            </ScrollReveal>
          ))}
        </div>
      )}

      {/* Standard grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-10">
        {standardItems.map((collection: any, i: number) => (
          <ScrollReveal key={collection._id} delay={Math.min(i, 8) * 60}>
            <CollectionCard collection={collection} />
          </ScrollReveal>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <ScrollReveal>
          <div className="py-24 text-center max-w-md mx-auto">
            <h3 className="text-title text-gio-black/60 mb-3">No results found</h3>
            <p className="text-caption text-gio-black/30 mb-6 leading-relaxed">
              Try adjusting your filters or search terms to discover more
              collections.
            </p>
            <button
              type="button"
              onClick={clearAllFilters}
              className="btn-outline text-caption"
            >
              Clear all filters
            </button>
          </div>
        </ScrollReveal>
      )}
    </>
  )
}

