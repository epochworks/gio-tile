'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import ScrollReveal from '@/components/ScrollReveal'
import FilterTag from '@/components/collections/FilterTag'

/* ── Types ── */
interface TaxonomyItem {
  _id: string
  title: string
  slug: { current: string }
  hex?: string
}

interface TileStoneFilterProps {
  products: any[]
  looks: TaxonomyItem[]
  styles: TaxonomyItem[]
  colors: TaxonomyItem[]
  finishes: TaxonomyItem[]
  sizeTypes: TaxonomyItem[]
}

/* ── Constants ── */
const SURFACE_OPTIONS = ['Floor', 'Wall', 'Countertop', 'Outdoor']
const MATERIAL_OPTIONS = ['Porcelain', 'Ceramic', 'Glass', 'Natural Stone', 'Metal']

const FILTER_TABS = ['Look', 'Style', 'Material', 'Surface', 'Color', 'Finish', 'Size'] as const
type FilterTab = (typeof FILTER_TABS)[number]

const SORT_OPTIONS = [
  { label: 'A – Z', value: 'az' },
  { label: 'Z – A', value: 'za' },
]

/* ── Helpers ── */
function parseMulti(value: string | null): string[] {
  if (!value) return []
  return value.split(',').filter(Boolean)
}

function serializeMulti(arr: string[]): string | null {
  return arr.length > 0 ? arr.join(',') : null
}

