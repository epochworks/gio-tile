/**
 * WordPress → Sanity Migration Script
 *
 * Parses a WordPress WXR XML export and imports all content into Sanity:
 * - Categories, Tags, Authors (created first as taxonomy docs)
 * - Posts (with Portable Text body, image migration, category/tag refs)
 * - Pages (static content pages)
 *
 * All imported documents use `wp-` prefixed IDs to avoid conflicts with
 * existing Sanity data (collections, products, etc.).
 *
 * Usage:
 *   npx tsx scripts/wp-migrate.ts <path-to-wordpress-export.xml> [--dry-run]
 */

import * as fs from 'fs'
import * as path from 'path'
import * as cheerio from 'cheerio'
import { createClient } from '@sanity/client'
import { htmlToPortableText, type ImageBlock } from './lib/htmlToPortableText'

// ── Config ──────────────────────────────────────────────────────────────

const SANITY_PROJECT_ID = '6kv11yeo'
const SANITY_DATASET = 'production'
const SANITY_TOKEN = process.env.SANITY_TOKEN || 'skjBBxKzhOiNUrGjMNwflpPvMIN455xbyiMYgIuxOdztNNy2djId32Fy9fs4GOvmyuaYpM1UkBMzeI5PB6k9LwGF97K1cHu8vjuxePWKfOTzbVK81qggFmMtOkG9hKK0vfwcNI2Z0oydsTcrFIGwndhkv821miYvfmhkEANdAL0QXgpMBwdO'

const DRY_RUN = process.argv.includes('--dry-run')
const xmlPath = process.argv[2]

if (!xmlPath || xmlPath.startsWith('--')) {
  console.error('Usage: npx tsx scripts/wp-migrate.ts <path-to-export.xml> [--dry-run]')
  process.exit(1)
}

// Routes that already exist in Next.js — exclude from redirects
const EXISTING_ROUTES = new Set([
  'collections', 'products', 'samples', 'blog', 'api',
  'company', 'contact', 'privacy', 'terms', 'resources',
])

const client = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  token: SANITY_TOKEN,
  apiVersion: '2024-03-15',
  useCdn: false,
})

// ── Types ───────────────────────────────────────────────────────────────

interface WpCategory {
  termId: string
  slug: string
  name: string
}

interface WpTag {
  termId: string
  slug: string
  name: string
}

interface WpAuthor {
  id: string
  login: string
  email: string
  displayName: string
  firstName: string
  lastName: string
}

interface WpPost {
  id: string
  title: string
  slug: string
  date: string
  author: string // author login
  content: string
  excerpt: string
  status: string
  type: string // 'post' | 'page' | 'attachment' etc.
  link: string
  categories: string[] // category slugs
  tags: string[] // tag slugs
  featuredImageUrl?: string
}

// ── Parse WXR XML ───────────────────────────────────────────────────────

