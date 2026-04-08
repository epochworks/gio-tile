'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import ScrollReveal from './ScrollReveal'

interface FeaturedCollection {
  _id: string
  title: string
  slug: string
  featured?: boolean
  technicalSummary?: string
  imageUrl: string | null
}

interface FeaturedCollectionsStripProps {
  collections: FeaturedCollection[]
}

export default function FeaturedCollectionsStrip({
  collections,
}: FeaturedCollectionsStripProps) {
  const [activeIndex, setActiveIndex] = useState(
    Math.max(0, collections.length - 1)
  )

  if (!collections || collections.length === 0) return null

  return (
    <ScrollReveal
      as="section"
      className="w-full pt-section"
    >
      <div className="max-w-container mx-auto px-container">
        <div
          className="bg-gio-black flex flex-col md:flex-row h-[600px] md:h-[844px] overflow-hidden"
          aria-label="Featured collections"
          role="tablist"
        >
          {collections.map((collection, i) => {
            const isActive = i === activeIndex
            return (
              <button
                key={collection._id}
                role="tab"
                aria-selected={isActive}
                aria-label={`${collection.title} collection`}
                onClick={() => setActiveIndex(i)}
                onMouseEnter={() => setActiveIndex(i)}
                className={`
                  relative overflow-hidden cursor-pointer text-left
                  transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]
                  flex flex-col justify-between p-[30px]
                  ${isActive ? 'flex-[3]' : 'flex-[1]'}
                  ${collections.length === 1 ? 'h-full' : 'h-1/3 md:h-full'}
                `}
              >
                {/* Background Image */}
                {collection.imageUrl && (
                  <Image
                    src={collection.imageUrl}
                    alt={`${collection.title} collection`}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className={`
                      object-cover transition-transform duration-700
                      ${isActive ? 'scale-100' : 'scale-110'}
                    `}
                    loading="lazy"
                  />
                )}

                {/* Dark overlay for inactive panels */}
                <div
                  className={`
                    absolute inset-0 bg-black transition-opacity duration-500
                    ${isActive ? 'opacity-0' : 'opacity-40'}
                  `}
                />

                {/* New Badge */}
                {collection.featured && (
                  <div
                    className={`
                      relative z-10 self-start
                      transition-opacity duration-500
                      ${isActive ? 'opacity-100' : 'opacity-0 md:opacity-100'}
                    `}
                  >
                    <span className="bg-gio-black text-white text-small px-3.5 py-2 inline-block">
                      New Collection
                    </span>
                  </div>
                )}
                {!collection.featured && <div />}

                {/* Info Card */}
                <div
                  className={`
                    relative z-10 bg-gio-red w-full max-w-[261px]
                    flex flex-col justify-between overflow-hidden
                    transition-all duration-500
                    ${isActive ? 'opacity-100 translate-y-0 h-[261px]' : 'opacity-0 translate-y-4 h-0'}
                  `}
                >
                  <div className="p-[25px] flex flex-col gap-2">
                    <h3 className="text-[26px] tracking-[-0.02em] leading-none text-white">
                      {collection.title}
                    </h3>
                    {collection.technicalSummary && (
                      <p className="text-body leading-[1.15] text-white line-clamp-3">
                        {collection.technicalSummary}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/collections/${collection.slug}`}
                    className="flex items-center justify-between p-[25px] text-white text-body hover:bg-[#d4181f] transition-colors"
                    tabIndex={isActive ? 0 : -1}
                    onClick={(e) => e.stopPropagation()}
                  >
                    Explore Collection
                    <ArrowIcon />
                  </Link>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </ScrollReveal>
  )
}

function ArrowIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M1 6h10M7 2l4 4-4 4" />
    </svg>
  )
}
