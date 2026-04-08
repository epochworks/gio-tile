/**
 * Content Reorganization Script
 *
 * Cleans up Sanity CMS data imported from WordPress:
 * - Deletes junk/redundant pages
 * - Consolidates blog categories (31 → ~8)
 * - Prunes low-value tags (170 → ~20)
 * - Updates redirects for all changed slugs
 *
 * Usage:
 *   npx tsx scripts/reorganize-content.ts [--dry-run]
 */

import { createClient } from '@sanity/client'
import * as fs from 'fs'
import * as path from 'path'

// ── Config ──────────────────────────────────────────────────────────────

const SANITY_PROJECT_ID = '6kv11yeo'
const SANITY_DATASET = 'production'
const SANITY_TOKEN =
  process.env.SANITY_TOKEN ||
  'skjBBxKzhOiNUrGjMNwflpPvMIN455xbyiMYgIuxOdztNNy2djId32Fy9fs4GOvmyuaYpM1UkBMzeI5PB6k9LwGF97K1cHu8vjuxePWKfOTzbVK81qggFmMtOkG9hKK0vfwcNI2Z0oydsTcrFIGwndhkv821miYvfmhkEANdAL0QXgpMBwdO'

const DRY_RUN = process.argv.includes('--dry-run')

const client = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  token: SANITY_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

// Track new redirects to add
const newRedirects: Array<{ source: string; destination: string; permanent: boolean }> = []

// ── Phase 1: Delete Junk Pages ──────────────────────────────────────────

const PAGES_TO_DELETE = [
  // Junk
  'wp-page-home',
  'wp-page-sample-product',
  // Old WP product category browsing pages (replaced by /products)
  'wp-page-gio-floor-tile-collections',
  'wp-page-gio-glass-tile-collections',
  'wp-page-gio-grip-finish-collections',
  'wp-page-gio-hexagon-tiles',
  'wp-page-gio-mosaic-tile-options',
  'wp-page-gio-natural-stone-products',
  'wp-page-gio-porcelain-pavers',
  'wp-page-gio-subway-tile-collections',
  'wp-page-gio-thin-porcelain',
  'wp-page-gio-tile-collections',
  'wp-page-gio-wall-tile-collections',
  'wp-page-gio-wood-look-tile-collections',
  'wp-page-porcelain-ceramic-products',
]

// Redirect old page slugs to appropriate destinations
const PAGE_REDIRECTS: Record<string, string> = {
  'gio-floor-tile-collections': '/products',
  'gio-glass-tile-collections': '/products',
  'gio-grip-finish-collections': '/products',
  'gio-hexagon-tiles': '/products',
  'gio-mosaic-tile-options': '/products',
  'gio-natural-stone-products': '/products',
  'gio-porcelain-pavers': '/products',
  'gio-subway-tile-collections': '/products',
  'gio-thin-porcelain': '/products',
  'gio-tile-collections': '/products',
  'gio-wall-tile-collections': '/products',
  'gio-wood-look-tile-collections': '/products',
  'porcelain-ceramic-products': '/products',
}

async function deleteJunkPages() {
  console.log('\n═══ Phase 1: Delete Junk Pages ═══')

  for (const id of PAGES_TO_DELETE) {
    const doc = await client.fetch(`*[_id == $id][0]{_id, title, "slug": slug.current}`, { id })
    if (!doc) {
      console.log(`  ⏭  ${id} — not found, skipping`)
      continue
    }

    console.log(`  🗑  Deleting page: "${doc.title}" (${doc.slug})`)

    // Add redirect if we have a mapping
    if (PAGE_REDIRECTS[doc.slug]) {
      newRedirects.push({
        source: `/${doc.slug}`,
        destination: PAGE_REDIRECTS[doc.slug],
        permanent: true,
      })
    }

    if (!DRY_RUN) {
      await client.delete(id)
    }
  }

  const remaining = await client.fetch('count(*[_type == "page"])')
  console.log(`  ✅ Pages remaining: ${remaining}`)
}

// ── Phase 2: Category Consolidation ─────────────────────────────────────