function parseWxr(xmlContent: string) {
  const $ = cheerio.load(xmlContent, { xmlMode: true })

  // Parse categories
  const categories: WpCategory[] = []
  $('wp\\:category').each((_, el) => {
    const node = $(el)
    categories.push({
      termId: node.find('wp\\:term_id').text(),
      slug: cdata(node.find('wp\\:category_nicename').text()),
      name: cdata(node.find('wp\\:cat_name').text()),
    })
  })

  // Parse tags
  const tags: WpTag[] = []
  $('wp\\:tag').each((_, el) => {
    const node = $(el)
    tags.push({
      termId: node.find('wp\\:term_id').text(),
      slug: cdata(node.find('wp\\:tag_slug').text()),
      name: cdata(node.find('wp\\:tag_name').text()),
    })
  })

  // Parse authors
  const authors: WpAuthor[] = []
  $('wp\\:author').each((_, el) => {
    const node = $(el)
    authors.push({
      id: node.find('wp\\:author_id').text(),
      login: cdata(node.find('wp\\:author_login').text()),
      email: cdata(node.find('wp\\:author_email').text()),
      displayName: cdata(node.find('wp\\:author_display_name').text()),
      firstName: cdata(node.find('wp\\:author_first_name').text()),
      lastName: cdata(node.find('wp\\:author_last_name').text()),
    })
  })

  // Parse items (posts, pages, attachments)
  const posts: WpPost[] = []
  const attachments = new Map<string, string>() // postId → url

  $('item').each((_, el) => {
    const node = $(el)
    const postType = cdata(node.find('wp\\:post_type').text())
    const status = cdata(node.find('wp\\:status').text())
    const postId = node.find('wp\\:post_id').text()

    if (postType === 'attachment') {
      const url = node.find('wp\\:attachment_url').text()
      if (url) attachments.set(postId, url)
      return
    }

    // Only import published posts and pages
    if (status !== 'publish') return
    if (postType !== 'post' && postType !== 'page') return

    const itemCategories: string[] = []
    const itemTags: string[] = []

    node.find('category').each((_, cat) => {
      const catNode = $(cat)
      const domain = catNode.attr('domain')
      const nicename = catNode.attr('nicename') || ''
      if (domain === 'category' && nicename !== 'uncategorized') {
        itemCategories.push(nicename)
      }
      if (domain === 'post_tag') {
        itemTags.push(nicename)
      }
    })

    // Try to find featured image from postmeta
    let featuredImageUrl: string | undefined
    node.find('wp\\:postmeta').each((_, meta) => {
      const metaNode = $(meta)
      const metaKey = cdata(metaNode.find('wp\\:meta_key').text())
      if (metaKey === '_thumbnail_id') {
        const thumbId = cdata(metaNode.find('wp\\:meta_value').text())
        featuredImageUrl = attachments.get(thumbId)
      }
    })

    posts.push({
      id: postId,
      title: node.find('title').first().text(),
      slug: cdata(node.find('wp\\:post_name').text()),
      date: cdata(node.find('wp\\:post_date_gmt').text()),
      author: cdata(node.find('dc\\:creator').text()),
      content: cdata(node.find('content\\:encoded').text()),
      excerpt: cdata(node.find('excerpt\\:encoded').text()),
      status,
      type: postType,
      link: node.find('link').first().text(),
      categories: itemCategories,
      tags: itemTags,
      featuredImageUrl,
    })
  })

  // Second pass: resolve featured images that reference attachments parsed after posts
  posts.forEach((post) => {
    if (!post.featuredImageUrl) {
      // Re-scan postmeta for _thumbnail_id
      $(`item`).each((_, el) => {
        const node = $(el)
        if (node.find('wp\\:post_id').text() === post.id) {
          node.find('wp\\:postmeta').each((_, meta) => {
            const metaNode = $(meta)
            if (cdata(metaNode.find('wp\\:meta_key').text()) === '_thumbnail_id') {
              const thumbId = cdata(metaNode.find('wp\\:meta_value').text())
              post.featuredImageUrl = attachments.get(thumbId)
            }
          })
        }
      })
    }
  })

  return { categories, tags, authors, posts, attachments }
}

function cdata(text: string): string {
  return text.replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, '$1').trim()
}

// ── Image Upload ────────────────────────────────────────────────────────

const imageCache = new Map<string, string>() // url → sanity asset _id

