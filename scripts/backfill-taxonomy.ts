/**
 * Taxonomy Backfill Script
 *
 * Populates look, style, and material fields on all 135 collections using:
 * 1. WordPress index page data (curated collection-to-category mappings)
 * 2. Collection title and description heuristics
 * 3. Existing Sanity data (technicalSummary, material field)
 *
 * Usage:
 *   npx tsx scripts/backfill-taxonomy.ts              # Live run + review report
 *   npx tsx scripts/backfill-taxonomy.ts --dry-run     # Preview changes only
 *   npx tsx scripts/backfill-taxonomy.ts --report-only  # Generate review JSON only
 */

import { createClient } from '@sanity/client'
import * as fs from 'fs'
import * as path from 'path'
import * as cheerio from 'cheerio'

// ── Config ──────────────────────────────────────────────────────────────

const SANITY_PROJECT_ID = '6kv11yeo'
const SANITY_DATASET = 'production'
const SANITY_TOKEN =
  process.env.SANITY_TOKEN ||
  'skjBBxKzhOiNUrGjMNwflpPvMIN455xbyiMYgIuxOdztNNy2djId32Fy9fs4GOvmyuaYpM1UkBMzeI5PB6k9LwGF97K1cHu8vjuxePWKfOTzbVK81qggFmMtOkG9hKK0vfwcNI2Z0oydsTcrFIGwndhkv821miYvfmhkEANdAL0QXgpMBwdO'

const DRY_RUN = process.argv.includes('--dry-run')
const REPORT_ONLY = process.argv.includes('--report-only')

const client = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  token: SANITY_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

// ── Step 1: Parse WP XML for collection-to-category mappings ────────────

interface WpCategoryMapping {
  [slug: string]: string[] // WP page slug → collection names found on that page
}

function parseWpIndexPages(): WpCategoryMapping {
  const xmlPath = path.resolve(__dirname, '../giotile.WordPress.2026-03-23.xml')

  // Try alternate path if not found
  let xml: string
  try {
    xml = fs.readFileSync(xmlPath, 'utf-8')
  } catch {
    const altPath = path.resolve(__dirname, '../../giotile.WordPress.2026-03-23.xml')
    try {
      xml = fs.readFileSync(altPath, 'utf-8')
    } catch {
      console.log('  ⚠️  WordPress XML not found, using heuristics only')
      return {}
    }
  }

  const pageRegex = /<item>[\s\S]*?<\/item>/g
  const items = xml.match(pageRegex) || []

  const targetSlugs = [
    'gio-wood-look-tile-collections',
    'gio-glass-tile-collections',
    'gio-natural-stone-products',
    'gio-subway-tile-collections',
    'gio-hexagon-tiles',
    'gio-mosaic-tile-options',
    'gio-porcelain-pavers',
    'gio-grip-finish-collections',
    'gio-thin-porcelain',
  ]

  const results: WpCategoryMapping = {}

  for (const item of items) {
    const slugMatch = item.match(/<wp:post_name><!\[CDATA\[(.*?)\]\]>/)
    const typeMatch = item.match(/<wp:post_type><!\[CDATA\[(.*?)\]\]>/)
    if (!slugMatch || !typeMatch || typeMatch[1] !== 'page') continue
    const slug = slugMatch[1]
    if (!targetSlugs.includes(slug)) continue

    const contentMatch = item.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/)
    if (!contentMatch) continue

    const $ = cheerio.load(contentMatch[1])
    const collections: string[] = []

    $('.builder-gallery-title').each(function () {
      const name = $(this).text().trim()
      if (name) collections.push(name)
    })

    results[slug] = collections
  }

  return results
}

// ── Step 2: Build name-to-slug normalization ────────────────────────────

