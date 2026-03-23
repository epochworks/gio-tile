import type { MetadataRoute } from 'next'
import { client } from '@/lib/sanity'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://giotile.com'

  // Fetch all slugs from Sanity in parallel
  const [collections, products, posts, pages] = await Promise.all([
    client.fetch<Array<{ slug: string; _updatedAt: string }>>(
      '*[_type == "collection"]{ "slug": slug.current, _updatedAt } | order(title asc)'
    ),
    client.fetch<Array<{ slug: string; _updatedAt: string }>>(
      '*[_type == "product"]{ "slug": slug.current, _updatedAt } | order(title asc)'
    ),
    client.fetch<Array<{ slug: string; _updatedAt: string }>>(
      '*[_type == "post"]{ "slug": slug.current, _updatedAt } | order(publishedAt desc)'
    ),
    client.fetch<Array<{ slug: string; _updatedAt: string }>>(
      '*[_type == "page"]{ "slug": slug.current, _updatedAt }'
    ),
  ])

  const entries: MetadataRoute.Sitemap = [
    // Static pages
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/collections`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/samples`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/company`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/resources`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },

    // Collections
    ...collections.map((c) => ({
      url: `${baseUrl}/collections/${c.slug}`,
      lastModified: new Date(c._updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),

    // Products
    ...products.map((p) => ({
      url: `${baseUrl}/products/${p.slug}`,
      lastModified: new Date(p._updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),

    // Blog posts
    ...posts.map((p) => ({
      url: `${baseUrl}/blog/${p.slug}`,
      lastModified: new Date(p._updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),

    // CMS pages
    ...pages.map((p) => ({
      url: `${baseUrl}/${p.slug}`,
      lastModified: new Date(p._updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    })),
  ]

  return entries
}
