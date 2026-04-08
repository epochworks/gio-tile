'use client'

import Image from 'next/image'
import Link from 'next/link'
import ScrollReveal from './ScrollReveal'

interface TrendingCollection {
  _id: string
  title: string
  slug: string
  featured?: boolean
  colors: string[]
  imageUrl: string | null
}

interface TrendingBestSellersProps {
  collections: TrendingCollection[]
}

export default function TrendingBestSellers({
  collections,
}: TrendingBestSellersProps) {
  if (!collections || collections.length === 0) return null

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
              href="/tile-stone"
              className="hidden sm:block text-caption text-gio-black group"
            >
              <span className="relative">
                View all tile &amp; stone
                <span className="absolute left-0 -bottom-0.5 w-full h-px bg-gio-black/20 group-hover:bg-gio-black transition-colors" />
              </span>
            </Link>
          </div>
        </ScrollReveal>

        {/* Tile Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {collections.map((collection, i) => (
            <ScrollReveal key={collection._id} delay={i * 80}>
              <TileCard collection={collection} index={i} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function TileCard({
  collection,
  index,
}: {
  collection: TrendingCollection
  index: number
}) {
  return (
    <Link href={`/collections/${collection.slug}`} className="group block">
      <article className="bg-gio-grey overflow-hidden">
        {/* Card Header */}
        <div className="flex items-center gap-2.5 min-h-[55px] px-2.5 py-3.5">
          <h3 className="flex-1 text-body text-gio-black">{collection.title}</h3>
          {collection.featured && (
            <span className="bg-gio-black text-white text-small px-3.5 py-1.5 flex-shrink-0">
              New
            </span>
          )}
        </div>

        {/* Card Image */}
        <div className="relative aspect-[1766/2413] overflow-hidden">
          {collection.imageUrl && (
            <Image
              src={collection.imageUrl}
              alt={`${collection.title} tile collection`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              loading={index < 2 ? 'eager' : 'lazy'}
            />
          )}
        </div>
      </article>

      {/* Color Dots */}
      {collection.colors.length > 0 && (
        <div className="flex items-center gap-1.5 mt-2.5">
          {collection.colors.slice(0, 4).map((color, ci) => (
            <span
              key={ci}
              className="w-[14px] h-[14px] rounded-full border border-black/10"
              style={{ backgroundColor: color }}
              aria-label={`Color option ${ci + 1}`}
            />
          ))}
          {collection.colors.length > 4 && (
            <span className="text-small text-gio-black/50 ml-0.5">
              +{collection.colors.length - 4}
            </span>
          )}
        </div>
      )}
    </Link>
  )
}
