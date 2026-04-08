import type { Metadata } from 'next'
import { client, urlFor } from '@/lib/sanity'
import HeroSection from '@/components/HeroSection'
import TrendingBestSellers from '@/components/TrendingBestSellers'
import FeaturedCollectionsStrip from '@/components/FeaturedCollectionsStrip'
import BrowseByLook from '@/components/BrowseByLook'
import ValueProps from '@/components/ValueProps'

export const metadata: Metadata = {
  title: 'GIO Architectural Tile & Stone | Commercial Tile Collections',
  description:
    'Tile collections curated expressly for commercial specifications. Browse trending best sellers, explore by look, size, color, and style.',
  openGraph: {
    title: 'GIO Architectural Tile & Stone',
    description:
      'Tile collections curated expressly for commercial specifications.',
    type: 'website',
  },
}

export const revalidate = 3600

/* ──────────────────────────────────────────────────────────────
   Homepage data fetching

   The homepage is CMS-driven via the Site Settings singleton:
    - heroLeftCollection / heroRightCollection → HeroSection
    - trendingCollections (up to 4) → TrendingBestSellers
    - featuredStripCollections (up to 3) → FeaturedCollectionsStrip

   If Site Settings is empty or partially filled, each section falls
   back to an auto-query sorted by (featured desc, productCount desc)
   so the homepage never shows empty slots.
   ────────────────────────────────────────────────────────────── */

const COLLECTION_FIELDS = `
  _id,
  title,
  "slug": slug.current,
  technicalSummary,
  heroImages[]{
    _key,
    _type,
    asset,
    hotspot,
    crop
  },
  featured,
  "colors": array::unique(products[]->colorFamily->hex)[0...5]
`

async function getHomePageData() {
  return client.fetch(`{
    "settings": *[_id == "siteSettings"][0] {
      heroLeftCollection->{ ${COLLECTION_FIELDS} },
      heroRightCollection->{ ${COLLECTION_FIELDS} },
      trendingCollections[]->{ ${COLLECTION_FIELDS} },
      featuredStripCollections[]->{ ${COLLECTION_FIELDS} }
    },
    "fallbackCollections": *[_type == "collection" && count(products) > 0]
      | order(coalesce(featured, false) desc, count(products) desc)[0...10] {
        ${COLLECTION_FIELDS}
      },
    "looks": *[_type == "look"] | order(coalesce(displayOrder, 999) asc, title asc) {
      _id,
      title,
      "slug": slug.current,
      image
    },
    "styles": *[_type == "style"] | order(coalesce(displayOrder, 999) asc, title asc) {
      _id,
      title,
      "slug": slug.current
    },
    "colors": *[_type == "color"] | order(coalesce(displayOrder, 999) asc, title asc) {
      _id,
      title,
      "slug": slug.current,
      hex
    },
    "sizeTypes": *[_type == "sizeType"] | order(coalesce(displayOrder, 999) asc, title asc) {
      _id,
      title,
      "slug": slug.current
    }
  }`)
}

/* Pre-build image URLs for hero tiles.
   IMPORTANT: the aspect ratio requested from Sanity must match the actual
   rendered container aspect ratio — otherwise CSS object-cover does a second
   (centered) crop on top of Sanity's focal-point crop and the focal point is
   lost. Containers measured on desktop @ 1440w:
     - Left  (small): ~524w × ~360h  → ~1.45 aspect (landscape)
     - Right (large): ~880w × ~728h  → ~1.21 aspect (landscape)
*/
function prepareHero(c: any, size: 'small' | 'large') {
  if (!c) return null
  const dims =
    size === 'large'
      ? { w: 1760, h: 1456 } // 2x of ~880×728
      : { w: 1048, h: 720 } //  2x of ~524×360
  return {
    _id: c._id,
    title: c.title,
    slug: c.slug,
    featured: c.featured,
    imageUrl: c.heroImages?.[0]
      ? urlFor(c.heroImages[0]).width(dims.w).height(dims.h).url()
      : null,
  }
}

/* Pre-build image URLs for trending card (tall portrait) */
function prepareTrending(c: any) {
  return {
    _id: c._id,
    title: c.title,
    slug: c.slug,
    featured: c.featured,
    colors: (c.colors || []).filter(Boolean),
    imageUrl: c.heroImages?.[0]
      ? urlFor(c.heroImages[0]).width(800).height(1100).url()
      : null,
  }
}

/* Pre-build image URLs for featured strip.
   Active panel is flex-[3]/5 at ~844px tall → roughly square (~1:1).
   Inactive panels are narrow columns — object-cover will crop horizontally
   in those, but the vertical focal point will be preserved because the
   source is wider than the inactive container. */
function prepareFeatured(c: any) {
  return {
    _id: c._id,
    title: c.title,
    slug: c.slug,
    featured: c.featured,
    technicalSummary: c.technicalSummary,
    imageUrl: c.heroImages?.[0]
      ? urlFor(c.heroImages[0]).width(1600).height(1560).url()
      : null,
  }
}

export default async function HomePage() {
  const data = await getHomePageData()
  const settings = data.settings || {}
  const fallback: any[] = data.fallbackCollections || []

  /* ── Hero: prefer curated settings; fall back to top 2 of fallback ── */
  const heroLeftRaw = settings.heroLeftCollection || fallback[0] || null
  const heroRightRaw = settings.heroRightCollection || fallback[1] || null
  const heroLeft = prepareHero(heroLeftRaw, 'small')
  const heroRight = prepareHero(heroRightRaw, 'large')

  /* ── Trending: prefer curated (up to 4); fall back to top 4 ── */
  const trendingRaw: any[] =
    (settings.trendingCollections || []).filter(Boolean).length > 0
      ? settings.trendingCollections.filter(Boolean)
      : fallback.slice(0, 4)
  const trending = trendingRaw.slice(0, 4).map(prepareTrending)

  /* ── Featured strip: prefer curated (up to 3); fall back to next 3 ── */
  const featuredRaw: any[] =
    (settings.featuredStripCollections || []).filter(Boolean).length > 0
      ? settings.featuredStripCollections.filter(Boolean)
      : fallback.slice(4, 7).length > 0
        ? fallback.slice(4, 7)
        : fallback.slice(0, 3)
  const featured = featuredRaw.slice(0, 3).map(prepareFeatured)

  /* ── Looks: pre-build images with aspect ratios matching each container ──
     Index 0 is the featured "fill" card (tall portrait, ~0.65 aspect).
     The rest render in a 4:3 landscape tile. Different aspect → different URL. */
  const looks = (data.looks || []).map((l: any, i: number) => ({
    _id: l._id,
    title: l.title,
    slug: l.slug,
    imageUrl: l.image
      ? i === 0
        ? urlFor(l.image).width(600).height(920).url() // featured fill (~0.65 portrait)
        : urlFor(l.image).width(900).height(700).url() // regular 4:3 landscape
      : null,
  }))

  return (
    <div className="flex flex-col items-center">
      <HeroSection left={heroLeft} right={heroRight} />
      <TrendingBestSellers collections={trending} />
      <FeaturedCollectionsStrip collections={featured} />
      <BrowseByLook
        looks={looks}
        styles={data.styles || []}
        colors={data.colors || []}
        sizeTypes={data.sizeTypes || []}
      />
      <ValueProps />
    </div>
  )
}