// Map: target category ID → array of source category IDs to merge into it
const CATEGORY_MERGES: Record<string, string[]> = {
  // Design Trends ← Tile Trends, Color Trends
  'wp-category-design-trends': [
    'wp-category-tile-trends',
    'wp-category-color-trends',
    'wp-category-floor-tile',
    'wp-category-wall-tile',
    'wp-category-glass-tile',
  ],
  // Commercial Design (rename from Commercial Design Specifications) ← many commercial subcategories
  'wp-category-commercial-design-specifications': [
    'wp-category-commercial-design',
    'wp-category-workplace-design',
    'wp-category-commercial-construction',
    'wp-category-hospitality-design',
    'wp-category-retail-store-design',
    'wp-category-healthcare-design',
    'wp-category-restaurant-design',
    'wp-category-dormitory-design',
    'wp-category-education-design',
    'wp-category-evidence-based-design',
    'wp-category-library-design',
  ],
  // Company News ← A&D Industry Events
  'wp-category-company-news': ['wp-category-ad-industry-events'],
  // Tile Tips ← Tile Technology, Tile Installations, Interior Tile Installations, Tile Installation Patterns
  'wp-category-tile-tips': [
    'wp-category-tile-technology',
    'wp-category-tile-installations',
    'wp-category-interior-tile-installations',
    'wp-category-tile-installation-patterns',
  ],
  // Sustainable Design ← Wellness Design
  'wp-category-sustainable-design-2': ['wp-category-wellness-design'],
  // Exterior Tile Installations stays as "Outdoor & Exterior"
  // Architecture stays
  // GIO Product Picks stays
}

// Categories to rename after merge
const CATEGORY_RENAMES: Record<string, { title: string; slug: string }> = {
  'wp-category-commercial-design-specifications': {
    title: 'Commercial Design',
    slug: 'commercial-design',
  },
  'wp-category-exterior-tile-installations': {
    title: 'Outdoor & Exterior',
    slug: 'outdoor-exterior',
  },
  'wp-category-sustainable-design-2': {
    title: 'Sustainable Design',
    slug: 'sustainable-design',
  },
  'wp-category-architecture-2': {
    title: 'Architecture',
    slug: 'architecture',
  },
}

// Delete categories with 0 posts that aren't merge targets
const CATEGORIES_TO_DELETE_STANDALONE = ['wp-category-student-housing-design']

async function consolidateCategories() {
  console.log('\n═══ Phase 2: Consolidate Categories ═══')

  // Collect all category IDs being merged away (for deletion later)
  const mergedAwayIds: string[] = []
  const mergedAwaySlugs: Map<string, string> = new Map() // old slug → target slug

  // Process each merge group
  for (const [targetId, sourceIds] of Object.entries(CATEGORY_MERGES)) {
    const target = await client.fetch(`*[_id == $id][0]{_id, title, "slug": slug.current}`, {
      id: targetId,
    })
    if (!target) {
      console.log(`  ⚠️  Target ${targetId} not found, skipping merge group`)
      continue
    }

    // Determine the final slug for the target (after any rename)
    const rename = CATEGORY_RENAMES[targetId]
    const finalSlug = rename?.slug || target.slug

    for (const sourceId of sourceIds) {
      const source = await client.fetch(
        `*[_id == $id][0]{_id, title, "slug": slug.current, wpSlug}`,
        { id: sourceId }
      )
      if (!source) {
        console.log(`  ⏭  Source ${sourceId} not found, skipping`)
        continue
      }

      // Find all posts referencing this source category
      const posts = await client.fetch(
        `*[_type == "post" && references($sourceId)]{_id, title, categories}`,
        { sourceId }
      )

      console.log(
        `  🔀 Merging "${source.title}" (${posts.length} posts) → "${rename?.title || target.title}"`
      )

      if (!DRY_RUN) {
        // Update each post: replace source category ref with target category ref
        for (const post of posts) {
          const updatedCategories = (post.categories || [])
            .map((cat: { _ref: string; _type: string; _key: string }) => {
              if (cat._ref === sourceId) {
                return { ...cat, _ref: targetId }
              }
              return cat
            })
            // Deduplicate — if post already had target category
            .filter(
              (cat: { _ref: string }, index: number, arr: { _ref: string }[]) =>
                arr.findIndex((c) => c._ref === cat._ref) === index
            )

          await client.patch(post._id).set({ categories: updatedCategories }).commit()
        }
      }

      mergedAwayIds.push(sourceId)
      mergedAwaySlugs.set(source.slug, finalSlug)

      // Add redirect for old category archive URL
      newRedirects.push({
        source: `/${source.slug}`,
        destination: `/blog?category=${finalSlug}`,
        permanent: true,
      })
    }
  }

  // Rename categories
  for (const [id, { title, slug }] of Object.entries(CATEGORY_RENAMES)) {
    const existing = await client.fetch(`*[_id == $id][0]{_id, title, "slug": slug.current, wpSlug}`, { id })
    if (!existing) continue

    console.log(`  ✏️  Renaming "${existing.title}" → "${title}" (slug: ${slug})`)

    // Add redirect from old slug if it changed
    if (existing.slug !== slug) {
      newRedirects.push({
        source: `/${existing.slug}`,
        destination: `/blog?category=${slug}`,
        permanent: true,
      })
    }

    if (!DRY_RUN) {
      await client
        .patch(id)
        .set({
          title,
          slug: { _type: 'slug', current: slug },
          // Preserve old WP slug if it exists, otherwise store the old Sanity slug
          wpSlug: existing.wpSlug || existing.slug,
        })
        .commit()
    }
  }

  // Delete merged-away categories
  for (const id of [...mergedAwayIds, ...CATEGORIES_TO_DELETE_STANDALONE]) {
    console.log(`  🗑  Deleting category: ${id}`)
    if (!DRY_RUN) {
      await client.delete(id)
    }
  }

  const remaining = await client.fetch('count(*[_type == "category"])')
  console.log(`  ✅ Categories remaining: ${remaining}`)

  // Log final category breakdown
  const finalCategories = await client.fetch(
    `*[_type == "category"]{title, "slug": slug.current, "postCount": count(*[_type == "post" && references(^._id)])} | order(postCount desc)`
  )
  console.log('\n  📊 Final category breakdown:')
  for (const cat of finalCategories) {
    console.log(`     ${cat.title} (${cat.postCount} posts) — /${cat.slug}`)
  }
}

