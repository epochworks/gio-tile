import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getCollectionBySlug, getCollections, getRelatedCollections } from '@/lib/sanity'
import CollectionDetail from '@/components/collection/CollectionDetail'

interface CollectionPageProps {
  params: { slug: string }
}

export const revalidate = 3600

export async function generateStaticParams() {
  const collections = (await getCollections()) || []
  return collections.map((c: any) => ({ slug: c.slug.current }))
}

export async function generateMetadata({
  params,
}: CollectionPageProps): Promise<Metadata> {
  const collection = await getCollectionBySlug(params.slug)

  if (!collection) {
    return { title: 'Collection Not Found' }
  }

  return {
    title: `${collection.title} | GIO Architectural Tile & Stone`,
    description:
      collection.description || collection.technicalSummary || collection.title,
  }
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const collection = await getCollectionBySlug(params.slug)

  if (!collection) {
    notFound()
  }

  const relatedCollections = await getRelatedCollections(
    collection._id,
    collection.look?.slug?.current || null,
    collection.surfaces || []
  )

  return <CollectionDetail collection={collection} relatedCollections={relatedCollections || []} />
}