function normalizeForMatch(name: string): string {
  return name
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// ── Step 3: Define heuristic rules ──────────────────────────────────────

// Look mapping: collection name/description keywords → look name
const LOOK_RULES: Array<{ match: RegExp; look: string; matchFields: ('title' | 'description' | 'technicalSummary')[] }> = [
  // Marble looks
  { match: /\b(marble|marmi|calacatta|carrara|statuarietto|arabescato|breccia|onyx|verde.?alpi|rosata|taj|royale|canela|reale|bianca|contempo|renoir)\b/i, look: 'Marble', matchFields: ['title', 'description'] },
  // Wood looks
  { match: /\b(wood|barnwood|tigerwood|petrified|parquet|timber|plank.*wood|wood.*plank|atelier|bergen|fountaine|modern|neolith|select|umber|versailles)\b/i, look: 'Wood', matchFields: ['title'] },
  { match: /\bwood.?look\b/i, look: 'Wood', matchFields: ['description', 'technicalSummary'] },
  // Stone looks
  { match: /\b(stone|basaltina|cardoso|petra|bluestone|sabbiosa|jura|linea|granello|shell|simplestone|stoneline|mosa|salento|emilia|corton|mirabella|luce|essentials|mural|trevizo|blendstone|padana)\b/i, look: 'Stone', matchFields: ['title'] },
  { match: /\b(limestone|granite|basalt)\b/i, look: 'Stone', matchFields: ['description'] },
  // Slate looks
  { match: /\b(slate|ardosia|montauk)\b/i, look: 'Slate', matchFields: ['title', 'description'] },
  // Cement/Concrete looks
  { match: /\b(cemento|cement|cotto.?cemento|chalk|midtown|veneto|fusion|mix|progetto|coccio|ceppo)\b/i, look: 'Cement', matchFields: ['title'] },
  { match: /\b(concrete|cement)\b.*\blook\b/i, look: 'Cement', matchFields: ['description'] },
  // Terrazzo
  { match: /\bterrazzo\b/i, look: 'Terrazzo', matchFields: ['title', 'description'] },
  // Metal
  { match: /\b(metallo|alloy|metal)\b/i, look: 'Metal', matchFields: ['title'] },
  // Travertine
  { match: /\b(dorato|rapolano|maximus|travertine)\b/i, look: 'Travertine', matchFields: ['title'] },
  { match: /\btravertine\b/i, look: 'Travertine', matchFields: ['description'] },
  // Brick
  { match: /\bbrick\b/i, look: 'Brick', matchFields: ['title'] },
  // Fabric/Textile
  { match: /\b(linen|plush|fabric|textile)\b/i, look: 'Fabric', matchFields: ['title'] },
  // Quartzite
  { match: /\b(quartzite|quarzo)\b/i, look: 'Quartzite', matchFields: ['title'] },
  // Onyx
  { match: /\b(onyx|agata)\b/i, look: 'Onyx', matchFields: ['title'] },
  // Limestone (more specific than stone)
  { match: /\blimestone\b/i, look: 'Limestone', matchFields: ['description'] },
  // Concrete
  { match: /\bconcrete\b/i, look: 'Concrete', matchFields: ['description'] },
]

// Style mapping
const STYLE_RULES: Array<{ match: RegExp; style: string; matchFields: ('title' | 'description' | 'technicalSummary')[] }> = [
  // Subway
  { match: /\b(subway|acqua|antico|art[eé]|artisan|barista|chroma|colorplay|handmade|naxos|neo.?brick|nuance|pastel|shades|zellige|fio)\b/i, style: 'Subway', matchFields: ['title'] },
  // Hexagonal
  { match: /\b(hex|hexagon)\b/i, style: 'Hexagonal', matchFields: ['title'] },
  { match: /\bgeometry.?hex\b/i, style: 'Hexagonal', matchFields: ['title'] },
  // Mosaic
  { match: /\bgeometry.?(squared|pennyround|options)\b/i, style: 'Mosaic', matchFields: ['title'] },
  { match: /\bpebbles\b/i, style: 'Mosaic', matchFields: ['title'] },
  // Picket
  { match: /\bpicket\b/i, style: 'Picket', matchFields: ['title'] },
  { match: /\bgeometry.?picket\b/i, style: 'Picket', matchFields: ['title'] },
  // Penny Round
  { match: /\bpenny.?round\b/i, style: 'Penny Round', matchFields: ['title'] },
  // Plank (wood-look planks)
  { match: /\b(plank|6x24|6x36|8x36|8x40|8x48|10x60|12x48|3x18)\b/i, style: 'Plank', matchFields: ['technicalSummary'] },
  // Large Format
  { match: /\b(48x48|48x110|60x120|slab|macro|large.?format)\b/i, style: 'Large Format', matchFields: ['title', 'technicalSummary'] },
  // Rectangular (brick formats)
  { match: /\bbrick\b/i, style: 'Rectangular', matchFields: ['title'] },
  // Square (standard square formats)
  { match: /\b(24x24|12x12)\b/i, style: 'Square', matchFields: ['technicalSummary'] },
  // 3D / Dimensional
  { match: /\b(3d|dimensional|ridges|rigato|curve)\b/i, style: '3D / Dimensional', matchFields: ['title'] },
  // Geometric
  { match: /\b(mia|geometric|pattern)\b/i, style: 'Geometric', matchFields: ['title'] },
  // Chevron
  { match: /\bchevron\b/i, style: 'Chevron', matchFields: ['title', 'description'] },
]

// Material mapping
function inferMaterial(collection: SanityCollection): string[] {
  const text = `${collection.title} ${collection.description || ''} ${collection.technicalSummary || ''} ${collection.material || ''}`.toLowerCase()

  // Check for Glass
  if (/\bglass\b/.test(text) && !/porcelain/.test(text)) return ['Glass']
  if (collection.title.match(/crystal.?glass|glass.?&.?stone|reflections|vitro/i)) return ['Glass']

  // Check for Natural Stone
  if (/\bnatural.?stone\b/.test(text)) return ['Natural Stone']
  if (collection.title.match(/^(pebbles|pietra.?marmi|3d.?pietra)/i)) return ['Natural Stone']

  // Check for Ceramic
  if (/\bceramic\b/.test(text) && !/porcelain/.test(text)) return ['Ceramic']
  if (collection.title.match(/^(acqua|rena|zellige|curve|ridges|rigato)/i)) return ['Ceramic']

  // Check for Metal
  if (collection.title.match(/^(metallo|alloy)/i)) return ['Porcelain'] // Metal-look porcelain

  // Default to Porcelain
  return ['Porcelain']
}

// ── Types ───────────────────────────────────────────────────────────────

interface SanityCollection {
  _id: string
  title: string
  slug: string
  description: string | null
  technicalSummary: string | null
  material: string | null
  surfaces: string[] | null
  look: string | null
  style: string | null
}

interface TaxonomyDoc {
  _id: string
  title: string
  slug: string
}

interface Assignment {
  title: string
  slug: string
  look: string | null
  style: string | null
  material: string[]
  lookSource: string
  styleSource: string
  materialSource: string
}

// ── Main ────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🔧 Taxonomy Backfill ${DRY_RUN ? '(DRY RUN)' : REPORT_ONLY ? '(REPORT ONLY)' : '(LIVE)'}\n`)

  // Step 1: Parse WP XML
  console.log('📖 Parsing WordPress XML for category mappings...')
  const wpMappings = parseWpIndexPages()
  for (const [slug, collections] of Object.entries(wpMappings)) {
    console.log(`   ${slug}: ${collections.length} collections`)
  }

  // Build normalized name → WP category map
  const wpCategoryForCollection = new Map<string, string[]>()
  const categoryMap: Record<string, string> = {
    'gio-wood-look-tile-collections': 'wood-look',
    'gio-glass-tile-collections': 'glass',
    'gio-natural-stone-products': 'natural-stone',
    'gio-subway-tile-collections': 'subway',
    'gio-hexagon-tiles': 'hexagon',
    'gio-mosaic-tile-options': 'mosaic',
    'gio-porcelain-pavers': 'paver',
    'gio-grip-finish-collections': 'grip',
    'gio-thin-porcelain': 'thin-porcelain',
  }

  for (const [wpSlug, names] of Object.entries(wpMappings)) {
    const category = categoryMap[wpSlug]
    if (!category) continue
    for (const name of names) {
      const norm = normalizeForMatch(name)
      const existing = wpCategoryForCollection.get(norm) || []
      existing.push(category)
      wpCategoryForCollection.set(norm, existing)
    }
  }

  // Step 2: Fetch taxonomy docs from Sanity
  console.log('\n📦 Fetching Sanity taxonomy documents...')
  const [looks, styles, collections] = await Promise.all([
    client.fetch<TaxonomyDoc[]>('*[_type == "look"]{_id, title, "slug": slug.current}'),
    client.fetch<TaxonomyDoc[]>('*[_type == "style"]{_id, title, "slug": slug.current}'),
    client.fetch<SanityCollection[]>(
      '*[_type == "collection"]{_id, title, "slug": slug.current, description, technicalSummary, material, surfaces, "look": look->title, "style": style->title} | order(title asc)'
    ),
  ])

  console.log(`   ${looks.length} looks, ${styles.length} styles, ${collections.length} collections`)

  // Build lookup maps
  const lookByName = new Map(looks.map((l) => [l.title.toLowerCase(), l]))
  const styleByName = new Map(styles.map((s) => [s.title.toLowerCase(), s]))

  // Step 3: Determine assignments for each collection
  console.log('\n🔍 Analyzing collections...\n')
  const assignments: Assignment[] = []
  let lookCount = 0
  let styleCount = 0
  let materialCount = 0

  for (const collection of collections) {
    const normTitle = normalizeForMatch(collection.title)
    const wpCategories = wpCategoryForCollection.get(normTitle) || []

    let assignedLook: string | null = null
    let lookSource = ''
    let assignedStyle: string | null = null
    let styleSource = ''

    // Check WP categories first
    for (const cat of wpCategories) {
      if (cat === 'wood-look' && !assignedLook) {
        assignedLook = 'Wood'
        lookSource = 'wp-page'
      }
      if (cat === 'natural-stone' && !assignedLook) {
        assignedLook = 'Stone'
        lookSource = 'wp-page'
      }
      if (cat === 'subway' && !assignedStyle) {
        assignedStyle = 'Subway'
        styleSource = 'wp-page'
      }
      if (cat === 'hexagon' && !assignedStyle) {
        assignedStyle = 'Hexagonal'
        styleSource = 'wp-page'
      }
      if (cat === 'mosaic' && !assignedStyle) {
        assignedStyle = 'Mosaic'
        styleSource = 'wp-page'
      }
      if (cat === 'paver' && !assignedStyle) {
        assignedStyle = 'Large Format'
        styleSource = 'wp-page'
      }
    }

    // Apply heuristic rules if no WP match
    if (!assignedLook) {
      for (const rule of LOOK_RULES) {
        for (const field of rule.matchFields) {
          const value = field === 'title' ? collection.title : field === 'description' ? collection.description : collection.technicalSummary
          if (value && rule.match.test(value)) {
            assignedLook = rule.look
            lookSource = `heuristic:${field}`
            break
          }
        }
        if (assignedLook) break
      }
    }

    if (!assignedStyle) {
      for (const rule of STYLE_RULES) {
        for (const field of rule.matchFields) {
          const value = field === 'title' ? collection.title : field === 'description' ? collection.description : collection.technicalSummary
          if (value && rule.match.test(value)) {
            assignedStyle = rule.style
            styleSource = `heuristic:${field}`
            break
          }
        }
        if (assignedStyle) break
      }
    }

    // Use existing values if already set
    if (collection.look) {
      assignedLook = collection.look
      lookSource = 'existing'
    }
    if (collection.style) {
      assignedStyle = collection.style
      styleSource = 'existing'
    }

    // Material inference
    const assignedMaterial = inferMaterial(collection)
    const materialSource = wpCategories.includes('glass') ? 'wp-page' : wpCategories.includes('natural-stone') ? 'wp-page' : 'heuristic'

    if (assignedLook) lookCount++
    if (assignedStyle) styleCount++
    materialCount++

    assignments.push({
      title: collection.title,
      slug: collection.slug,
      look: assignedLook,
      style: assignedStyle,
      material: assignedMaterial,
      lookSource,
      styleSource,
      materialSource,
    })

    // Log assignment
    const lookStr = assignedLook ? `${assignedLook} (${lookSource})` : '—'
    const styleStr = assignedStyle ? `${assignedStyle} (${styleSource})` : '—'
    console.log(`  ${collection.title}`)
    console.log(`    Look: ${lookStr} | Style: ${styleStr} | Material: ${assignedMaterial.join(', ')}`)
  }

  console.log(`\n📊 Coverage:`)
  console.log(`   Look:     ${lookCount}/${collections.length} (${Math.round((lookCount / collections.length) * 100)}%)`)
  console.log(`   Style:    ${styleCount}/${collections.length} (${Math.round((styleCount / collections.length) * 100)}%)`)
  console.log(`   Material: ${materialCount}/${collections.length} (${Math.round((materialCount / collections.length) * 100)}%)`)

  // Step 4: Generate review report
  const reportPath = path.resolve(__dirname, '../data/taxonomy-review.json')
  fs.writeFileSync(reportPath, JSON.stringify(assignments, null, 2) + '\n')
  console.log(`\n📝 Review report saved to data/taxonomy-review.json`)

  if (REPORT_ONLY) {
    console.log('\n✅ Report generated (no changes made)')
    return
  }

  // Step 5: Apply updates to Sanity
  console.log(`\n${DRY_RUN ? '🔍 Would apply' : '✏️  Applying'} updates to Sanity...\n`)

  let updated = 0
  let skipped = 0

  for (const assignment of assignments) {
    const collection = collections.find((c) => c.slug === assignment.slug)
    if (!collection) continue

    const patch: Record<string, unknown> = {}

    // Set look if we have one and it changed
    if (assignment.look && assignment.look !== collection.look) {
      const lookDoc = lookByName.get(assignment.look.toLowerCase())
      if (lookDoc) {
        patch.look = { _type: 'reference', _ref: lookDoc._id }
      } else {
        console.log(`  ⚠️  Look "${assignment.look}" not found in Sanity for ${collection.title}`)
      }
    }

    // Set style if we have one and it changed
    if (assignment.style && assignment.style !== collection.style) {
      const styleDoc = styleByName.get(assignment.style.toLowerCase())
      if (styleDoc) {
        patch.style = { _type: 'reference', _ref: styleDoc._id }
      } else {
        console.log(`  ⚠️  Style "${assignment.style}" not found in Sanity for ${collection.title}`)
      }
    }

    // Set material
    if (assignment.material.length > 0) {
      patch.material = assignment.material
    }

    if (Object.keys(patch).length === 0) {
      skipped++
      continue
    }

    if (!DRY_RUN) {
      await client.patch(collection._id).set(patch).commit()
    }
    updated++
  }

  console.log(`\n✅ Updated: ${updated}, Skipped: ${skipped}`)
  console.log(`${DRY_RUN ? '(Dry run — no changes made)' : 'Done!'}`)
}

main().catch((err) => {
  console.error('❌ Fatal error:', err)
  process.exit(1)
})