async function uploadImage(url: string): Promise<string | null> {
  if (imageCache.has(url)) return imageCache.get(url)!

  try {
    const response = await fetch(url)
    if (!response.ok) {
      console.warn(`    ⚠ Failed to download image: ${url} (${response.status})`)
      return null
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    const filename = path.basename(new URL(url).pathname)

    const asset = await client.assets.upload('image', buffer, { filename })
    imageCache.set(url, asset._id)
    return asset._id
  } catch (err: any) {
    console.warn(`    ⚠ Image upload failed: ${url} — ${err.message}`)
    return null
  }
}

// ── Sanity Import ───────────────────────────────────────────────────────

async function importCategories(categories: WpCategory[]) {
  console.log(`\n📂 Importing ${categories.length} categories...`)
  let count = 0

  for (const cat of categories) {
    if (cat.slug === 'uncategorized') continue

    const doc = {
      _id: `wp-category-${cat.slug}`,
      _type: 'category',
      title: decodeEntities(cat.name),
      slug: { _type: 'slug', current: cat.slug },
      wpSlug: cat.slug,
    }

    if (DRY_RUN) {
      console.log(`  [dry-run] Would create category: ${doc.title} (${doc._id})`)
    } else {
      await client.createOrReplace(doc)
      count++
    }
  }

  console.log(`  ✓ ${DRY_RUN ? 'Would create' : 'Created'} ${count} categories`)
}

async function importTags(tags: WpTag[]) {
  console.log(`\n🏷️  Importing ${tags.length} tags...`)
  let count = 0

  for (const tag of tags) {
    const doc = {
      _id: `wp-tag-${tag.slug}`,
      _type: 'tag',
      title: decodeEntities(tag.name),
      slug: { _type: 'slug', current: tag.slug },
    }

    if (DRY_RUN) {
      console.log(`  [dry-run] Would create tag: ${doc.title} (${doc._id})`)
    } else {
      await client.createOrReplace(doc)
      count++
    }
  }

  console.log(`  ✓ ${DRY_RUN ? 'Would create' : 'Created'} ${count} tags`)
}

async function importAuthors(authors: WpAuthor[]) {
  console.log(`\n👤 Importing ${authors.length} authors...`)
  let count = 0

  for (const author of authors) {
    const name = author.displayName || `${author.firstName} ${author.lastName}`.trim() || author.login
    const slug = author.login.toLowerCase().replace(/[^a-z0-9]+/g, '-')

    const doc = {
      _id: `wp-author-${author.id}`,
      _type: 'author',
      name: decodeEntities(name),
      slug: { _type: 'slug', current: slug },
    }

    if (DRY_RUN) {
      console.log(`  [dry-run] Would create author: ${doc.name} (${doc._id})`)
    } else {
      await client.createOrReplace(doc)
      count++
    }
  }

  console.log(`  ✓ ${DRY_RUN ? 'Would create' : 'Created'} ${count} authors`)
}

async function importPosts(
  posts: WpPost[],
  authors: WpAuthor[],
) {
  const blogPosts = posts.filter((p) => p.type === 'post')
  console.log(`\n📝 Importing ${blogPosts.length} blog posts...`)

  const authorMap = new Map<string, string>() // login → sanity _id
  authors.forEach((a) => authorMap.set(a.login, `wp-author-${a.id}`))

  let count = 0
  const redirects: Array<{ source: string; destination: string; permanent: boolean }> = []

  for (const post of blogPosts) {
    console.log(`  → ${post.title}`)

    // Convert HTML to Portable Text
    let body = htmlToPortableText(post.content)

    // Upload images found in body
    if (!DRY_RUN) {
      for (const block of body) {
        if (block._type === 'image' && (block as ImageBlock)._wpImageUrl) {
          const imgBlock = block as ImageBlock
          const assetId = await uploadImage(imgBlock._wpImageUrl!)
          if (assetId) {
            imgBlock.asset = { _type: 'reference', _ref: assetId }
          }
          delete imgBlock._wpImageUrl
        }
      }
    }

    // Upload featured image
    let mainImage: any = undefined
    if (post.featuredImageUrl && !DRY_RUN) {
      const assetId = await uploadImage(post.featuredImageUrl)
      if (assetId) {
        mainImage = {
          _type: 'image',
          asset: { _type: 'reference', _ref: assetId },
        }
      }
    }

    // Build category references
    const categoryRefs = post.categories
      .map((slug) => ({
        _type: 'reference',
        _ref: `wp-category-${slug}`,
        _key: slug,
      }))

    // Build tag references
    const tagRefs = post.tags
      .map((slug) => ({
        _type: 'reference',
        _ref: `wp-tag-${slug}`,
        _key: slug,
      }))

    // Find author
    const authorRef = authorMap.get(post.author)

    // Extract WordPress URL path for redirects
    let wpPath: string | undefined
    try {
      const url = new URL(post.link)
      wpPath = url.pathname.replace(/\/$/, '') // Remove trailing slash
    } catch {
      // If link is relative or malformed, construct from category + slug
      if (post.categories.length > 0) {
        wpPath = `/${post.categories[0]}/${post.slug}`
      }
    }

    // Generate redirect if the WP path doesn't conflict with existing routes
    if (wpPath && wpPath !== `/blog/${post.slug}`) {
      const firstSegment = wpPath.split('/').filter(Boolean)[0]
      if (firstSegment && !EXISTING_ROUTES.has(firstSegment)) {
        redirects.push({
          source: wpPath,
          destination: `/blog/${post.slug}`,
          permanent: true,
        })
      }
    }

    const doc: any = {
      _id: `wp-post-${post.slug}`,
      _type: 'post',
      title: decodeEntities(post.title),
      slug: { _type: 'slug', current: post.slug },
      publishedAt: post.date ? new Date(post.date + 'Z').toISOString() : new Date().toISOString(),
      body,
      wpPath,
    }

    if (post.excerpt) doc.excerpt = decodeEntities(post.excerpt)
    if (mainImage) doc.mainImage = mainImage
    if (categoryRefs.length > 0) doc.categories = categoryRefs
    if (tagRefs.length > 0) doc.tags = tagRefs
    if (authorRef) doc.author = { _type: 'reference', _ref: authorRef }

    if (DRY_RUN) {
      console.log(`    [dry-run] Would create post: ${doc._id}`)
      console.log(`    Categories: ${post.categories.join(', ') || '(none)'}`)
      console.log(`    Tags: ${post.tags.join(', ') || '(none)'}`)
      console.log(`    Body blocks: ${body.length}`)
      if (wpPath) console.log(`    Redirect: ${wpPath} → /blog/${post.slug}`)
    } else {
      await client.createOrReplace(doc)
      count++
    }
  }

  console.log(`  ✓ ${DRY_RUN ? 'Would create' : 'Created'} ${count} posts`)
  return redirects
}

async function importPages(posts: WpPost[]) {
  const pages = posts.filter((p) => p.type === 'page')
  console.log(`\n📄 Importing ${pages.length} pages...`)

  // Fetch existing collection and product slugs from Sanity to skip duplicates
  const existingDocs = await client.fetch<Array<{slug: string}>>(
    '*[_type in ["collection", "product"]]{"slug": slug.current}'
  )
  const existingSlugs = new Set(existingDocs.map((d) => d.slug))
  console.log(`  (Skipping pages matching ${existingSlugs.size} existing collection/product slugs)`)

  let count = 0
  const skipped: string[] = []

  for (const page of pages) {
    // Skip pages that are clearly WP-specific (empty, or WP admin pages)
    if (!page.content.trim() && !page.title.trim()) continue

    // Skip pages with slugs that conflict with existing routes
    if (EXISTING_ROUTES.has(page.slug)) {
      skipped.push(`${page.title} (/${page.slug} — conflicts with existing route)`)
      continue
    }

    // Skip pages that match existing collection or product slugs
    if (existingSlugs.has(page.slug)) {
      skipped.push(`${page.title} (/${page.slug} — existing collection/product)`)
      continue
    }

    console.log(`  → ${page.title}`)

    const body = htmlToPortableText(page.content)

    // Upload images in body
    if (!DRY_RUN) {
      for (const block of body) {
        if (block._type === 'image' && (block as ImageBlock)._wpImageUrl) {
          const imgBlock = block as ImageBlock
          const assetId = await uploadImage(imgBlock._wpImageUrl!)
          if (assetId) {
            imgBlock.asset = { _type: 'reference', _ref: assetId }
          }
          delete imgBlock._wpImageUrl
        }
      }
    }

    const doc = {
      _id: `wp-page-${page.slug}`,
      _type: 'page',
      title: decodeEntities(page.title),
      slug: { _type: 'slug', current: page.slug },
      body,
    }

    if (DRY_RUN) {
      console.log(`    [dry-run] Would create page: ${doc._id} (${body.length} blocks)`)
    } else {
      await client.createOrReplace(doc)
      count++
    }
  }

  if (skipped.length > 0) {
    console.log(`  ⚠ Skipped (route conflicts): ${skipped.join(', ')}`)
  }
  console.log(`  ✓ ${DRY_RUN ? 'Would create' : 'Created'} ${count} pages`)
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#8211;/g, '\u2013')
    .replace(/&#8212;/g, '\u2014')
    .replace(/&#8216;/g, '\u2018')
    .replace(/&#8217;/g, '\u2019')
    .replace(/&#8220;/g, '\u201C')
    .replace(/&#8221;/g, '\u201D')
    .replace(/&#8230;/g, '\u2026')
    .replace(/&#038;/g, '&')
    .replace(/&#\d+;/g, (match) => {
      const code = parseInt(match.replace(/&#|;/g, ''))
      return String.fromCharCode(code)
    })
}

// ── Main ────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════')
  console.log('  WordPress → Sanity Migration')
  console.log(`  Mode: ${DRY_RUN ? '🔍 DRY RUN (no writes)' : '🚀 LIVE'}`)
  console.log('═══════════════════════════════════════════════════')

  // Read and parse XML
  console.log(`\nReading ${xmlPath}...`)
  const xml = fs.readFileSync(path.resolve(xmlPath), 'utf-8')

  console.log('Parsing WordPress export...')
  const { categories, tags, authors, posts } = parseWxr(xml)

  const blogPosts = posts.filter((p) => p.type === 'post')
  const pages = posts.filter((p) => p.type === 'page')

  console.log(`\n📊 Found:`)
  console.log(`   ${categories.length} categories`)
  console.log(`   ${tags.length} tags`)
  console.log(`   ${authors.length} authors`)
  console.log(`   ${blogPosts.length} blog posts`)
  console.log(`   ${pages.length} pages`)

  // Import in order: taxonomies first, then content
  await importCategories(categories)
  await importTags(tags)
  await importAuthors(authors)
  const redirects = await importPosts(posts, authors)
  await importPages(posts)

  // Save redirects
  const redirectPath = path.resolve(__dirname, '../data/redirects.json')
  if (DRY_RUN) {
    console.log(`\n🔀 Would generate ${redirects.length} redirects → ${redirectPath}`)
    if (redirects.length > 0) {
      console.log('  Sample redirects:')
      redirects.slice(0, 5).forEach((r) => {
        console.log(`    ${r.source} → ${r.destination}`)
      })
    }
  } else {
    fs.mkdirSync(path.dirname(redirectPath), { recursive: true })
    fs.writeFileSync(redirectPath, JSON.stringify(redirects, null, 2))
    console.log(`\n🔀 Saved ${redirects.length} redirects → ${redirectPath}`)
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════')
  console.log('  Migration complete!')
  if (!DRY_RUN) {
    console.log(`  Images cached: ${imageCache.size}`)
  }
  console.log('═══════════════════════════════════════════════════')
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
