/**
 * Backfill product finishes/sizes from extracted spec data.
 *
 * The original import created one product per color but only gave each
 * product a single SKU/size. The extracted data has ALL SKUs per color
 * (different sizes + finishes). This script adds the missing ones.
 */
import { createClient } from '@sanity/client'
import * as fs from 'fs'
import * as path from 'path'

const client = createClient({
  projectId: '6kv11yeo',
  dataset: 'production',
  apiVersion: '2024-03-15',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN || 'skjBBxKzhOiNUrGjMNwflpPvMIN455xbyiMYgIuxOdztNNy2djId32Fy9fs4GOvmyuaYpM1UkBMzeI5PB6k9LwGF97K1cHu8vjuxePWKfOTzbVK81qggFmMtOkG9hKK0vfwcNI2Z0oydsTcrFIGwndhkv821miYvfmhkEANdAL0QXgpMBwdO',
})

// Parse size from SKU code
function parseSizeFromSku(sku: string): string | null {
  // Common patterns:
  // GISER4848DG -> 48"x48"
  // GISER2448DG -> 24"x48"
  // GISER1224DG -> 12"x24"
  // GISER2424DG -> 24"x24"
  // GISERMOSDG -> Mosaic (skip)
  // GISER324BNDG -> 3"x24" Bullnose (skip trim pieces)

  if (!sku) return null
  // Skip mosaics and trim
  if (/MOS|BN|BULL|TRIM/i.test(sku)) return null

  // Try to find 4-digit size pattern (e.g., 2448 = 24x48)
  const match4 = sku.match(/(\d{2})(\d{2})(?=[A-Z]|$)/)
  if (match4) {
    const w = parseInt(match4[1])
    const h = parseInt(match4[2])
    if (w > 0 && h > 0 && w <= 60 && h <= 60) {
      return `${w}x${h}`
    }
  }

  // Try 3-digit (e.g., 624 = 6x24)
  const match3 = sku.match(/(\d)(\d{2})(?=[A-Z]|$)/)
  if (match3) {
    const w = parseInt(match3[1])
    const h = parseInt(match3[2])
    if (w > 0 && h > 0 && w <= 12 && h <= 48) {
      return `${w}x${h}`
    }
  }

  return null
}

// Normalize color names for matching
function normalizeColor(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '')
}

async function main() {
  // Load extracted data
  const dataPath = path.join(process.cwd(), 'data/collections-complete.json')
  const collections = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))

  // Get all Sanity collections with products
  const sanityCollections = await client.fetch(`*[_type == "collection"]{
    _id, title, "slug": slug.current,
    "products": products[]->{
      _id, title, colorName,
      finishes[]{_key, type, skus[]{_key, code, size, sizeType}}
    }
  }`)

  let updated = 0
  let skipped = 0

  for (const sc of sanityCollections) {
    // Find matching extracted data
    const extracted = collections.find(
      (c: any) => c.slug === sc.slug || c.slug === sc.slug?.replace(/-by-gio$/, '')
    )
    if (!extracted?.extractedData?.colors) {
      skipped++
      continue
    }

    const extractedColors = extracted.extractedData.colors

    // Group extracted colors by normalized name
    const colorGroups: Record<string, { skus: string[]; finishes: string[]; sizes: string[] }> = {}
    for (const ec of extractedColors) {
      const norm = normalizeColor(ec.name)
      if (!colorGroups[norm]) {
        colorGroups[norm] = { skus: [], finishes: [], sizes: [] }
      }
      colorGroups[norm].skus.push(ec.sku)
      if (ec.finish && !colorGroups[norm].finishes.includes(ec.finish)) {
        colorGroups[norm].finishes.push(ec.finish)
      }
      const size = parseSizeFromSku(ec.sku)
      if (size && !colorGroups[norm].sizes.includes(size)) {
        colorGroups[norm].sizes.push(size)
      }
    }

    // Update each product
    for (const product of sc.products || []) {
      if (!product?._id) continue
      const norm = normalizeColor(product.colorName || '')
      const group = colorGroups[norm]
      if (!group || group.sizes.length <= 1) continue

      // Build finishes array with all SKUs grouped by finish type
      const finishMap: Record<string, { skus: { code: string; size: string }[] }> = {}
      for (const ec of extractedColors) {
        if (normalizeColor(ec.name) !== norm) continue
        const finishName = ec.finish || 'Field Tile'
        if (!finishMap[finishName]) finishMap[finishName] = { skus: [] }
        const size = parseSizeFromSku(ec.sku)
        // Include all SKUs - both with parsed sizes and without
        finishMap[finishName].skus.push({
          code: ec.sku,
          size: size || '',
        })
      }

      // Build the finishes array
      const finishes = Object.entries(finishMap).map(([finishName, data], fi) => ({
        _key: `finish-backfill-${fi}`,
        _type: 'finishVariant',
        skus: data.skus.map((s, si) => ({
          _key: `sku-backfill-${fi}-${si}`,
          _type: 'sku',
          code: s.code,
          size: s.size,
        })),
      }))

      // Only update if we have more sizes than current
      const currentSizes = new Set<string>()
      ;(product.finishes || []).forEach((f: any) =>
        (f.skus || []).forEach((s: any) => {
          if (s.size) currentSizes.add(s.size)
        })
      )

      if (group.sizes.length > currentSizes.size) {
        try {
          await client.patch(product._id).set({ finishes }).commit()
          updated++
          console.log(`  ✓ ${sc.title} / ${product.colorName}: ${currentSizes.size} → ${group.sizes.length} sizes (${group.sizes.join(', ')})`)
        } catch (e: any) {
          console.error(`  ✗ ${product._id}: ${e.message}`)
        }
      }
    }
  }

  console.log(`\nDone! Updated: ${updated}, Skipped: ${skipped}`)
}

main().catch(console.error)
