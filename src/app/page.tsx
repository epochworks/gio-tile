import type { Metadata } from 'next'
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

export default function HomePage() {
  return (
    <div className="flex flex-col items-center">
      <HeroSection />
      <TrendingBestSellers />
      <FeaturedCollectionsStrip />
      <BrowseByLook />
      <ValueProps />
    </div>
  )
}