// ── Phase 3: Tag Pruning ────────────────────────────────────────────────

// Tags to merge: target tag ID → source tag IDs
const TAG_MERGES: Record<string, string[]> = {
  // office-design ← office-design-trends
  'wp-tag-office-design': ['wp-tag-office-design-trends'],
  // wood-look-tile ← wood-tile, faux-wood-tile
  'wp-tag-wood-look-tile': ['wp-tag-wood-tile', 'wp-tag-faux-wood-tile'],
  // hospitality-design-2 ← hotel-design, hotel-design-trends, hotel-lobby-design
  'wp-tag-hospitality-design-2': [
    'wp-tag-hotel-design',
    'wp-tag-hotel-design-trends',
    'wp-tag-hotel-lobby-design',
  ],
  // sustainable-design ← green-design, eco-deisgn, sustainability
  'wp-tag-sustainable-design': [
    'wp-tag-green-design',
    'wp-tag-eco-deisgn',
    'wp-tag-sustainability',
    'wp-tag-sustainable-building-material',
    'wp-tag-sustainable-building-products',
  ],
  // commercial-design ← commercial-design-trends, commercial-interiors, commercial-tile-trends, commercialdesign, selecting-commercia-tile
  'wp-tag-commercial-design': [
    'wp-tag-commercial-design-trends',
    'wp-tag-commercial-interiors',
    'wp-tag-commercial-tile-trends',
    'wp-tag-commercialdesign',
    'wp-tag-selecting-commercia-tile',
  ],
  // interior-design ← interior-design-trends, interiordesign
  'wp-tag-interior-design': ['wp-tag-interior-design-trends', 'wp-tag-interiordesign'],
  // retail-store-design ← retail-design, store-design, pop-up-store
  'wp-tag-retail-store-design': [
    'wp-tag-retail-design',
    'wp-tag-store-design',
    'wp-tag-pop-up-store',
  ],
  // workplace-design-2 ← workspace-design, workplace-deisgn
  'wp-tag-workplace-design-2': ['wp-tag-workspace-design', 'wp-tag-workplace-deisgn'],
  // architecture ← architectural-products, architectural-styles
  'wp-tag-architecture': ['wp-tag-architectural-products', 'wp-tag-architectural-styles'],
  // tile-trends ← design-trends (tag)
  'wp-tag-tile-trends': ['wp-tag-design-trends'],
  // porcelain-tile ← porcelain-wall-tile, porcelain-pavers
  'wp-tag-porcelain-tile': ['wp-tag-porcelain-wall-tile', 'wp-tag-porcelain-pavers'],
  // ceramic-tile ← ceramic-wall-tile, ceramics
  'wp-tag-ceramic-tile': ['wp-tag-ceramic-wall-tile', 'wp-tag-ceramics'],
  // floor-tile ← flooring, floors, tile-flooring
  'wp-tag-floor-tile': ['wp-tag-flooring', 'wp-tag-floors', 'wp-tag-tile-flooring'],
  // wall-tile ← wall-tile-trends
  'wp-tag-wall-tile': ['wp-tag-wall-tile-trends'],
  // healthcare-design-2 ← healthcare-design-trends, healing-environments, evidence-based-design-2, ebd
  'wp-tag-healthcare-design-2': [
    'wp-tag-healthcare-design-trends',
    'wp-tag-healing-environments',
    'wp-tag-evidence-based-design-2',
    'wp-tag-ebd',
  ],
  // restaurant-design-2 ← restaurant-tile, quick-serve, quick-service-restaurants
  'wp-tag-restaurant-design-2': [
    'wp-tag-restaurant-tile',
    'wp-tag-quick-serve',
    'wp-tag-quick-service-restaurants',
  ],
}

