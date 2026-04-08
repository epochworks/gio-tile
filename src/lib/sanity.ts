import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'
import type { SanityImageSource } from '@sanity/image-url/lib/types/types'

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-03-15',
  useCdn: process.env.NODE_ENV === 'production',
})

const builder = imageUrlBuilder(client)

export function urlFor(source: SanityImageSource) {
  return builder.image(source).auto('format')
}

// Type definitions based on our schema
export interface Color {
  _id: string
  title: string
  hex: string
}

export interface Finish {
  _id: string
  title: string
}

export interface Style {
  _id: string
  title: string
  slug: { current: string }
}

export interface Look {
  _id: string
  title: string
  slug: { current: string }
  image?: SanityImageSource
}

export interface SizeType {
  _id: string
  title: string
}

export interface SKU {
  code: string
  size: string
  sizeType: SizeType
}

export interface FinishVariant {
  type: Finish
  skus: SKU[]
}

export interface Product {
  _id: string
  title: string
  slug: { current: string }
  collection: Collection
  colorName: string
  colorFamily: Color
  images: SanityImageSource[]
  shadeVariation?: string
  finishes: FinishVariant[]
}

export interface Collection {
  _id: string
  title: string
  slug: { current: string }
  technicalSummary?: string
  description?: string
  heroImages: SanityImageSource[]
  specSheet?: {
    asset: {
      url: string
    }
  }
  dropboxUrl?: string
  applications?: string[]
  surfaces?: string[]
  style?: Style
  look?: Look
  thickness?: string
  products: Product[]
  technicalSpecs?: Array<{
    description: string
    result: string
    testMethod?: string
  }>
  sizeIconOverrides?: Array<{
    size: string
    icon: { asset: { url: string } }
  }>
}

// Blog & Page types
export interface Author {
  _id: string
  name: string
  slug: { current: string }
  bio?: string
  image?: SanityImageSource
  role?: string
}

export interface Category {
  _id: string
  title: string
  slug: { current: string }
  description?: string
}

export interface Tag {
  _id: string
  title: string
  slug: { current: string }
}

export interface Post {
  _id: string
  title: string
  slug: { current: string }
  author?: Author
  categories?: Category[]
  tags?: Tag[]
  mainImage?: SanityImageSource & { alt?: string }
  body?: any[]
  excerpt?: string
  publishedAt: string
  seoTitle?: string
  seoDescription?: string
  featured?: boolean
}

export interface Page {
  _id: string
  title: string
  slug: { current: string }
  body?: any[]
  seoTitle?: string
  seoDescription?: string
}

