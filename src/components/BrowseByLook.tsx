'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, LayoutGroup } from 'framer-motion'
import ScrollReveal from './ScrollReveal'

const tabs = ['Look', 'Size', 'Color', 'Style'] as const
type Tab = (typeof tabs)[number]

interface TaxonomyItem {
  _id: string
  title: string
  slug: string
  imageUrl?: string | null
  hex?: string
}

interface BrowseByLookProps {
  looks: TaxonomyItem[]
  styles: TaxonomyItem[]
  colors: TaxonomyItem[]
  sizeTypes: TaxonomyItem[]
}

export default function BrowseByLook({
  looks,
  styles,
  colors,
  sizeTypes,
}: BrowseByLookProps) {
  const [activeTab, setActiveTab] = useState<Tab>('Look')

  return (
    <section
      className="w-full pt-section"
      aria-labelledby="browse-heading"
    >
      <div className="max-w-container mx-auto px-container">
        {/* Tab Header — "Browse by" stays static; active word sits tight after it,
            remaining tabs appear in original order minus the active one.
            Uses framer-motion LayoutGroup so tabs slide smoothly when reordered. */}
        <ScrollReveal>
          <LayoutGroup id="browse-by-tabs">
            <div
              className="flex items-baseline gap-4 mb-9 flex-wrap"
              role="tablist"
            >
              {/* "Browse" stays static; "by {active}" share a continuous border-bottom */}
              <h2 className="text-headline flex items-baseline gap-[0.3em]">
                <span>Browse</span>
                <motion.span
                  layout
                  className="flex items-baseline gap-[0.3em] border-b border-current pb-[2px]"
                  transition={{
                    type: 'spring',
                    stiffness: 380,
                    damping: 32,
                  }}
                >
                  <span>by</span>
                  <motion.button
                    key={activeTab}
                    layoutId={`tab-${activeTab}`}
                    role="tab"
                    aria-selected
                    className="text-headline"
                    transition={{
                      type: 'spring',
                      stiffness: 380,
                      damping: 32,
                    }}
                  >
                    {activeTab}
                  </motion.button>
                </motion.span>
              </h2>

              {/* Remaining tabs — in original order, minus active */}
              <div className="flex items-baseline gap-4 ml-2">
                {tabs
                  .filter((tab) => tab !== activeTab)
                  .map((tab) => (
                    <motion.button
                      key={tab}
                      layoutId={`tab-${tab}`}
                      role="tab"
                      aria-selected={false}
                      onClick={() => setActiveTab(tab)}
                      className="text-headline opacity-50 hover:opacity-80"
                      transition={{
                        type: 'spring',
                        stiffness: 380,
                        damping: 32,
                      }}
                      whileHover={{ opacity: 0.85 }}
                    >
                      {tab}
                    </motion.button>
                  ))}
              </div>
            </div>
          </LayoutGroup>
        </ScrollReveal>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === 'Look' && <LookGrid looks={looks} />}
          {activeTab === 'Size' && <TagGrid items={sizeTypes} paramKey="size" />}
          {activeTab === 'Color' && <ColorGrid colors={colors} />}
          {activeTab === 'Style' && <TagGrid items={styles} paramKey="style" />}
        </div>
      </div>
    </section>
  )
}

function LookGrid({ looks }: { looks: TaxonomyItem[] }) {
  if (looks.length === 0) return null

  // Responsive layout: first look fills left column, rest split into 2 columns
  const featured = looks[0]
  const middle = looks.slice(1, 3)
  const right = looks.slice(3, 5)

  return (
    <div className="flex flex-col md:flex-row gap-3">
      {/* Featured look — full height */}
      <div className="w-full md:w-[524px] md:flex-shrink-0">
        <LookCard look={featured} fill />
      </div>

      {/* Middle column */}
      {middle.length > 0 && (
        <div className="flex flex-col gap-3 flex-1">
          {middle.map((look) => (
            <LookCard key={look._id} look={look} />
          ))}
        </div>
      )}

      {/* Right column */}
      {right.length > 0 && (
        <div className="flex flex-col gap-3 flex-1">
          {right.map((look) => (
            <LookCard key={look._id} look={look} />
          ))}
        </div>
      )}
    </div>
  )
}

function LookCard({
  look,
  fill = false,
}: {
  look: TaxonomyItem
  fill?: boolean
}) {
  return (
    <Link
      href={`/tile-stone?look=${look.slug}`}
      className={`group block bg-gio-grey overflow-hidden ${fill ? 'h-full flex flex-col' : ''}`}
    >
      <div className="px-[15px] py-[20px] flex-shrink-0">
        <h3 className="text-title text-gio-black">{look.title}</h3>
      </div>
      <div
        className={`relative overflow-hidden ${
          fill ? 'flex-1 min-h-[300px]' : 'aspect-[4/3]'
        }`}
      >
        {look.imageUrl ? (
          <Image
            src={look.imageUrl}
            alt={`${look.title} look tiles`}
            fill
            sizes={fill ? '(max-width: 768px) 100vw, 524px' : '(max-width: 768px) 100vw, 33vw'}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gio-grey to-[#e8e8e8] flex items-center justify-center">
            <span className="text-[80px] text-gio-black/10 tracking-[-0.04em]">
              {look.title.charAt(0)}
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}

function ColorGrid({ colors }: { colors: TaxonomyItem[] }) {
  if (colors.length === 0) return null
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
      {colors.slice(0, 12).map((color) => (
        <Link
          key={color._id}
          href={`/tile-stone?color=${color.slug}`}
          className="group flex flex-col items-center gap-3 p-6 bg-gio-grey hover:bg-[#ebebeb] transition-colors"
        >
          <span
            className="w-16 h-16 rounded-full border border-black/10"
            style={{ backgroundColor: color.hex || '#CCCCCC' }}
          />
          <span className="text-caption text-gio-black">{color.title}</span>
        </Link>
      ))}
    </div>
  )
}

function TagGrid({
  items,
  paramKey,
}: {
  items: TaxonomyItem[]
  paramKey: string
}) {
  if (items.length === 0) return null
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {items.slice(0, 12).map((item) => (
        <Link
          key={item._id}
          href={`/tile-stone?${paramKey}=${item.slug}`}
          className="group flex items-center justify-center p-8 bg-gio-grey hover:bg-gio-black hover:text-white transition-colors text-title text-center"
        >
          {item.title}
        </Link>
      ))}
    </div>
  )
}
