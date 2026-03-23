import Link from 'next/link'
import ProductCard from './ProductCard'
import type { SanityImageSource } from '@sanity/image-url/lib/types/types'

interface TrendingCollection {
  _id: string
  title: string
  slug: { current: string }
  heroImages: SanityImageSource[]
  technicalSummary?: string
  products?: { colorFamily?: { hex: string } }[]
  isNew?: boolean
}

interface TrendingProductsProps {
  collections: TrendingCollection[]
}

export default function TrendingProducts({ collections }: TrendingProductsProps) {
  if (collections.length === 0) return null

  return (
    <section className="section">
      <div className="container-gio">
        {/* Header */}
        <div className="flex items-baseline justify-between mb-10">
          <h2 className="text-headline">Trending Best Sellers</h2>
          <Link
            href="/collections?sort=trending"
            className="text-caption text-gio-black/60 hover:text-gio-red transition-colors underline underline-offset-4"
          >
            View all bestsellers
          </Link>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {collections.slice(0, 4).map((collection) => (
            <ProductCard
              key={collection._id}
              title={collection.title}
              slug={collection.slug.current}
              image={collection.heroImages[0]}
              isNew={collection.isNew}
              technicalSummary={collection.technicalSummary}
              colors={
                collection.products
                  ?.filter((p) => p.colorFamily?.hex)
                  .map((p) => ({ hex: p.colorFamily!.hex })) || []
              }
            />
          ))}
        </div>
      </div>
    </section>
  )
}
