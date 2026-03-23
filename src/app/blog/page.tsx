import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getPosts, getCategories, urlFor } from '@/lib/sanity'
import type { Post, Category } from '@/lib/sanity'
import BlogArchiveClient from './BlogArchiveClient'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Design inspiration, tile trends, installation guides, and industry insights from GIO Architectural Tile & Stone.',
  openGraph: {
    title: 'Blog | GIO Tile',
    description:
      'Design inspiration, tile trends, installation guides, and industry insights from GIO Architectural Tile & Stone.',
  },
}

export default async function BlogPage() {
  const [posts, categories] = await Promise.all([getPosts(), getCategories()])

  return (
    <>
      {/* Hero header */}
      <section className="pt-section pb-12">
        <div className="container-gio">
          <h1 className="heading-page text-balance">Blog</h1>
          <p className="text-subtitle mt-4 max-w-2xl">
            Design inspiration, tile trends, and industry insights.
          </p>
        </div>
      </section>

      {/* Client component for filtering */}
      <BlogArchiveClient posts={posts} categories={categories} />
    </>
  )
}
