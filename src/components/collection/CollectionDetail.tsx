'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import SizeIcon, { computeScale } from './SizeIcon'
import SpecTables from './SpecTables'
import { urlFor } from '@/lib/sanity'

import { useSampleCart, type SampleItem } from '@/context/SampleCartContext'

interface CollectionDetailProps {
  collection: any
  relatedCollections?: any[]
}

interface SizeSku {
  size: string
  sku: string
  finish: string
}

interface GroupedColor {
  colorName: string
  colorFamily: { title: string; hex: string } | null
  sizes: string[]
  skus: string[]
  sizeSkus: SizeSku[]
  finishes: string[]
  productIds: string[]
  image: any | null
}

function groupProductsByColor(products: any[]): GroupedColor[] {
  const map = new Map<string, GroupedColor>()

  for (const product of products) {
    if (!product) continue
    const name = product.colorName || product.title || 'Unknown'

    if (!map.has(name)) {
      map.set(name, {
        colorName: name,
        colorFamily: product.colorFamily || null,
        sizes: [],
        skus: [],
        sizeSkus: [],
        finishes: [],
        productIds: [],
        image: product.images?.[0] || null,
      })
    }

    const group = map.get(name)!
    group.productIds.push(product._id)

    // If this product has an image and existing group doesn't, use it
    if (!group.image && product.images?.[0]) {
      group.image = product.images[0]
    }

    for (const finish of product.finishes || []) {
      const finishName = finish.type?.title || ''
      if (finishName && !group.finishes.includes(finishName)) {
        group.finishes.push(finishName)
      }
      for (const sku of finish.skus || []) {
        if (sku.size && !group.sizes.includes(sku.size)) {
          group.sizes.push(sku.size)
        }
        if (sku.code && !group.skus.includes(sku.code)) {
          group.skus.push(sku.code)
        }
        // Collect paired size+sku+finish
        if (sku.size && sku.code) {
          const alreadyPaired = group.sizeSkus.some(
            (ss) => ss.size === sku.size && ss.sku === sku.code && ss.finish === finishName
          )
          if (!alreadyPaired) {
            group.sizeSkus.push({ size: sku.size, sku: sku.code, finish: finishName })
          }
        }
      }
    }
  }

  return Array.from(map.values())
}