// Tags that are too generic or useless — delete outright (remove refs from posts)
const TAGS_TOO_GENERIC = ['wp-tag-design', 'wp-tag-tile', 'wp-tag-tile-design', 'wp-tag-officedesign']

// After merges, delete any tag with postCount < 2 (if not already handled)
const MIN_TAG_POST_COUNT = 2

async function pruneTags() {
  console.log('\n═══ Phase 3: Prune Tags ═══')

  // Collect all tag IDs being merged away
  const mergedAwayTagIds = new Set<string>()

  // 1. Process tag merges
  for (const [targetId, sourceIds] of Object.entries(TAG_MERGES)) {
    const target = await client.fetch(`*[_id == $id][0]{_id, title}`, { id: targetId })
    if (!target) {
      console.log(`  ⏭  Target tag ${targetId} not found`)
      continue
    }

    for (const sourceId of sourceIds) {
      const source = await client.fetch(`*[_id == $id][0]{_id, title}`, { id: sourceId })
      if (!source) continue

      const posts = await client.fetch(`*[_type == "post" && references($id)]{_id, tags}`, {
        id: sourceId,
      })

      if (posts.length > 0) {
        console.log(`  🔀 Merging tag "${source.title}" (${posts.length} posts) → "${target.title}"`)
      }

      if (!DRY_RUN) {
        for (const post of posts) {
          const updatedTags = (post.tags || [])
            .map((tag: { _ref: string; _type: string; _key: string }) => {
              if (tag._ref === sourceId) {
                return { ...tag, _ref: targetId }
              }
              return tag
            })
            .filter(
              (tag: { _ref: string }, index: number, arr: { _ref: string }[]) =>
                arr.findIndex((t) => t._ref === tag._ref) === index
            )

          await client.patch(post._id).set({ tags: updatedTags }).commit()
        }
      }

      mergedAwayTagIds.add(sourceId)
    }
  }

  // 2. Remove generic tags from posts
  for (const tagId of TAGS_TOO_GENERIC) {
    const posts = await client.fetch(`*[_type == "post" && references($id)]{_id, tags}`, {
      id: tagId,
    })
    if (posts.length > 0) {
      console.log(`  🗑  Removing generic tag "${tagId}" from ${posts.length} posts`)
      if (!DRY_RUN) {
        for (const post of posts) {
          const updatedTags = (post.tags || []).filter(
            (tag: { _ref: string }) => tag._ref !== tagId
          )
          await client.patch(post._id).set({ tags: updatedTags }).commit()
        }
      }
    }
    mergedAwayTagIds.add(tagId)
  }

  // 3. Find remaining low-usage tags to delete
  const allTags = await client.fetch(
    `*[_type == "tag"]{_id, title, "slug": slug.current, "postCount": count(*[_type == "post" && references(^._id)])}`
  )

  const tagsToDelete: string[] = []
  for (const tag of allTags) {
    if (mergedAwayTagIds.has(tag._id)) {
      tagsToDelete.push(tag._id)
      continue
    }
    if (tag.postCount < MIN_TAG_POST_COUNT) {
      // Remove this tag's references from posts first
      const posts = await client.fetch(`*[_type == "post" && references($id)]{_id, tags}`, {
        id: tag._id,
      })
      if (posts.length > 0 && !DRY_RUN) {
        for (const post of posts) {
          const updatedTags = (post.tags || []).filter(
            (t: { _ref: string }) => t._ref !== tag._id
          )
          await client.patch(post._id).set({ tags: updatedTags }).commit()
        }
      }
      tagsToDelete.push(tag._id)
    }
  }

  // 4. Delete all pruned tags
  console.log(`  🗑  Deleting ${tagsToDelete.length} tags...`)
  if (!DRY_RUN) {
    // Delete in batches of 50
    for (let i = 0; i < tagsToDelete.length; i += 50) {
      const batch = tagsToDelete.slice(i, i + 50)
      const tx = client.transaction()
      for (const id of batch) {
        tx.delete(id)
      }
      await tx.commit()
    }
  }

  const remaining = await client.fetch('count(*[_type == "tag"])')
  console.log(`  ✅ Tags remaining: ${remaining}`)

  // Log kept tags
  const keptTags = await client.fetch(
    `*[_type == "tag"]{title, "slug": slug.current, "postCount": count(*[_type == "post" && references(^._id)])} | order(postCount desc)`
  )
  console.log('\n  📊 Final tag breakdown:')
  for (const tag of keptTags) {
    console.log(`     ${tag.title} (${tag.postCount} posts)`)
  }
}