// GROQ Queries
export const queries = {
  // Get all collections with basic info
  allCollections: `*[_type == "collection"] | order(title asc) {
    _id,
    title,
    slug,
    technicalSummary,
    heroImages,
    surfaces,
    applications,
    featured,
    style->{title, slug},
    look->{title, slug},
    "productCount": count(products),
    "colorCount": count(array::unique(products[]->colorName)),
    "sizeCount": count(array::unique(products[]->finishes[].skus[].size)),
    "finishCount": count(array::unique(products[]->finishes[].type->title))
  }`,

  // Get single collection with all products
  collectionBySlug: `*[_type == "collection" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    technicalSummary,
    description,
    heroImages,
    specSheet { asset-> { url } },
    dropboxUrl,
    applications,
    surfaces,
    style->{title, slug},
    look->{title, slug},
    thickness,
    technicalSpecs,
    packagingData,
    sizeIconOverrides[] { size, icon { asset-> { url } } },
    products[]->{
      _id,
      title,
      slug,
      colorName,
      colorFamily->{title, hex},
      images,
      shadeVariation,
      finishes[] {
        type->{title},
        skus[] {
          code,
          size,
          sizeType->{title}
        }
      }
    }
  }`,

  // Get single product with collection context
  productBySlug: `*[_type == "product" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    colorName,
    colorFamily->{title, hex},
    images,
    shadeVariation,
    finishes[] {
      type->{title},
      skus[] {
        code,
        size,
        sizeType->{title}
      }
    },
    collection->{
      _id,
      title,
      slug,
      technicalSummary,
      specSheet { asset-> { url } },
      dropboxUrl,
      technicalSpecs,
      products[]->{
        _id,
        title,
        slug,
        colorName,
        colorFamily->{title, hex},
        images
      }
    }
  }`,

  // Get all taxonomy items for filters
  allColors: `*[_type == "color"] | order(title asc) { _id, title, hex }`,
  allFinishes: `*[_type == "finish"] | order(title asc) { _id, title }`,
  allStyles: `*[_type == "style"] | order(title asc) { _id, title, slug }`,
  allLooks: `*[_type == "look"] | order(title asc) { _id, title, slug, image }`,
  allSizeTypes: `*[_type == "sizeType"] | order(title asc) { _id, title }`,

  // Get all products with taxonomy from parent collection for /tile-stone page
  allProductsWithFacets: `*[_type == "product"] | order(collection->title asc, title asc) {
    _id,
    title,
    slug,
    colorName,
    colorFamily->{_id, title, slug, hex},
    images,
    shadeVariation,
    finishes[] {
      type->{_id, title, slug},
      skus[] {
        code,
        size,
        sizeType->{_id, title, slug}
      }
    },
    "collectionTitle": collection->title,
    "collectionSlug": collection->slug.current,
    "collectionFeatured": collection->featured,
    "material": collection->material,
    "surfaces": collection->surfaces,
    "look": collection->look->{_id, title, slug},
    "style": collection->style->{_id, title, slug},
    "technicalSummary": collection->technicalSummary
  }`,

  // Featured/trending collections for homepage
  featuredCollections: `*[_type == "collection" && featured == true] | order(title asc)[0...4] {
    _id,
    title,
    slug,
    technicalSummary,
    heroImages,
    products[0...4]->{
      colorFamily->{hex}
    }
  }`,

  // Browse by Look with images
  browseByLook: `*[_type == "look"] | order(title asc) {
    _id,
    title,
    slug,
    image
  }`,

  // Collections filtered by look
  collectionsByLook: `*[_type == "collection" && look->slug.current == $lookSlug] | order(title asc) {
    _id,
    title,
    slug,
    technicalSummary,
    heroImages
  }`,

  // Collections filtered by style
  collectionsByStyle: `*[_type == "collection" && style->slug.current == $styleSlug] | order(title asc) {
    _id,
    title,
    slug,
    technicalSummary,
    heroImages
  }`,

  // Related collections (same look or surfaces, excluding current)
  relatedCollections: `*[_type == "collection" && _id != $id && (look->slug.current == $lookSlug || count((surfaces[])[@ in $surfaces]) > 0)] | order(title asc)[0...4] {
    _id,
    title,
    slug,
    technicalSummary,
    heroImages,
    surfaces,
    look->{title, slug}
  }`,

  // Blog posts
  allPosts: `*[_type == "post"] | order(publishedAt desc) {
    _id,
    title,
    slug,
    excerpt,
    publishedAt,
    mainImage,
    featured,
    author->{ _id, name, slug, image },
    categories[]->{ _id, title, slug }
  }`,

  postBySlug: `*[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    excerpt,
    publishedAt,
    mainImage,
    body,
    seoTitle,
    seoDescription,
    featured,
    author->{ _id, name, slug, image, bio, role },
    categories[]->{ _id, title, slug },
    tags[]->{ _id, title, slug }
  }`,

  postsByCategory: `*[_type == "post" && $categorySlug in categories[]->slug.current] | order(publishedAt desc) {
    _id,
    title,
    slug,
    excerpt,
    publishedAt,
    mainImage,
    author->{ _id, name, slug, image },
    categories[]->{ _id, title, slug }
  }`,

  recentPosts: `*[_type == "post"] | order(publishedAt desc)[0...$limit] {
    _id,
    title,
    slug,
    excerpt,
    publishedAt,
    mainImage,
    categories[]->{ _id, title, slug }
  }`,

  allPostSlugs: `*[_type == "post"]{ "slug": slug.current }`,

  // Blog taxonomies
  allCategories: `*[_type == "category"] | order(title asc) { _id, title, slug, description }`,
  allTags: `*[_type == "tag"] | order(title asc) { _id, title, slug }`,

  // Static pages
  pageBySlug: `*[_type == "page" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    body,
    seoTitle,
    seoDescription
  }`,

  allPageSlugs: `*[_type == "page"]{ "slug": slug.current }`,

  // Search collections and products
  search: `{
    "collections": *[_type == "collection" && title match $query + "*"] | order(title asc)[0...10] {
      _id,
      title,
      slug,
      heroImages[0]
    },
    "products": *[_type == "product" && (title match $query + "*" || colorName match $query + "*")] | order(title asc)[0...10] {
      _id,
      title,
      slug,
      colorName,
      images[0],
      collection->{title, slug}
    }
  }`,
}

// Fetch helpers
export async function getCollections() {
  return client.fetch(queries.allCollections)
}

export async function getProductsWithFacets() {
  return client.fetch(queries.allProductsWithFacets)
}

export async function getCollectionBySlug(slug: string) {
  return client.fetch(queries.collectionBySlug, { slug })
}

export async function getProductBySlug(slug: string) {
  return client.fetch(queries.productBySlug, { slug })
}

export async function getFeaturedCollections() {
  return client.fetch(queries.featuredCollections)
}

export async function getLooks() {
  return client.fetch(queries.browseByLook)
}

export async function getStyles() {
  return client.fetch(queries.allStyles)
}

export async function getColors() {
  return client.fetch(queries.allColors)
}

export async function getRelatedCollections(id: string, lookSlug: string | null, surfaces: string[]) {
  return client.fetch(queries.relatedCollections, {
    id,
    lookSlug: lookSlug || '',
    surfaces: surfaces.length > 0 ? surfaces : ['__none__'],
  })
}

// Blog & Page helpers
export async function getPosts() {
  return client.fetch(queries.allPosts)
}

export async function getPostBySlug(slug: string) {
  return client.fetch(queries.postBySlug, { slug })
}

export async function getPostsByCategory(categorySlug: string) {
  return client.fetch(queries.postsByCategory, { categorySlug })
}

export async function getCategories() {
  return client.fetch(queries.allCategories)
}

export async function getTags() {
  return client.fetch(queries.allTags)
}

export async function getRecentPosts(limit = 5) {
  return client.fetch(queries.recentPosts, { limit })
}

export async function getPageBySlug(slug: string) {
  return client.fetch(queries.pageBySlug, { slug })
}

export async function getAllPostSlugs() {
  return client.fetch(queries.allPostSlugs)
}

export async function getAllPageSlugs() {
  return client.fetch(queries.allPageSlugs)
}
