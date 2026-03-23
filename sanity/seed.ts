import { createClient } from '@sanity/client'

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
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

// --- Taxonomy Data ---

const colors = [
  { title: 'Grey', hex: '#808080' },
  { title: 'Beige', hex: '#C8B89A' },
  { title: 'White', hex: '#FFFFFF' },
]

const finishes = ['Matte', 'Polished']

const styles = ['Large Format', 'Mosaic', 'Hexagonal', 'Subway', 'Plank']

const looks = ['Stone', 'Wood', 'Concrete', 'Metal', 'Marble', 'Terrazzo']

const sizeTypes = ['Field Tile', 'Wall Tile', 'Bullnose', 'Mosaic', 'Paver']

// --- Seed Functions ---

async function seedColors() {
  console.log('\nSeeding Colors...')
  for (const color of colors) {
    const id = `color-${slugify(color.title)}`
    const doc = {
      _id: id,
      _type: 'color' as const,
      title: color.title,
      hex: color.hex,
    }
    const result = await client.createIfNotExists(doc)
    console.log(`  ✓ ${result.title} (${color.hex})`)
  }
}

async function seedFinishes() {
  console.log('\nSeeding Finishes...')
  for (const title of finishes) {
    const id = `finish-${slugify(title)}`
    const doc = {
      _id: id,
      _type: 'finish' as const,
      title,
    }
    const result = await client.createIfNotExists(doc)
    console.log(`  ✓ ${result.title}`)
  }
}

async function seedStyles() {
  console.log('\nSeeding Styles...')
  for (const title of styles) {
    const slug = slugify(title)
    const id = `style-${slug}`
    const doc = {
      _id: id,
      _type: 'style' as const,
      title,
      slug: { _type: 'slug' as const, current: slug },
    }
    const result = await client.createIfNotExists(doc)
    console.log(`  ✓ ${result.title}`)
  }
}

async function seedLooks() {
  console.log('\nSeeding Looks...')
  for (const title of looks) {
    const slug = slugify(title)
    const id = `look-${slug}`
    const doc = {
      _id: id,
      _type: 'look' as const,
      title,
      slug: { _type: 'slug' as const, current: slug },
    }
    const result = await client.createIfNotExists(doc)
    console.log(`  ✓ ${result.title}`)
  }
}

async function seedSizeTypes() {
  console.log('\nSeeding Size Types...')
  for (const title of sizeTypes) {
    const id = `sizetype-${slugify(title)}`
    const doc = {
      _id: id,
      _type: 'sizeType' as const,
      title,
    }
    const result = await client.createIfNotExists(doc)
    console.log(`  ✓ ${result.title}`)
  }
}

async function main() {
  console.log(`Seeding taxonomy data into Sanity (${projectId} / ${dataset})...\n`)

  await seedColors()
  await seedFinishes()
  await seedStyles()
  await seedLooks()
  await seedSizeTypes()

  console.log('\nDone! All taxonomy data has been seeded.')
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