// ── Phase 4: Update Redirects ───────────────────────────────────────────

async function updateRedirects() {
  console.log('\n═══ Phase 4: Update Redirects ═══')

  const redirectsPath = path.resolve(__dirname, '../data/redirects.json')
  const existing: Array<{ source: string; destination: string; permanent: boolean }> =
    JSON.parse(fs.readFileSync(redirectsPath, 'utf-8'))

  // Build a set of existing sources to avoid duplicates
  const existingSources = new Set(existing.map((r) => r.source))

  let added = 0
  for (const redirect of newRedirects) {
    if (!existingSources.has(redirect.source)) {
      existing.push(redirect)
      existingSources.add(redirect.source)
      added++
      console.log(`  ➕ ${redirect.source} → ${redirect.destination}`)
    }
  }

  if (!DRY_RUN) {
    fs.writeFileSync(redirectsPath, JSON.stringify(existing, null, 2) + '\n')
  }

  console.log(`  ✅ Added ${added} new redirects (total: ${existing.length})`)
}

// ── Main ────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🔧 Content Reorganization ${DRY_RUN ? '(DRY RUN)' : '(LIVE)'}`)
  console.log('═'.repeat(50))

  // Show current state
  const counts = await client.fetch(`{
    "pages": count(*[_type == "page"]),
    "categories": count(*[_type == "category"]),
    "tags": count(*[_type == "tag"]),
    "posts": count(*[_type == "post"])
  }`)
  console.log(`\n📊 Current state:`)
  console.log(`   Pages: ${counts.pages}`)
  console.log(`   Categories: ${counts.categories}`)
  console.log(`   Tags: ${counts.tags}`)
  console.log(`   Posts: ${counts.posts}`)

  await deleteJunkPages()
  await consolidateCategories()
  await pruneTags()
  await updateRedirects()

  // Final state
  const finalCounts = await client.fetch(`{
    "pages": count(*[_type == "page"]),
    "categories": count(*[_type == "category"]),
    "tags": count(*[_type == "tag"]),
    "posts": count(*[_type == "post"])
  }`)
  console.log(`\n📊 Final state:`)
  console.log(`   Pages: ${finalCounts.pages}`)
  console.log(`   Categories: ${finalCounts.categories}`)
  console.log(`   Tags: ${finalCounts.tags}`)
  console.log(`   Posts: ${finalCounts.posts}`)

  console.log(`\n✅ Reorganization complete${DRY_RUN ? ' (dry run — no changes made)' : ''}!`)
}

main().catch((err) => {
  console.error('❌ Fatal error:', err)
  process.exit(1)
})