/* ── Product Card ── */
function ProductCard({ product }: { product: any }) {
  // Collect unique sizes from all finishes
  const sizes: string[] = Array.from(
    (product.finishes || []).reduce((acc: Set<string>, f: any) => {
      (f?.skus || []).forEach((s: any) => { if (s?.size) acc.add(s.size) })
      return acc
    }, new Set<string>())
  ) as string[]

  // Build display name: "Collection Color" e.g. "Absolute Oyster"
  const displayName = product.colorName && product.colorName !== product.collectionTitle
    ? `${product.collectionTitle} ${product.colorName}`
    : product.collectionTitle || product.title

  return (
    <Link
      href={`/collections/${product.collectionSlug}#${product.slug?.current || ''}`}
      className="group block"
    >
      <article>
        {/* Image with hover overlay showing sizes */}
        <div className="relative bg-gio-grey overflow-hidden aspect-square mb-4">
          {product.imageUrl && (
            <Image
              src={product.imageUrl}
              alt={displayName}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          )}

          {/* Color swatch badge */}
          {product.colorFamily?.hex && (
            <span
              className="absolute top-3 right-3 w-5 h-5 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: product.colorFamily.hex }}
            />
          )}

          {/* Hover overlay — available sizes */}
          {sizes.length > 0 && (
            <div className="absolute inset-x-0 bottom-0 z-10 bg-gio-black/80 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] px-4 py-3">
              <p className="text-[11px] text-white/50 uppercase tracking-[0.05em] mb-1.5">
                Available Sizes
              </p>
              <div className="flex flex-wrap gap-1.5">
                {sizes.map((size) => (
                  <span
                    key={size}
                    className="text-[12px] text-white/90 bg-white/10 px-2 py-0.5 rounded"
                  >
                    {size}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Product name: "Collection Color" */}
        <h3 className="text-body text-gio-black tracking-[-0.02em] group-hover:text-gio-red transition-colors leading-tight">
          {displayName}
        </h3>

        {/* Collection name subtitle when different from display */}
        <p className="text-caption text-gio-black/40 tracking-[-0.02em] mt-0.5">
          {product.collectionTitle}
        </p>
      </article>
    </Link>
  )
}

/* ── Main Component ── */
export default function TileStoneFilter({
  products,
  looks,
  styles,
  colors,
  finishes,
  sizeTypes,
}: TileStoneFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Read filter state from URL
  const activeLook = searchParams.get('look')
  const activeStyle = searchParams.get('style')
  const activeMaterials = parseMulti(searchParams.get('material'))
  const activeSurfaces = parseMulti(searchParams.get('surface'))
  const activeColors = parseMulti(searchParams.get('color'))
  const activeFinishes = parseMulti(searchParams.get('finish'))
  const activeSizes = parseMulti(searchParams.get('size'))
  const searchQuery = searchParams.get('q') || ''
  const sort = searchParams.get('sort') || 'az'

  const [activeFilterTab, setActiveFilterTab] = useState<FilterTab | null>(null)
  const [searchOpen, setSearchOpen] = useState(searchQuery.length > 0)
  const [localSearch, setLocalSearch] = useState(searchQuery)

  // Sync local search with URL on mount
  useEffect(() => {
    setLocalSearch(searchQuery)
    if (searchQuery.length > 0) setSearchOpen(true)
  }, [searchQuery])

  // Debounced search update to URL
  useEffect(() => {
    const t = setTimeout(() => {
      if (localSearch !== searchQuery) {
        updateParams({ q: localSearch.length >= 2 ? localSearch : null })
      }
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearch])

  /* ── URL param helpers ── */
  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === '') {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      }
      const qs = params.toString()
      router.replace(qs ? `?${qs}` : '/tile-stone', { scroll: false })
    },
    [searchParams, router]
  )

  const toggleSingle = useCallback(
    (key: string, current: string | null, value: string) => {
      updateParams({ [key]: current === value ? null : value })
    },
    [updateParams]
  )

  const toggleMulti = useCallback(
    (key: string, current: string[], value: string) => {
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
      updateParams({ [key]: serializeMulti(next) })
    },
    [updateParams]
  )

  const clearAllFilters = useCallback(() => {
    setLocalSearch('')
    setSearchOpen(false)
    setActiveFilterTab(null)
    router.replace('/tile-stone', { scroll: false })
  }, [router])

  /* ── Active filters check ── */
  const hasActiveFilters =
    activeLook !== null ||
    activeStyle !== null ||
    activeMaterials.length > 0 ||
    activeSurfaces.length > 0 ||
    activeColors.length > 0 ||
    activeFinishes.length > 0 ||
    activeSizes.length > 0 ||
    searchQuery.length >= 2

  /* ── Filter logic: AND across facets, OR within a facet ── */
  const filtered = useMemo(() => {
    let result = [...products]

    // Look (single-select, by slug)
    if (activeLook) {
      result = result.filter((p) => p.lookSlug === activeLook)
    }

    // Style (single-select, by slug)
    if (activeStyle) {
      result = result.filter((p) => p.styleSlug === activeStyle)
    }

    // Material (multi-select)
    if (activeMaterials.length > 0) {
      result = result.filter((p) =>
        activeMaterials.some((m) =>
          (p.material || []).some((pm: string) => pm.toLowerCase() === m.toLowerCase())
        )
      )
    }

    // Surface (multi-select)
    if (activeSurfaces.length > 0) {
      result = result.filter((p) =>
        activeSurfaces.some((s) => (p.surfaces || []).includes(s))
      )
    }

    // Color (multi-select, by slug)
    if (activeColors.length > 0) {
      result = result.filter((p) => activeColors.includes(p.colorSlug))
    }

    // Finish (multi-select, by slug)
    if (activeFinishes.length > 0) {
      result = result.filter((p) =>
        activeFinishes.some((fs) => (p.finishSlugs || []).includes(fs))
      )
    }

    // Size/Format (multi-select, by slug)
    if (activeSizes.length > 0) {
      result = result.filter((p) =>
        activeSizes.some((ss) => (p.sizeTypeSlugs || []).includes(ss))
      )
    }

    // Search (match on collection name, color name, or technical summary)
    if (searchQuery.length >= 2) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          (p.collectionTitle || '').toLowerCase().includes(q) ||
          (p.colorName || '').toLowerCase().includes(q) ||
          (p.title || '').toLowerCase().includes(q) ||
          (p.technicalSummary || '').toLowerCase().includes(q)
      )
    }

    // Sort by collection name, then color name
    if (sort === 'za') {
      result.sort((a: any, b: any) => {
        const c = b.collectionTitle.localeCompare(a.collectionTitle)
        return c !== 0 ? c : (b.colorName || b.title).localeCompare(a.colorName || a.title)
      })
    } else {
      result.sort((a: any, b: any) => {
        const c = a.collectionTitle.localeCompare(b.collectionTitle)
        return c !== 0 ? c : (a.colorName || a.title).localeCompare(b.colorName || b.title)
      })
    }

    return result
  }, [products, activeLook, activeStyle, activeMaterials, activeSurfaces, activeColors, activeFinishes, activeSizes, searchQuery, sort])

  /* ── Filter options for the active tab ── */
  const filterOptions = useMemo(() => {
    switch (activeFilterTab) {
      case 'Look':
        return looks.map((l) => ({ slug: l.slug.current, label: l.title }))
      case 'Style':
        return styles.map((s) => ({ slug: s.slug.current, label: s.title }))
      case 'Material':
        return MATERIAL_OPTIONS.map((m) => ({ slug: m.toLowerCase(), label: m }))
      case 'Surface':
        return SURFACE_OPTIONS.map((s) => ({ slug: s, label: s }))
      case 'Color':
        return colors.map((c) => ({ slug: c.slug.current, label: c.title, hex: c.hex }))
      case 'Finish':
        return finishes.map((f) => ({ slug: f.slug.current, label: f.title }))
      case 'Size':
        return sizeTypes.map((s) => ({ slug: s.slug.current, label: s.title }))
      default:
        return []
    }
  }, [activeFilterTab, looks, styles, colors, finishes, sizeTypes])

  const isOptionSelected = useCallback(
    (slug: string): boolean => {
      switch (activeFilterTab) {
        case 'Look': return activeLook === slug
        case 'Style': return activeStyle === slug
        case 'Material': return activeMaterials.includes(slug)
        case 'Surface': return activeSurfaces.includes(slug)
        case 'Color': return activeColors.includes(slug)
        case 'Finish': return activeFinishes.includes(slug)
        case 'Size': return activeSizes.includes(slug)
        default: return false
      }
    },
    [activeFilterTab, activeLook, activeStyle, activeMaterials, activeSurfaces, activeColors, activeFinishes, activeSizes]
  )

  const handleOptionClick = useCallback(
    (slug: string) => {
      switch (activeFilterTab) {
        case 'Look': toggleSingle('look', activeLook, slug); break
        case 'Style': toggleSingle('style', activeStyle, slug); break
        case 'Material': toggleMulti('material', activeMaterials, slug); break
        case 'Surface': toggleMulti('surface', activeSurfaces, slug); break
        case 'Color': toggleMulti('color', activeColors, slug); break
        case 'Finish': toggleMulti('finish', activeFinishes, slug); break
        case 'Size': toggleMulti('size', activeSizes, slug); break
      }
    },
    [activeFilterTab, activeLook, activeStyle, activeMaterials, activeSurfaces, activeColors, activeFinishes, activeSizes, toggleSingle, toggleMulti]
  )

  /* ── Active filter tags for display ── */
  const activeFilterTags = useMemo(() => {
    const tags: { key: string; label: string; onRemove: () => void }[] = []

    if (activeLook) {
      const look = looks.find((l) => l.slug.current === activeLook)
      tags.push({
        key: 'look',
        label: look?.title || activeLook,
        onRemove: () => updateParams({ look: null }),
      })
    }
    if (activeStyle) {
      const style = styles.find((s) => s.slug.current === activeStyle)
      tags.push({
        key: 'style',
        label: style?.title || activeStyle,
        onRemove: () => updateParams({ style: null }),
      })
    }
    for (const m of activeMaterials) {
      tags.push({
        key: `material-${m}`,
        label: MATERIAL_OPTIONS.find((mo) => mo.toLowerCase() === m) || m,
        onRemove: () => toggleMulti('material', activeMaterials, m),
      })
    }
    for (const s of activeSurfaces) {
      tags.push({
        key: `surface-${s}`,
        label: s,
        onRemove: () => toggleMulti('surface', activeSurfaces, s),
      })
    }
    for (const c of activeColors) {
      const color = colors.find((cl) => cl.slug.current === c)
      tags.push({
        key: `color-${c}`,
        label: color?.title || c,
        onRemove: () => toggleMulti('color', activeColors, c),
      })
    }
    for (const f of activeFinishes) {
      const finish = finishes.find((fi) => fi.slug.current === f)
      tags.push({
        key: `finish-${f}`,
        label: finish?.title || f,
        onRemove: () => toggleMulti('finish', activeFinishes, f),
      })
    }
    for (const s of activeSizes) {
      const sizeType = sizeTypes.find((st) => st.slug.current === s)
      tags.push({
        key: `size-${s}`,
        label: sizeType?.title || s,
        onRemove: () => toggleMulti('size', activeSizes, s),
      })
    }
    if (searchQuery.length >= 2) {
      tags.push({
        key: 'search',
        label: `"${searchQuery}"`,
        onRemove: () => {
          setLocalSearch('')
          setSearchOpen(false)
          updateParams({ q: null })
        },
      })
    }

    return tags
  }, [activeLook, activeStyle, activeMaterials, activeSurfaces, activeColors, activeFinishes, activeSizes, searchQuery, looks, styles, colors, finishes, sizeTypes, updateParams, toggleMulti])

  /* ── Tab has active filters indicator ── */
  const tabHasValue = useCallback(
    (tab: FilterTab): boolean => {
      switch (tab) {
        case 'Look': return activeLook !== null
        case 'Style': return activeStyle !== null
        case 'Material': return activeMaterials.length > 0
        case 'Surface': return activeSurfaces.length > 0
        case 'Color': return activeColors.length > 0
        case 'Finish': return activeFinishes.length > 0
        case 'Size': return activeSizes.length > 0
        default: return false
      }
    },
    [activeLook, activeStyle, activeMaterials, activeSurfaces, activeColors, activeFinishes, activeSizes]
  )

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
                const hasValue = tabHasValue(tab)

                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveFilterTab((prev) => (prev === tab ? null : tab))}
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
                aria-label={searchOpen ? undefined : 'Search products'}
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
                      value={localSearch}
                      onChange={(e) => setLocalSearch(e.target.value)}
                      placeholder="Search tile & stone..."
                      autoFocus
                      className="bg-transparent text-[14px] text-gio-black tracking-[-0.02em] w-full outline-none placeholder:text-gio-black/40 min-w-0"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSearchOpen(false)
                        setLocalSearch('')
                        updateParams({ q: null })
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
                    onClick={() => updateParams({ sort: opt.value === 'az' ? null : opt.value })}
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
                const selected = isOptionSelected(option.slug)

                return (
                  <button
                    key={option.slug}
                    type="button"
                    onClick={() => handleOptionClick(option.slug)}
                    className={`toggle-btn ${
                      selected ? 'toggle-btn-active' : 'toggle-btn-inactive'
                    } ${activeFilterTab === 'Color' ? 'inline-flex items-center gap-2' : ''}`}
                  >
                    {/* Color swatch */}
                    {activeFilterTab === 'Color' && (option as any).hex && (
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/10 flex-shrink-0"
                        style={{ backgroundColor: (option as any).hex }}
                      />
                    )}
                    {option.label}
                  </button>
                )
              })}
            </div>
          )}

          {/* Active filters summary */}
          <div className="flex flex-wrap items-center gap-2 text-small text-gio-black/30">
            <span>
              {filtered.length} product{filtered.length !== 1 ? 's' : ''}
            </span>

            {activeFilterTags.map((tag) => (
              <FilterTag key={tag.key} label={tag.label} onRemove={tag.onRemove} />
            ))}

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

      {/* Product grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-5 gap-y-10">
        {filtered.map((product: any, i: number) => (
          <ScrollReveal key={product._id} delay={Math.min(i, 10) * 40}>
            <ProductCard product={product} />
          </ScrollReveal>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <ScrollReveal>
          <div className="py-24 text-center max-w-md mx-auto">
            <h3 className="text-title text-gio-black/60 mb-3">No products found</h3>
            <p className="text-caption text-gio-black/30 mb-6 leading-relaxed">
              Try adjusting your filters or search terms to discover more
              products.
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
