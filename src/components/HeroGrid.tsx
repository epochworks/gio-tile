import Image from 'next/image'
import Link from 'next/link'
import { urlFor } from '@/lib/sanity'
import type { SanityImageSource } from '@sanity/image-url/lib/types/types'

interface HeroCollection {
  _id: string
  title: string
  slug: { current: string }
  heroImages: SanityImageSource[]
  isNew?: boolean
}

interface HeroGridProps {
  collections: HeroCollection[]
}

export default function HeroGrid({ collections }: HeroGridProps) {
  // We need at least 4 collections for the grid layout
  const [main, topRight, bottomLeft, bottomRight] = collections.slice(0, 4)

  return (
    <section className="container-gio py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-[200px] md:auto-rows-[250px]">
        {/* Top Left - Brand Message (spans 1 col, 2 rows on desktop) */}
        <div className="bg-gio-red p-8 flex flex-col justify-end row-span-1 lg:row-span-2">
          <span className="text-white/80 text-caption mb-2">Welcome to Gio.</span>
          <h1 className="text-display text-white text-balance">
            Tile Collections Curated Expressly for Commercial Specifications
          </h1>
        </div>

        {/* Top Center - First Featured Collection */}
        {main && (
          <HeroCard
            collection={main}
            className="row-span-1"
          />
        )}

        {/* Top Right - Second Featured Collection (spans 2 rows) */}
        {topRight && (
          <HeroCard
            collection={topRight}
            className="row-span-1 lg:row-span-2"
            priority
          />
        )}

        {/* Bottom Center Left */}
        {bottomLeft && (
          <HeroCard
            collection={bottomLeft}
            className="row-span-1"
          />
        )}

        {/* Bottom Center Right */}
        {bottomRight && (
          <HeroCard
            collection={bottomRight}
            className="row-span-1"
          />
        )}
      </div>
    </section>
  )
}

function HeroCard({
  collection,
  className = '',
  priority = false,
}: {
  collection: HeroCollection
  className?: string
  priority?: boolean
}) {
  return (
    <Link
      href={`/collections/${collection.slug.current}`}
      className={`group relative overflow-hidden ${className}`}
    >
      {/* Image */}
      {collection.heroImages?.[0] && (
        <Image
          src={urlFor(collection.heroImages[0]).width(800).height(600).url()}
          alt={collection.title}
          fill
          className="object-cover img-zoom"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          priority={priority}
        />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-gio-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* New Badge */}
      {collection.isNew && (
        <span className="badge absolute top-4 right-4 z-10">New</span>
      )}

      {/* Title */}
      <div className="absolute bottom-4 left-4 right-4">
        <h2 className="text-title text-white drop-shadow-lg">
          {collection.title}
        </h2>
      </div>
    </Link>
  )
}
