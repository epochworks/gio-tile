import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getProductsWithFacets, urlFor, client } from '@/lib/sanity'
import TileStoneFilter from './TileStoneFilter'
import ScrollReveal from '@/components/ScrollReveal'

export const metadata: Metadata = {
  title: 'Tile & Stone | GIO Architectural Tile & Stone',
  description:
    'Browse our complete selection of architectural tile and stone by look, style, material, surface, color, and size.',
}

export const revalidate = 3600

export default async function TileStonePage() {
  // Fetch all data in parallel
  const [rawProducts, looks, styles, colors, finishes, sizeTypes] = await Promise.all([
    getProductsWithFacets(),
    client.fetch(`*[_type == "look"] | order(displayOrder asc, title asc) { _id, title, slug }`),
    client.fetch(`*[_type == "style"] | order(displayOrder asc, title asc) { _id, title, slug }`),
    client.fetch(`*[_type == "color"] | order(displayOrder asc, title asc) { _id, title, slug, hex }`),
    client.fetch(`*[_type == "finish"] | order(displayOrder asc, title asc) { _id, title, slug }`),
    client.fetch(`*[_type == "sizeType"] | order(displayOrder asc, title asc) { _id, title, slug }`),
  ])

  // Pre-build image URLs + flatten taxonomy slugs for client-side filtering
  const products = (rawProducts || []).map((p: any) => ({
    ...p,
    imageUrl: p.images?.[0]
      ? urlFor(p.images[0]).width(600).height(600).url()
      : null,
    // Flatten for fast client-side filtering
    lookSlug: p.look?.slug?.current || null,
    styleSlug: p.style?.slug?.current || null,
    colorSlug: p.colorFamily?.slug?.current || null,
    finishSlugs: (p.finishes || []).map((f: any) => f?.type?.slug?.current).filter(Boolean),
    sizeTypeSlugs: (p.finishes || [])
      .flatMap((f: any) => (f?.skus || []).map((s: any) => s?.sizeType?.slug?.current))
      .filter(Boolean),
    sizes: (p.finishes || [])
      .flatMap((f: any) => (f?.skus || []).map((s: any) => s?.size))
      .filter(Boolean),
  }))

  return (
    <>
      {/* Page Header */}
      <section className="pt-section pb-12">
        <div className="max-w-container mx-auto px-container">
          <ScrollReveal>
            <h1 className="text-display text-gio-black mb-4">Tile &amp; Stone</h1>
            <p className="text-body text-gio-black/45 max-w-xl leading-relaxed">
              Browse our complete selection of architectural tile and stone.
              Filter by look, style, material, surface, color, and size to find
              the perfect product for your project.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Filters + Grid */}
      <section className="pb-24">
        <div className="max-w-container mx-auto px-container">
          <Suspense fallback={<div className="h-96" />}>
            <TileStoneFilter
              products={products}
              looks={looks || []}
              styles={styles || []}
              colors={colors || []}
              finishes={finishes || []}
              sizeTypes={sizeTypes || []}
            />
          </Suspense>
        </div>
      </section>
    </>
  )
}
