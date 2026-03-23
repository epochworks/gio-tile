'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import ScrollReveal from './ScrollReveal'

const tabs = ['Look', 'Size', 'Color', 'Style'] as const

const looks = [
  { name: 'Stone', slug: 'stone', image: '/images/look-stone.png' },
  { name: 'Marble', slug: 'marble', image: '/images/look-marble.png' },
  { name: 'Wood', slug: 'wood', image: '/images/look-wood.png' },
  { name: 'Concrete', slug: 'concrete', image: '/images/look-concrete.png' },
  { name: 'Metal', slug: 'metal', image: '/images/look-metal.png' },
]

const sizes = [
  'Large Format',
  'Standard',
  'Mosaic',
  'Plank',
  'Hexagon',
  'Subway',
]

const colors = [
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Beige', hex: '#D4C5A9' },
  { name: 'Grey', hex: '#9E9E9E' },
  { name: 'Black', hex: '#111111' },
  { name: 'Brown', hex: '#6B4226' },
  { name: 'Blue', hex: '#4A6FA5' },
]

const styles = [
  'Modern',
  'Traditional',
  'Transitional',
  'Contemporary',
  'Industrial',
  'Mediterranean',
]

export default function BrowseByLook() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('Look')

  return (
    <section
      className="w-full pt-section"
      aria-labelledby="browse-heading"
    >
      <div className="max-w-container mx-auto px-container">
      {/* Tab Header */}
      <ScrollReveal>
        <div className="flex items-center gap-4 mb-9" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={`
                text-headline transition-opacity duration-300
                ${activeTab === tab ? 'opacity-100' : 'opacity-50 hover:opacity-70'}
              `}
            >
              {activeTab === tab ? (
                <span>
                  Browse{' '}
                  <span className="underline underline-offset-4 decoration-1">
                    by {tab}
                  </span>
                </span>
              ) : (
                tab
              )}
            </button>
          ))}
        </div>
      </ScrollReveal>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'Look' && <LookGrid />}
        {activeTab === 'Size' && <TagGrid items={sizes} label="size" />}
        {activeTab === 'Color' && <ColorGrid />}
        {activeTab === 'Style' && <TagGrid items={styles} label="style" />}
      </div>
      </div>
    </section>
  )
}

function LookGrid() {
  return (
    <div className="flex flex-col md:flex-row gap-3">
      {/* Stone — fixed width, full height */}
      <div className="w-full md:w-[524px] md:flex-shrink-0">
        <LookCard look={looks[0]} fill />
      </div>

      {/* Middle column: Marble + Wood */}
      <div className="flex flex-col gap-3 flex-1">
        <LookCard look={looks[1]} />
        <LookCard look={looks[2]} />
      </div>

      {/* Right column: Concrete + Metal */}
      <div className="flex flex-col gap-3 flex-1">
        <LookCard look={looks[3]} />
        <LookCard look={looks[4]} />
      </div>
    </div>
  )
}

function LookCard({
  look,
  fill = false,
}: {
  look: (typeof looks)[number]
  fill?: boolean
}) {
  return (
    <Link
      href={`/collections?look=${look.slug}`}
      className={`group block bg-gio-grey overflow-hidden ${fill ? 'h-full flex flex-col' : ''}`}
    >
      <div className="px-[15px] py-[20px] flex-shrink-0">
        <h3 className="text-title text-gio-black">{look.name}</h3>
      </div>
      <div
        className={`relative overflow-hidden ${
          fill ? 'flex-1 min-h-[300px]' : 'aspect-[4/3]'
        }`}
      >
        <Image
          src={look.image}
          alt={`${look.name} look tiles`}
          fill
          sizes={fill ? '(max-width: 768px) 100vw, 524px' : '(max-width: 768px) 100vw, 33vw'}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          loading="lazy"
        />
      </div>
    </Link>
  )
}

function ColorGrid() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
      {colors.map((color) => (
        <Link
          key={color.name}
          href={`/collections?color=${color.name.toLowerCase()}`}
          className="group flex flex-col items-center gap-3 p-6 bg-gio-grey hover:bg-[#ebebeb] transition-colors"
        >
          <span
            className="w-16 h-16 rounded-full border border-black/10"
            style={{ backgroundColor: color.hex }}
          />
          <span className="text-caption text-gio-black">{color.name}</span>
        </Link>
      ))}
    </div>
  )
}

function TagGrid({ items, label }: { items: string[]; label: string }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {items.map((item) => (
        <Link
          key={item}
          href={`/collections?${label}=${item.toLowerCase().replace(/\s+/g, '-')}`}
          className="group flex items-center justify-center p-8 bg-gio-grey hover:bg-gio-black hover:text-white transition-colors text-title text-center"
        >
          {item}
        </Link>
      ))}
    </div>
  )
}
