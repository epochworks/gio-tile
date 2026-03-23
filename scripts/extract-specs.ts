/**
 * GIO Tile Spec Image Extractor
 *
 * Step 2: Processes downloaded spec images through Claude Vision API
 * to extract structured product data (colors, SKUs, sizes, specs).
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-ant-... npx tsx scripts/extract-specs.ts
 *
 * Cost estimate: ~137 images × ~$0.02-0.04 each ≈ $3-5 total
 */

import * as fs from 'fs';
import * as path from 'path';
import pLimit from 'p-limit';

const DATA_DIR = path.join(__dirname, '../data');
const RAW_FILE = path.join(DATA_DIR, 'collections-raw.json');
const OUTPUT_FILE = path.join(DATA_DIR, 'collections-complete.json');
const IMAGES_DIR = path.join(DATA_DIR, 'spec-images');

// Process 1 at a time to stay within rate limits
const limit = pLimit(1);

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) {
  console.error('Error: Set ANTHROPIC_API_KEY environment variable');
  console.error('Usage: ANTHROPIC_API_KEY=sk-ant-... npx tsx scripts/extract-specs.ts');
  process.exit(1);
}

interface ColorVariant {
  name: string;
  sku: string;
  finish?: string;
}

interface TechnicalSpecs {
  material?: string;
  sizes?: string[];
  thickness?: string;
  finish?: string;
  rating?: string;
  waterAbsorption?: string;
  rectified?: boolean;
  madeIn?: string;
  usage?: string[];
}

interface PackagingInfo {
  nominalSize?: string;
  piecesPerBox?: number;
  sqftPerBox?: number;
  boxesPerPallet?: number;
  sqftPerPallet?: number;
  weightPerPallet?: string;
}

interface ExtractedData {
  colors: ColorVariant[];
  technicalSpecs: TechnicalSpecs;
  packaging: PackagingInfo;
  applications?: string[];
  shadeVariation?: string;
}

function getMediaType(filepath: string): 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' {
  const ext = path.extname(filepath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  return 'image/jpeg';
}

async function extractFromImage(imagePath: string, collectionName: string): Promise<ExtractedData | null> {
  if (!fs.existsSync(imagePath)) return null;

  const imageData = fs.readFileSync(imagePath);
  const base64 = imageData.toString('base64');
  const mediaType = getMediaType(imagePath);

  // Skip very small images (likely not spec sheets)
  if (imageData.length < 10000) {
    console.log(`  ⊘ Skipping ${collectionName} (image too small, likely not a spec sheet)`);
    return null;
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64,
              },
            },
            {
              type: 'text',
              text: `This is a product spec sheet for "${collectionName}" tile collection by GIO. Extract ALL structured data visible in this image. Return ONLY valid JSON with this structure (omit fields if not visible):

{
  "colors": [
    { "name": "Color Name", "sku": "SKU_CODE", "finish": "Matte/Bright/etc" }
  ],
  "technicalSpecs": {
    "material": "Porcelain/Ceramic/Glass/etc",
    "sizes": ["12x24", "6x6"],
    "thickness": "10mm",
    "finish": "Matte",
    "rating": "V2",
    "waterAbsorption": "<0.5%",
    "rectified": true,
    "madeIn": "Italy",
    "usage": ["Floor", "Wall", "Commercial"]
  },
  "packaging": {
    "nominalSize": "12x24",
    "piecesPerBox": 6,
    "sqftPerBox": 11.63,
    "boxesPerPallet": 48,
    "sqftPerPallet": 558,
    "weightPerPallet": "2150 lbs"
  },
  "applications": ["Residential", "Commercial", "Industrial"],
  "shadeVariation": "V2"
}

Be thorough - extract every color variant, every SKU, every spec you can read. Return ONLY the JSON, no explanation.`,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error(`  ✗ API error for ${collectionName}: ${response.status} - ${err}`);
    return null;
  }

  const result = await response.json() as any;
  const text = result.content?.[0]?.text || '';

  try {
    // Extract JSON from response (handle potential markdown wrapping)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error(`  ✗ No JSON in response for ${collectionName}`);
      return null;
    }
    return JSON.parse(jsonMatch[0]) as ExtractedData;
  } catch {
    console.error(`  ✗ Invalid JSON for ${collectionName}`);
    return null;
  }
}

async function main() {
  // Load existing results to resume from where we left off
  let existingData: any[] = [];
  if (fs.existsSync(OUTPUT_FILE)) {
    existingData = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
  }
  const alreadyDone = new Set(
    existingData
      .filter((c: any) => c.extractedData !== null && c.extractedData !== undefined)
      .map((c: any) => c.slug)
  );

  const rawData = JSON.parse(fs.readFileSync(RAW_FILE, 'utf-8'));
  const needsProcessing = rawData.filter(
    (c: any) => c.specImageLocal && !alreadyDone.has(c.slug)
  );

  console.log(`Total: ${rawData.length} collections`);
  console.log(`Already done: ${alreadyDone.size}`);
  console.log(`Remaining: ${needsProcessing.length}\n`);

  let processed = 0;
  let failed = 0;

  // Build results map from existing data
  const resultsMap = new Map<string, any>();
  for (const item of existingData) {
    resultsMap.set(item.slug, item);
  }

  // Process remaining one at a time with delay
  for (const collection of needsProcessing) {
    const imagePath = path.join(DATA_DIR, collection.specImageLocal);
    const extracted = await extractFromImage(imagePath, collection.title || collection.slug);

    if (extracted) {
      processed++;
      console.log(
        `  ✓ ${collection.title || collection.slug} — ${extracted.colors?.length || 0} colors`
      );
      resultsMap.set(collection.slug, { ...collection, extractedData: extracted });
    } else {
      failed++;
      // Keep raw data for failed ones
      if (!resultsMap.has(collection.slug)) {
        resultsMap.set(collection.slug, { ...collection, extractedData: null });
      }
    }

    // Save progress after each successful extraction
    if (processed % 5 === 0) {
      const allResults = rawData.map((c: any) => resultsMap.get(c.slug) || { ...c, extractedData: null });
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allResults, null, 2));
    }

    // Wait 10 seconds between requests to respect rate limits
    await sleep(10000);
  }

  // Final save
  const allResults = rawData.map((c: any) => resultsMap.get(c.slug) || { ...c, extractedData: null });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allResults, null, 2));

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Done!`);
  console.log(`  Newly extracted: ${processed}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Previously done: ${alreadyDone.size}`);
  console.log(`  Total complete: ${alreadyDone.size + processed}/${rawData.length}`);
  console.log(`  Output: ${OUTPUT_FILE}`);
}

main().catch(console.error);
