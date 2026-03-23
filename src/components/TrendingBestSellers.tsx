'use client'

import Image from 'next/image'
import Link from 'next/link'
import ScrollReveal from './ScrollReveal'

const tiles = [
  {
    name: 'Brick Cotto',
    slug: 'brick-cotto',
    image: '/images/tile-brick-cotto.png',
    isNew: true,
    colors: ['#8B7355', '#A0522D', '#6B4226', '#D2B48C'],
  },
  {
    name: 'Cotto Cemento',
    slug: 'cotto-cemento',
    image: '/images/tile-cotto-cemento.png',
    isNew: true,
    colors: ['#CD5C5C', '#D2691E', '#8B4513', '#F4A460', '#DEB887'],
  },
  {
    name: 'Geometry Picket',
    slug: 'geometry-picket',
    image: '/images/tile-geometry-picket.png',
    isNew: false,
    colors: ['#FFFFFF', '#D3D3D3', '#A9A9A9'],
  },
  {
    name: 'Onyx Lux',
    slug: 'onyx-lux',
    image: '/images/tile-onyx-lux.png',
    isNew: false,
    colors: ['#F5F5DC', '#D4C5A9', '#C4A882'],
  },
]

export default function TrendingBestSellers() {
  return (
    <section
      className="w-full pt-section"
      aria-labelledby="trending-heading"
    >
      <div className="max-w-container mx-auto px-container">
      {/* Section Header */}
      <ScrollReveal>
        <div className="flex items-center justify-between mb-9">
          <h2 id="trending-heading" className="text-headline">
            Trending Best Sellers
          </h2>
          <Link
            href="/collections"
            className="hidden sm:block text-caption text-gio-black group"
          >
            <span className="relative">
              View all bestsellers
              <span className="absolute left-0 -bottom-0.5 w-full h-px bg-gio-black/20 group-hover:bg-gio-black transition-colors" />
            </span>
          </Link>
        </div>
      </ScrollReveal>

      {/* Tile Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {tiles.map((tile, i) => (
          <ScrollReveal key={tile.slug} delay={i * 80}>
            <TileCard tile={tile} index={i} />
          </ScrollReveal>
        ))}
      </div>
      </div>
    </section>
  )
}

function TileCard({
  tile,
  index,
}: {
  tile: (typeof tiles)[number]
  index: number
}) {
  return (
    <Link href={`/collections/${tile.slug}`} className="group block">
      <article className="bg-gio-grey overflow-hidden">
        {/* Card Header */}
        <div className="flex items-center gap-2.5 min-h-[55px] px-2.5 py-3.5">
          <h3 className="flex-1 text-body text-gio-black">{tile.name}</h3>
          {tile.isNew && (
            <span className="bg-gio-black text-white text-small px-3.5 py-1.5 flex-shrink-0">
              New
            </span>
          )}
        </div>

        {/* Card Image */}
        <div className="relative aspect-[1766/2413] overflow-hidden">
          <Image
            src={tile.image}
            alt={`${tile.name} tile collection`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading={index < 2 ? 'eager' : 'lazy'}
          />
        </div>
      </article>

      {/* Color Dots */}
      <div className="flex items-center gap-1.5 mt-2.5">
        {tile.colors.slice(0, 4).map((color, ci) => (
          <span
            key={ci}
            className="w-[14px] h-[14px] rounded-full border border-black/10"
            style={{ backgroundColor: color }}
            aria-label={`Color option ${ci + 1}`}
          />
        ))}
        {tile.colors.length > 4 && (
          <span className="text-small text-gio-black/50 ml-0.5">
            +{tile.colors.length - 4}
          </span>
        )}
      </div>
    </Link>
  )
}
