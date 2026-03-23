'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { urlFor } from '@/lib/sanity'
import type { SanityImageSource } from '@sanity/image-url/lib/types/types'

type TabType = 'look' | 'size' | 'color' | 'style'

interface BrowseItem {
  _id: string
  title: string
  slug: { current: string }
  image?: SanityImageSource
  hex?: string
}

interface BrowseByTabsProps {
  looks: BrowseItem[]
  styles: BrowseItem[]
  colors: BrowseItem[]
}

export default function BrowseByTabs({ looks, styles, colors }: BrowseByTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('look')

  const tabs: { key: TabType; label: string }[] = [
    { key: 'look', label: 'Look' },
    { key: 'size', label: 'Size' },
    { key: 'color', label: 'Color' },
    { key: 'style', label: 'Style' },
  ]

  return (
    <section className="section bg-white">
      <div className="container-gio">
        {/* Tab Headers */}
        <div className="flex items-baseline gap-4 mb-10">
          <span className="text-headline">Browse by</span>
          <div className="flex gap-4">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  text-headline transition-all duration-300
                  ${activeTab === tab.key
                    ? 'text-gio-black underline underline-offset-4'
                    : 'text-gio-black/30 hover:text-gio-black/60'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="relative min-h-[300px]">
          {/* Look Tab */}
          <TabContent isActive={activeTab === 'look'}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {looks.map((look) => (
                <LookCard key={look._id} item={look} />
              ))}
            </div>
          </TabContent>

          {/* Size Tab */}
          <TabContent isActive={activeTab === 'size'}>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {['Large Format', 'Standard', 'Mosaic', 'Plank', 'Hexagonal', 'Subway'].map(
                (size) => (
                  <Link
                    key={size}
                    href={`/collections?size=${encodeURIComponent(size.toLowerCase())}`}
                    className="group p-6 bg-gio-grey hover:bg-gio-black transition-colors duration-300"
                  >
                    <span className="text-body font-medium text-gio-black group-hover:text-white transition-colors">
                      {size}
                    </span>
                  </Link>
                )
              )}
            </div>
          </TabContent>

          {/* Color Tab */}
          <TabContent isActive={activeTab === 'color'}>
            <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-4">
              {colors.map((color) => (
                <Link
                  key={color._id}
                  href={`/collections?color=${color.slug?.current || color.title.toLowerCase()}`}
                  className="group flex flex-col items-center gap-3"
                >
                  <div
                    className="w-16 h-16 rounded-full border-2 border-transparent 
                             group-hover:border-gio-black transition-colors duration-300"
                    style={{ backgroundColor: color.hex || '#808080' }}
                  />
                  <span className="text-caption text-gio-black/60 group-hover:text-gio-black transition-colors">
                    {color.title}
                  </span>
                </Link>
              ))}
            </div>
          </TabContent>

          {/* Style Tab */}
          <TabContent isActive={activeTab === 'style'}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {styles.map((style) => (
                <Link
                  key={style._id}
                  href={`/collections?style=${style.slug.current}`}
                  className="group p-6 bg-gio-grey hover:bg-gio-black transition-colors duration-300"
                >
                  <span className="text-body font-medium text-gio-black group-hover:text-white transition-colors">
                    {style.title}
                  </span>
                </Link>
              ))}
            </div>
          </TabContent>
        </div>
      </div>
    </section>
  )
}

function TabContent({
  isActive,
  children,
}: {
  isActive: boolean
  children: React.ReactNode
}) {
  return (
    <div
      className={`
        transition-all duration-300
        ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 absolute inset-0 pointer-events-none'}
      `}
    >
      {children}
    </div>
  )
}

function LookCard({ item }: { item: BrowseItem }) {
  return (
    <Link href={`/collections?look=${item.slug.current}`} className="group block">
      <div className="relative aspect-[4/3] overflow-hidden bg-gio-grey mb-3">
        {item.image && (
          <Image
            src={urlFor(item.image).width(400).height(300).url()}
            alt={item.title}
            fill
            className="object-cover img-zoom"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        )}
        <div className="absolute inset-0 bg-gio-black/0 group-hover:bg-gio-black/10 transition-colors duration-300" />
      </div>
      <h3 className="text-body font-medium text-gio-black group-hover:text-gio-red transition-colors">
        {item.title}
      </h3>
    </Link>
  )
}
