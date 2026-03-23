import type { Metadata } from 'next'
import { getCollections, urlFor } from '@/lib/sanity'
import CollectionGrid from './CollectionFilters'
import ScrollReveal from '@/components/ScrollReveal'

export const metadata: Metadata = {
  title: 'Collections | GIO Architectural Tile & Stone',
  description:
    'Explore our curated selection of architectural tile and stone, designed for commercial specifications.',
}

export const revalidate = 3600

export default async function CollectionsPage() {
  const rawCollections = (await getCollections()) || []

  // Pre-build image URLs server-side so we don't pass urlFor to client
  const collections = rawCollections.map((c: any) => ({
    ...c,
    heroImageUrl: c.heroImages?.[0]
      ? urlFor(c.heroImages[0]).width(600).height(750).url()
      : null,
    heroImageUrlLarge: c.heroImages?.[0]
      ? urlFor(c.heroImages[0]).width(900).height(600).url()
      : null,
  }))

  // Extract unique filter options from collection data
  const looks = Array.from(new Set(rawCollections.map((c: any) => c.look?.title).filter(Boolean))).sort() as string[]
  const styles = Array.from(new Set(rawCollections.map((c: any) => c.style?.title).filter(Boolean))).sort() as string[]

  return (
    <>
      {/* Page Header */}
      <section className="pt-section pb-12">
        <div className="max-w-container mx-auto px-container">
          <ScrollReveal>
            <h1 className="text-display text-gio-black mb-4">Collections</h1>
            <p className="text-body text-gio-black/45 max-w-xl leading-relaxed">
              Explore our curated selection of architectural tile and stone,
              designed for commercial specifications and high-performance
              environments.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Filters + Grid */}
      <section className="pb-24">
        <div className="max-w-container mx-auto px-container">
          <CollectionGrid collections={collections} looks={looks} styles={styles} />
        </div>
      </section>
    </>
  )
}
