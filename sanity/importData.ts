import { createClient } from '@sanity/client'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import fetch from 'node-fetch'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '6kv11yeo'
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const token = process.env.SANITY_API_TOKEN

if (!token) {
  console.error('Missing SANITY_API_TOKEN environment variable.')
  console.error('Create a write token at https://www.sanity.io/manage and add it to .env.local')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: '2024-03-15',
  useCdn: false,
})

// Helper to slugify a title
function slugify(text: string): string {
  if (!text) return ''
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

// Function to safely upload an image from URL
async function uploadImageFromUrl(url: string) {
  if (!url) return null
  try {
    const response = await fetch(url)
    if (!response.ok) {
      console.warn(`Failed to fetch image: ${url}`)
      return null
    }
    const buffer = await response.buffer()
    const asset = await client.assets.upload('image', buffer, {
      filename: path.basename(new URL(url).pathname)
    })
    return {
      _type: 'image',
      asset: {
        _type: 'reference',
        _ref: asset._id
      }
    }
  } catch (error) {
    console.error(`Error uploading image from ${url}:`, error)
    return null
  }
}

async function main() {
  const dataPath = path.join(__dirname, '../data/collections-complete.json')
  const rawData = fs.readFileSync(dataPath, 'utf-8')
  const collections = JSON.parse(rawData)

  console.log(`Found ${collections.length} collections to import.\n`)

  for (const item of collections) {
    const collectionSlug = slugify(item.slug || item.title)
    if (!collectionSlug) continue
    
    console.log(`Processing collection: ${item.title}`)

    // 1. Upload Hero Image
    let heroImageRef = null
    if (item.heroImage) {
      console.log(`  Uploading hero image...`)
      heroImageRef = await uploadImageFromUrl(item.heroImage)
    }

    // 2. Extract Dropbox Link
    let dropboxUrl = ''
    if (item.downloadLinks && Array.isArray(item.downloadLinks)) {
      const dbLink = item.downloadLinks.find((l: any) => l.label && l.label.toUpperCase() === 'DROPBOX ACCESS')
      if (dbLink) {
        dropboxUrl = dbLink.url
      }
    }

    // 3. Create Collection Document
    const collectionDocId = `collection-${collectionSlug}`
    const collectionDoc = {
      _id: collectionDocId,
      _type: 'collection',
      title: item.title.replace(' - Gio Tile', '').trim(),
      slug: { _type: 'slug', current: collectionSlug },
      description: item.description,
      dropboxUrl: dropboxUrl || undefined,
      heroImages: heroImageRef ? [heroImageRef] : undefined,
    }

    console.log(`  Creating collection document: ${collectionDocId}`)
    await client.createOrReplace(collectionDoc)

    // 4. Create Product Documents
    const productRefs: { _type: 'reference', _key: string, _ref: string }[] = []
    
    if (item.extractedData && item.extractedData.colors && Array.isArray(item.extractedData.colors)) {
      for (let i = 0; i < item.extractedData.colors.length; i++) {
        const colorData = item.extractedData.colors[i]
        const colorName = colorData.name || 'Unnamed'
        const colorSlug = slugify(colorName)

        // Generate a simple color taxonomy document to satisfy the reference constraint
        const colorTaxonomyId = `color-${colorSlug}`
        await client.createIfNotExists({
          _id: colorTaxonomyId,
          _type: 'color',
          title: colorName,
        })

        const productDocId = `product-${collectionSlug}-${colorSlug}`
        const productDoc = {
          _id: productDocId,
          _type: 'product',
          title: colorName,
          slug: { _type: 'slug', current: `${collectionSlug}-${colorSlug}` },
          collection: {
            _type: 'reference',
            _ref: collectionDocId
          },
          colorName: colorName,
          colorFamily: {
            _type: 'reference',
            _ref: colorTaxonomyId
          }
        }

        console.log(`    Creating product document: ${productDocId}`)
        await client.createOrReplace(productDoc)
        
        productRefs.push({
          _type: 'reference',
          _key: `ref-${i}`,
          _ref: productDocId
        })
      }
    }

    // 5. Link Products to Collection
    if (productRefs.length > 0) {
      console.log(`  Linking ${productRefs.length} products to collection`)
      await client.patch(collectionDocId).set({ products: productRefs }).commit()
    }
  }

  console.log('\nImport completed successfully!')
}

main().catch((err) => {
  console.error('Import failed:', err)
  process.exit(1)
})