export default function CollectionDetail({ collection, relatedCollections = [] }: CollectionDetailProps) {
  const products = collection.products || []
  const heroImage = collection.heroImages?.[0]
  const surfaces = collection.surfaces || []
  const applications = collection.applications || []
  const techSpecs = collection.technicalSpecs || []
  const packagingData = collection.packagingData || []

  const groupedColors = useMemo(() => groupProductsByColor(products), [products])

  const allSizes = useMemo(() => {
    const sizeSet = new Set<string>()
    groupedColors.forEach((g) => g.sizes.forEach((s) => sizeSet.add(s)))
    return Array.from(sizeSet)
  }, [groupedColors])

  const sizeIconOverrideMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const override of collection.sizeIconOverrides || []) {
      if (override.size && override.icon?.asset?.url) {
        map.set(override.size, override.icon.asset.url)
      }
    }
    return map
  }, [collection.sizeIconOverrides])

  const allFinishes = useMemo(() => {
    const finishSet = new Set<string>()
    groupedColors.forEach((g) => g.finishes.forEach((f) => finishSet.add(f)))
    return Array.from(finishSet)
  }, [groupedColors])

  const [activeColorIdx, setActiveColorIdx] = useState<number | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxSlideIdx, setLightboxSlideIdx] = useState(0)

  // Track column count to chunk cards into rows (matches grid-cols-2 sm:grid-cols-3 lg:grid-cols-4)
  const [colCount, setColCount] = useState(4)
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth
      if (w >= 1024) setColCount(4)
      else if (w >= 640) setColCount(3)
      else setColCount(2)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  const { items: cartItems, addItem, removeItem, isFull, count } = useSampleCart()
  const router = useRouter()

  const handleAddSample = (group: GroupedColor, size: string, sku: string) => {
    addItem({
      productId: group.productIds[0],
      collectionTitle: collection.title,
      colorName: group.colorName,
      size,
      sku,
    })
  }

  // Whether we're showing a product image or the collection hero
  const isProductImage = activeColorIdx !== null && !!groupedColors[activeColorIdx]?.image

  // Determine which image to show — active color's image or hero
  const activeImage = useMemo(() => {
    if (activeColorIdx !== null && groupedColors[activeColorIdx]?.image) {
      return groupedColors[activeColorIdx].image
    }
    return heroImage
  }, [activeColorIdx, groupedColors, heroImage])

  const imageUrl = useMemo(() => (activeImage ? urlFor(activeImage).url() : null), [activeImage])

  // Build lightbox slides: hero first, then all color images
  const lightboxSlides = useMemo(() => {
    const slides: { label: string; image: any; isHero: boolean }[] = []
    if (heroImage) {
      slides.push({ label: collection.title, image: heroImage, isHero: true })
    }
    groupedColors.forEach((g) => {
      if (g.image) {
        slides.push({ label: g.colorName, image: g.image, isHero: false })
      }
    })
    return slides
  }, [heroImage, groupedColors, collection.title])

  // Lightbox navigation
  const lightboxPrev = useCallback(() => {
    if (lightboxSlides.length === 0) return
    setLightboxSlideIdx((prev) => (prev === 0 ? lightboxSlides.length - 1 : prev - 1))
  }, [lightboxSlides.length])

  const lightboxNext = useCallback(() => {
    if (lightboxSlides.length === 0) return
    setLightboxSlideIdx((prev) => (prev === lightboxSlides.length - 1 ? 0 : prev + 1))
  }, [lightboxSlides.length])

  const closeLightbox = useCallback(() => setLightboxOpen(false), [])

  // ESC key to close lightbox
  useEffect(() => {
    if (!lightboxOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowLeft') lightboxPrev()
      if (e.key === 'ArrowRight') lightboxNext()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [lightboxOpen, closeLightbox, lightboxPrev, lightboxNext])

  const openLightbox = () => {
    // Determine which slide to start on
    if (activeColorIdx !== null) {
      // Find the slide index for this color (hero is index 0, colors start at 1 if hero exists)
      const offset = heroImage ? 1 : 0
      setLightboxSlideIdx(activeColorIdx + offset)
    } else {
      // Start on the hero image (index 0)
      setLightboxSlideIdx(0)
    }
    setLightboxOpen(true)
  }

  // Current lightbox slide
  const currentSlide = lightboxSlides[lightboxSlideIdx] || null
  const lightboxImageUrl = currentSlide ? urlFor(currentSlide.image).url() : null

  return (
    <div className="w-full">
      {/* Mobile hero image */}
      <div className="lg:hidden w-full aspect-[16/10] relative bg-gio-grey">
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={`${collection.title} — room scene`}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        )}
      </div>

      {/* Main layout: content left, sticky image right */}
      <div className="max-w-container mx-auto px-container">
        <div className="flex flex-col lg:flex-row lg:gap-[6.25%]">
          {/* Left: Content */}
          <div className="w-full lg:w-1/2">
            <div className="max-w-[620px] pt-10 lg:pt-16 pb-20 lg:pb-24">
              {/* Breadcrumbs */}
              <nav aria-label="Breadcrumb" className="mb-16">
                <ol className="flex items-center gap-2.5 text-small tracking-wide text-gio-black/40">
                  <li>
                    <Link
                      href="/collections"
                      className="hover:text-gio-black transition-colors"
                    >
                      Collections
                    </Link>
                  </li>
                  <li aria-hidden="true" className="text-gio-black/20">
                    »
                  </li>
                  <li className="text-gio-black/70">{collection.title}</li>
                </ol>
              </nav>

              {/* Title */}
              <h1 className="heading-page mb-2">
                {collection.title}
              </h1>

              {/* Colors, sizes & finishes count */}
              <div className="flex items-center gap-2 text-[14px] text-gio-black/40 mb-6">
                {groupedColors.length > 0 && (
                  <span>{groupedColors.length} {groupedColors.length === 1 ? 'Color' : 'Colors'}</span>
                )}
                {allSizes.length > 0 && (
                  <span>{allSizes.length} {allSizes.length === 1 ? 'Size' : 'Sizes'}</span>
                )}
                {allFinishes.length > 0 && (
                  <span>{allFinishes.length} {allFinishes.length === 1 ? 'Finish' : 'Finishes'}</span>
                )}
              </div>

              {/* Quick-glance pill tags */}
              <div className="flex flex-wrap gap-1 mb-6">
                {surfaces.map((s: string) => (
                  <span key={s} className="px-3 py-1.5 bg-[#f2f2f2] rounded-full text-[12px] text-gio-black tracking-wide">
                    {s}
                  </span>
                ))}
                {collection.look?.title && (
                  <span className="px-3 py-1.5 bg-[#f2f2f2] rounded-full text-[12px] text-gio-black tracking-wide">
                    {collection.look.title}
                  </span>
                )}
                {collection.style?.title && (
                  <span className="px-3 py-1.5 bg-[#f2f2f2] rounded-full text-[12px] text-gio-black tracking-wide">
                    {collection.style.title}
                  </span>
                )}
              </div>

              {/* Divider */}
              <div className="w-full h-px bg-gio-black/10 mb-10" />

              {/* Technical Summary */}
              {collection.technicalSummary && (
                <p className="text-body-lg text-gio-black mb-5">
                  {collection.technicalSummary}
                </p>
              )}

              {/* Description */}
              {collection.description && (
                <p className="text-body-lg mb-8">
                  {collection.description}
                </p>
              )}

              {/* ── CTAs (high up for visibility) ── */}
              <div className="flex flex-wrap gap-3 items-center mb-20">
                <button
                  onClick={() => router.push('/samples')}
                  className="rounded-full border border-gio-red bg-gio-red text-white text-[13px] font-semibold tracking-[-0.02em] px-8 py-3.5 hover:bg-gio-black hover:border-gio-black transition-colors"
                >
                  Request Samples{count > 0 && ` (${count})`}
                </button>
                {collection.specSheet?.asset?.url && (
                  <a
                    href={collection.specSheet.asset.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-gio-black/20 text-[13px] font-semibold text-gio-black px-8 py-3.5 hover:bg-gio-black hover:border-gio-black hover:text-white transition-colors inline-block"
                  >
                    Download Brochure
                  </a>
                )}
              </div>

              {/* ── Available Colors (Deduplicated) ── */}
              {groupedColors.length > 0 && (() => {
                // Chunk cards into rows based on current column count
                const rows: GroupedColor[][] = []
                for (let i = 0; i < groupedColors.length; i += colCount) {
                  rows.push(groupedColors.slice(i, i + colCount))
                }
                const activeRow = activeColorIdx !== null ? Math.floor(activeColorIdx / colCount) : -1
                const activeGroup = activeColorIdx !== null ? groupedColors[activeColorIdx] : null

                return (
                  <div className="mb-20">
                    <SectionLabel>Available Colors</SectionLabel>
                    <div className="flex flex-col gap-3 mt-8">
                      {rows.map((row, rowIdx) => (
                        <div key={rowIdx}>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {row.map((group, colIdx) => {
                              const globalIdx = rowIdx * colCount + colIdx
                              const isActive = activeColorIdx === globalIdx
                              const thumbUrl = group.image ? urlFor(group.image).width(400).height(400).fit('crop').url() : null

                              return (
                                <ColorCard
                                  key={group.colorName}
                                  group={group}
                                  isActive={isActive}
                                  thumbUrl={thumbUrl}
                                  collectionTitle={collection.title}
                                  onToggle={() => setActiveColorIdx(isActive ? null : globalIdx)}
                                />
                              )
                            })}
                          </div>

                          {/* Expansion panel — attached below the row containing the active card */}
                          {activeRow === rowIdx && activeGroup && (
                            <SizeExpansionPanel
                              group={activeGroup}
                              onAddSample={handleAddSample}
                              onRemoveSample={removeItem}
                              cartItems={cartItems}
                              isFull={isFull}
                              sizeIconOverrideMap={sizeIconOverrideMap}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}

              {/* ── Available Sizes with Icons ── */}
              {allSizes.length > 0 && (() => {
                const sizeScale = computeScale(allSizes)
                return (
                  <div className="mb-20">
                    <SectionLabel>Available Sizes</SectionLabel>
                    <div className="flex flex-wrap gap-5 mt-8 items-end">
                      {allSizes.map((size) => (
                        <SizeIcon key={size} size={size} scale={sizeScale} customIconUrl={sizeIconOverrideMap.get(size)} />
                      ))}
                    </div>
                  </div>
                )
              })()}

              {/* ── Finish & Thickness ── */}
              {(allFinishes.length > 0 || collection.thickness) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-12 mb-20">
                  {allFinishes.length > 0 && (
                    <div>
                      <SectionLabel>Available Finishes</SectionLabel>
                      <div className="flex flex-wrap gap-5 mt-8 items-end">
                        {allFinishes.map((finish) => (
                          <div key={finish} className="flex flex-col items-center gap-2.5">
                            <FinishIcon finish={finish} />
                            <span className="text-[13px] tracking-[-0.02em] text-gio-black">{finish}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {collection.thickness && (
                    <div>
                      <SectionLabel>Thickness</SectionLabel>
                      <div className="flex flex-wrap gap-5 mt-8 items-end">
                        <div className="flex flex-col items-center gap-2.5">
                          <ThicknessIcon />
                          <span className="text-[13px] tracking-[-0.02em] text-gio-black">{collection.thickness}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Spec Tables ── */}
              <SpecTables
                techSpecs={techSpecs}
                packagingData={packagingData}
                applications={applications}
                surfaces={surfaces}
                products={products}
              />

              {/* ── Downloads & Bottom CTA ── */}
              <div className="mb-20">
                <SectionLabel>Downloads</SectionLabel>
                <div className="flex flex-wrap gap-3 mt-8">
                  {collection.specSheet?.asset?.url && (
                    <a
                      href={collection.specSheet.asset.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border border-gio-black/20 text-[13px] font-semibold tracking-[-0.02em] text-gio-black px-7 py-3.5 hover:bg-gio-black hover:border-gio-black hover:text-white transition-colors inline-flex items-center gap-2.5"
                    >
                      <PdfIcon />
                      Spec Sheet
                    </a>
                  )}
                  {collection.dropboxUrl && (
                    <a
                      href={collection.dropboxUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border border-gio-black/20 text-[13px] font-semibold tracking-[-0.02em] text-gio-black px-7 py-3.5 hover:bg-gio-black hover:border-gio-black hover:text-white transition-colors inline-flex items-center gap-2.5"
                    >
                      <FolderIcon />
                      Product Images
                    </a>
                  )}
                </div>
              </div>

              {/* ── Bottom CTA repeat ── */}
              <div className="flex flex-wrap gap-3 items-center mt-8">
                <button
                  onClick={() => router.push('/samples')}
                  className="rounded-full border border-gio-red bg-gio-red text-white text-[13px] font-semibold tracking-[-0.02em] px-8 py-3.5 hover:bg-gio-black hover:border-gio-black transition-colors"
                >
                  Request Samples{count > 0 && ` (${count})`}
                </button>
              </div>
            </div>
          </div>

          {/* Right: Sticky Image — 7/16 cols ≈ 43.75% */}
          <div className="hidden lg:block lg:w-[43.75%]">
            <div className="sticky top-[122px] h-[calc(100vh-154px)] mt-8">
              <div
                className="relative w-full h-full bg-[#f5f5f5] cursor-pointer"
                onClick={openLightbox}
              >
                {imageUrl && (
                  <Image
                    key={imageUrl}
                    src={imageUrl}
                    alt={
                      activeColorIdx !== null
                        ? `${collection.title} — ${groupedColors[activeColorIdx]?.colorName}`
                        : `${collection.title} — installed room scene`
                    }
                    fill
                    sizes="44vw"
                    className={`${isProductImage ? 'object-contain' : 'object-cover'} object-center animate-fade-in`}
                    priority
                  />
                )}
                {/* Expand hint */}
                <div className="absolute bottom-4 right-4 w-8 h-8 bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <ExpandIcon />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Related Collections ── */}
      {relatedCollections.length > 0 && (
        <div className="border-t border-gio-black/10">
          <div className="max-w-container mx-auto px-container py-16 md:py-20">
            <h2 className="heading-section mb-10">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedCollections.slice(0, 4).map((rc: any) => {
                const rcHeroUrl = rc.heroImages?.[0] ? urlFor(rc.heroImages[0]).width(600).height(600).fit('crop').url() : null
                return (
                  <Link
                    key={rc._id}
                    href={`/collections/${rc.slug?.current}`}
                    className="group"
                  >
                    <div className="relative aspect-[4/3] bg-gio-grey overflow-hidden mb-3">
                      {rcHeroUrl && (
                        <Image
                          src={rcHeroUrl}
                          alt={rc.title}
                          fill
                          sizes="(min-width: 768px) 25vw, 50vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      )}
                    </div>
                    <p className="text-[14px] font-medium text-gio-black group-hover:text-gio-red transition-colors">
                      {rc.title}
                    </p>
                    {rc.technicalSummary && (
                      <p className="text-[12px] text-gio-black/40 mt-1 line-clamp-1">
                        {rc.technicalSummary}
                      </p>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Lightbox ── */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay — clickable to close */}
          <div className="absolute inset-0 bg-black/90 cursor-pointer" onClick={closeLightbox} />

          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-6 right-6 z-10 w-10 h-10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
            aria-label="Close lightbox"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Image — native img so it only covers the visible area */}
          {lightboxImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={lightboxImageUrl}
              src={lightboxImageUrl}
              alt={currentSlide?.label || collection.title}
              className="max-w-[85vw] max-h-[80vh] w-auto h-auto object-contain animate-fade-in z-10"
            />
          )}

          {/* Bottom bar: arrows + slide label */}
          {lightboxSlides.length > 1 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 z-10">
              {/* Prev */}
              <button
                onClick={lightboxPrev}
                className="w-10 h-10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                aria-label="Previous color"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="12 15 7 10 12 5" />
                </svg>
              </button>

              {/* Slide label + counter */}
              <span className="text-white text-[14px] tracking-wide min-w-[120px] text-center">
                {currentSlide?.label || collection.title}
                <span className="text-white/40 ml-2 text-[12px]">
                  {lightboxSlideIdx + 1} / {lightboxSlides.length}
                </span>
              </span>

              {/* Next */}
              <button
                onClick={lightboxNext}
                className="w-10 h-10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                aria-label="Next color"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="8 5 13 10 8 15" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  )
}

/* ── Color Card ── */

function ColorCard({
  group,
  isActive,
  thumbUrl,
  collectionTitle,
  onToggle,
}: {
  group: GroupedColor
  isActive: boolean
  thumbUrl: string | null
  collectionTitle: string
  onToggle: () => void
}) {
  return (
    <div
      className="group relative cursor-pointer overflow-hidden transition-all duration-200"
      onClick={onToggle}
    >
      {/* Color name bar */}
      <div className={`relative z-10 px-4 py-3 transition-colors duration-200 ${isActive ? 'bg-gio-black' : 'bg-[#f2f2f2] group-hover:bg-gio-black'}`}>
        <p className={`text-[14px] font-normal tracking-[-0.01em] leading-tight transition-colors duration-200 ${isActive ? 'text-white' : 'text-gio-black group-hover:text-white'}`}>
          {group.colorName}
        </p>
      </div>

      {/* Product image or fallback swatch */}
      <div className="relative w-full aspect-square bg-gio-grey overflow-hidden">
        {thumbUrl ? (
          <Image
            src={thumbUrl}
            alt={`${collectionTitle} — ${group.colorName}`}
            fill
            sizes="(min-width: 640px) 33vw, 50vw"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gio-black/5">
            {group.colorFamily?.hex ? (
              <span
                className="w-16 h-16 rounded-full border border-gio-black/10"
                style={{ backgroundColor: group.colorFamily.hex }}
              />
            ) : (
              <span className="w-16 h-16 rounded-full bg-gio-black/8 border border-gio-black/5" />
            )}
          </div>
        )}

        {/* + Sample hover button — opens expansion */}
        <div className="absolute inset-0 flex items-end justify-center pb-[8px] transition-opacity duration-200 opacity-0 group-hover:opacity-100">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              if (!isActive) onToggle()
            }}
            className="px-6 py-3 rounded-full text-[14px] font-medium bg-white text-gio-black shadow-lg hover:bg-gio-red hover:text-white transition-colors duration-200"
          >
            + Sample
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Size Expansion Panel ── */

function SizeExpansionPanel({
  group,
  onAddSample,
  onRemoveSample,
  cartItems,
  isFull,
  sizeIconOverrideMap,
}: {
  group: GroupedColor
  onAddSample: (group: GroupedColor, size: string, sku: string) => void
  onRemoveSample: (productId: string, size: string) => void
  cartItems: SampleItem[]
  isFull: boolean
  sizeIconOverrideMap: Map<string, string>
}) {
  const isInCart = (sku: string, size: string) =>
    cartItems.some((ci) => ci.sku === sku && ci.size === size)

  const rawItems = group.sizeSkus.length > 0
    ? group.sizeSkus
    : group.sizes.map((size, idx) => ({ size, sku: group.skus[idx] || '', finish: '' }))

  // Sort by size then finish
  const skuItems = [...rawItems].sort((a, b) => {
    if (a.size !== b.size) return a.size.localeCompare(b.size)
    return a.finish.localeCompare(b.finish)
  })

  const productId = group.productIds[0]

  return (
    <div className="bg-[#f5f5f5] px-4 sm:px-6 py-6 mt-3">
      {/* ── Desktop: full grid ── */}
      <div className="hidden sm:grid items-center gap-y-0" style={{ gridTemplateColumns: `60px 1fr 1fr 1fr auto` }}>
        <span className="text-[14px] font-medium tracking-[-0.02em] text-gio-black pb-4 border-b border-gio-black/15 col-span-2">
          Sizes for {group.colorName}
        </span>
        <span className="text-[14px] font-medium tracking-[-0.02em] text-gio-black pb-4 border-b border-gio-black/15">Finish</span>
        <span className="text-[14px] font-medium tracking-[-0.02em] text-gio-black pb-4 border-b border-gio-black/15">SKU</span>
        <span className="text-[14px] font-medium tracking-[-0.02em] text-gio-black pb-4 border-b border-gio-black/15">Order</span>

        {skuItems.map((ss) => {
          const alreadyAdded = isInCart(ss.sku, ss.size)
          return (
            <div key={`${ss.size}-${ss.sku}-${ss.finish}`} className="contents">
              <div className="flex items-center justify-center py-4">
                <SizeIcon size={ss.size} scale={computeScale(skuItems.map(s => s.size))} hideLabel areaHeight={40} customIconUrl={sizeIconOverrideMap.get(ss.size)} />
              </div>
              <span className="text-[14px] tracking-[-0.02em] text-gio-black py-4">{ss.size}</span>
              <span className="text-[14px] tracking-[-0.02em] text-gio-black/60 py-4">{ss.finish}</span>
              <span className="text-[13px] tracking-[-0.02em] text-gio-black/40 py-4">{ss.sku}</span>
              <div className="py-4">
                <button
                  type="button"
                  disabled={isFull && !alreadyAdded}
                  onClick={() =>
                    alreadyAdded
                      ? onRemoveSample(productId, ss.size)
                      : onAddSample(group, ss.size, ss.sku)
                  }
                  className={`rounded-full text-[13px] tracking-[-0.02em] border px-5 py-2 transition-colors duration-200 ${
                    alreadyAdded
                      ? 'bg-gio-black text-white border-gio-black hover:bg-gio-red hover:border-gio-red'
                      : 'bg-transparent text-gio-black border-gio-black/20 hover:bg-gio-red hover:text-white hover:border-gio-red disabled:opacity-40 disabled:cursor-not-allowed'
                  }`}
                >
                  {alreadyAdded ? '✓ Added' : '+ Sample'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Mobile: stacked rows ── */}
      <div className="sm:hidden">
        <span className="text-[14px] font-medium tracking-[-0.02em] text-gio-black pb-3 border-b border-gio-black/15 block">
          Sizes for {group.colorName}
        </span>
        {skuItems.map((ss) => {
          const alreadyAdded = isInCart(ss.sku, ss.size)
          return (
            <div key={`m-${ss.size}-${ss.sku}-${ss.finish}`} className="flex items-center justify-between py-4 border-b border-gio-black/5">
              <div className="flex-1 min-w-0">
                <div className="text-[14px] tracking-[-0.02em] text-gio-black">{ss.size}</div>
                <div className="text-[13px] tracking-[-0.02em] text-gio-black/60">{ss.finish}</div>
                <div className="text-[12px] tracking-[-0.02em] text-gio-black/40 mt-0.5">{ss.sku}</div>
              </div>
              <button
                type="button"
                disabled={isFull && !alreadyAdded}
                onClick={() =>
                  alreadyAdded
                    ? onRemoveSample(productId, ss.size)
                    : onAddSample(group, ss.size, ss.sku)
                }
                className={`rounded-full text-[13px] tracking-[-0.02em] border px-5 py-2 ml-3 shrink-0 transition-colors duration-200 ${
                  alreadyAdded
                    ? 'bg-gio-black text-white border-gio-black hover:bg-gio-red hover:border-gio-red'
                    : 'bg-transparent text-gio-black border-gio-black/20 hover:bg-gio-red hover:text-white hover:border-gio-red disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
              >
                {alreadyAdded ? '✓ Added' : '+ Sample'}
              </button>
            </div>
          )
        })}
      </div>

      {isFull && (
        <p className="text-[12px] text-gio-red mt-4">Sample limit reached (5 max)</p>
      )}
    </div>
  )
}

/* ── Finish & Thickness Icons ── */

const FINISH_ICON_SIZE = 56

function FinishIcon({ finish }: { finish: string }) {
  const s = FINISH_ICON_SIZE
  const color = 'text-gio-black/35'

  switch (finish.toLowerCase()) {
    case 'polished':
      // Smooth surface with diagonal shine streak
      return (
        <svg width={s} height={s} viewBox="0 0 56 56" fill="none" className={color}>
          <rect x="4" y="4" width="48" height="48" rx="2" stroke="currentColor" strokeWidth="1" fill="none" />
          <line x1="16" y1="40" x2="40" y2="16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
          <line x1="20" y1="40" x2="44" y2="16" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
          <circle cx="38" cy="18" r="3" fill="currentColor" opacity="0.5" />
        </svg>
      )

    case 'matte':
      // Fine stipple texture — uniform dots
      return (
        <svg width={s} height={s} viewBox="0 0 56 56" fill="none" className={color}>
          <rect x="4" y="4" width="48" height="48" rx="2" stroke="currentColor" strokeWidth="1" fill="none" />
          {[0,1,2,3,4].flatMap(r => [0,1,2,3,4].map(c => (
            <circle key={`${r}-${c}`} cx={12 + c * 8} cy={12 + r * 8} r="1.3" fill="currentColor" />
          )))}
        </svg>
      )

    case 'honed':
      // Smooth subtle horizontal lines — soft, even
      return (
        <svg width={s} height={s} viewBox="0 0 56 56" fill="none" className={color}>
          <rect x="4" y="4" width="48" height="48" rx="2" stroke="currentColor" strokeWidth="1" fill="none" />
          {[0,1,2,3,4,5].map(i => (
            <line key={i} x1="10" y1={14 + i * 6} x2="46" y2={14 + i * 6} stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
          ))}
        </svg>
      )

    case 'glossy':
    case 'bright':
      // Star/sparkle highlight
      return (
        <svg width={s} height={s} viewBox="0 0 56 56" fill="none" className={color}>
          <rect x="4" y="4" width="48" height="48" rx="2" stroke="currentColor" strokeWidth="1" fill="none" />
          {/* Main sparkle */}
          <line x1="28" y1="14" x2="28" y2="42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="14" y1="28" x2="42" y2="28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="18" y1="18" x2="38" y2="38" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
          <line x1="38" y1="18" x2="18" y2="38" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
          <circle cx="28" cy="28" r="2" fill="currentColor" />
        </svg>
      )

    case 'textured':
      // Irregular wavy lines
      return (
        <svg width={s} height={s} viewBox="0 0 56 56" fill="none" className={color}>
          <rect x="4" y="4" width="48" height="48" rx="2" stroke="currentColor" strokeWidth="1" fill="none" />
          <path d="M10 18 Q18 14, 28 18 T46 18" stroke="currentColor" strokeWidth="1.2" fill="none" />
          <path d="M10 28 Q18 24, 28 28 T46 28" stroke="currentColor" strokeWidth="1.2" fill="none" />
          <path d="M10 38 Q18 34, 28 38 T46 38" stroke="currentColor" strokeWidth="1.2" fill="none" />
        </svg>
      )

    case 'structured':
      // Cross-hatch pattern
      return (
        <svg width={s} height={s} viewBox="0 0 56 56" fill="none" className={color}>
          <rect x="4" y="4" width="48" height="48" rx="2" stroke="currentColor" strokeWidth="1" fill="none" />
          {[0,1,2,3].map(i => (
            <line key={`d1-${i}`} x1={10 + i * 10} y1="10" x2={10 + i * 10 + 30} y2="46" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
          ))}
          {[0,1,2,3].map(i => (
            <line key={`d2-${i}`} x1={46 - i * 10} y1="10" x2={46 - i * 10 - 30} y2="46" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
          ))}
        </svg>
      )

    case 'grip':
      // Diagonal grip lines
      return (
        <svg width={s} height={s} viewBox="0 0 56 56" fill="none" className={color}>
          <rect x="4" y="4" width="48" height="48" rx="2" stroke="currentColor" strokeWidth="1" fill="none" />
          {[0,1,2,3,4,5].map(i => (
            <line key={i} x1={8 + i * 8} y1="46" x2={8 + i * 8 + 16} y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
          ))}
        </svg>
      )

    case 'satin':
      // Gentle curved parallel arcs — soft sheen
      return (
        <svg width={s} height={s} viewBox="0 0 56 56" fill="none" className={color}>
          <rect x="4" y="4" width="48" height="48" rx="2" stroke="currentColor" strokeWidth="1" fill="none" />
          <path d="M10 20 Q28 12, 46 20" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.5" />
          <path d="M10 28 Q28 20, 46 28" stroke="currentColor" strokeWidth="1.2" fill="none" />
          <path d="M10 36 Q28 28, 46 36" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.5" />
        </svg>
      )

    case 'three dimensional':
      // Stacked layers / 3D cube
      return (
        <svg width={s} height={s} viewBox="0 0 56 56" fill="none" className={color}>
          <rect x="4" y="4" width="48" height="48" rx="2" stroke="currentColor" strokeWidth="1" fill="none" />
          {/* Isometric cube shape */}
          <polygon points="28,14 42,22 42,36 28,44 14,36 14,22" stroke="currentColor" strokeWidth="1.2" fill="none" />
          <line x1="28" y1="14" x2="28" y2="44" stroke="currentColor" strokeWidth="1" opacity="0.4" />
          <line x1="14" y1="22" x2="42" y2="22" stroke="currentColor" strokeWidth="1" opacity="0.4" />
          <polygon points="28,14 42,22 28,30 14,22" stroke="currentColor" strokeWidth="0.8" fill="currentColor" opacity="0.1" />
        </svg>
      )

    case 'rectified':
      // Precise square with sharp corners and alignment marks
      return (
        <svg width={s} height={s} viewBox="0 0 56 56" fill="none" className={color}>
          <rect x="4" y="4" width="48" height="48" rx="2" stroke="currentColor" strokeWidth="1" fill="none" />
          <rect x="14" y="14" width="28" height="28" stroke="currentColor" strokeWidth="1.5" fill="none" />
          {/* Corner precision marks */}
          <line x1="10" y1="14" x2="14" y2="14" stroke="currentColor" strokeWidth="1" />
          <line x1="14" y1="10" x2="14" y2="14" stroke="currentColor" strokeWidth="1" />
          <line x1="42" y1="10" x2="42" y2="14" stroke="currentColor" strokeWidth="1" />
          <line x1="42" y1="14" x2="46" y2="14" stroke="currentColor" strokeWidth="1" />
          <line x1="42" y1="42" x2="46" y2="42" stroke="currentColor" strokeWidth="1" />
          <line x1="42" y1="42" x2="42" y2="46" stroke="currentColor" strokeWidth="1" />
          <line x1="10" y1="42" x2="14" y2="42" stroke="currentColor" strokeWidth="1" />
          <line x1="14" y1="42" x2="14" y2="46" stroke="currentColor" strokeWidth="1" />
        </svg>
      )

    default:
      // Generic tile square
      return (
        <svg width={s} height={s} viewBox="0 0 56 56" fill="none" className={color}>
          <rect x="4" y="4" width="48" height="48" rx="2" stroke="currentColor" strokeWidth="1" fill="none" />
        </svg>
      )
  }
}

function ThicknessIcon() {
  return (
    <svg width={FINISH_ICON_SIZE} height={FINISH_ICON_SIZE} viewBox="0 0 56 56" fill="none" className="text-gio-black/35">
      {/* Side profile of tile thickness */}
      <rect x="8" y="20" width="40" height="16" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none" />
      {/* Top bevel line */}
      <line x1="8" y1="20" x2="14" y2="14" stroke="currentColor" strokeWidth="1" />
      <line x1="48" y1="20" x2="54" y2="14" stroke="currentColor" strokeWidth="1" />
      <line x1="14" y1="14" x2="54" y2="14" stroke="currentColor" strokeWidth="1" />
      {/* Thickness arrow */}
      <line x1="4" y1="20" x2="4" y2="36" stroke="currentColor" strokeWidth="0.8" markerStart="url(#arrowUp)" markerEnd="url(#arrowDown)" />
      <defs>
        <marker id="arrowUp" markerWidth="4" markerHeight="4" refX="2" refY="4" orient="auto">
          <path d="M0,4 L2,0 L4,4" fill="currentColor" />
        </marker>
        <marker id="arrowDown" markerWidth="4" markerHeight="4" refX="2" refY="0" orient="auto">
          <path d="M0,0 L2,4 L4,0" fill="currentColor" />
        </marker>
      </defs>
    </svg>
  )
}

/* ── Typography helpers ── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="heading-section">
      {children}
    </h2>
  )
}

function PdfIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  )
}

function FolderIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function ExpandIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  )
}
