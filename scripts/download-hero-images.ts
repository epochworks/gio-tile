/**
 * Downloads hero/room scene images for all collections.
 * Maps each image to its collection slug.
 * Safe to run alongside extract-specs.ts (writes to separate directory).
 *
 * Usage: npx tsx scripts/download-hero-images.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(__dirname, '../data');
const RAW_FILE = path.join(DATA_DIR, 'collections-raw.json');
const HERO_DIR = path.join(DATA_DIR, 'hero-images');
const MAP_FILE = path.join(DATA_DIR, 'hero-image-map.json');

function getExtension(url: string): string {
  const match = url.match(/\.(jpe?g|png|webp|gif)/i);
  return match ? match[0].toLowerCase() : '.jpg';
}

async function downloadImage(url: string, filepath: string): Promise<boolean> {
  try {
    const response = await fetch(url);
    if (!response.ok) return false;
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(filepath, buffer);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const rawData = JSON.parse(fs.readFileSync(RAW_FILE, 'utf-8'));

  if (!fs.existsSync(HERO_DIR)) {
    fs.mkdirSync(HERO_DIR, { recursive: true });
  }

  const imageMap: Record<string, { heroImage: string; allImages: string[] }> = {};
  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const collection of rawData) {
    const slug = collection.slug;
    const heroUrl = collection.heroImage;

    if (!heroUrl) {
      skipped++;
      continue;
    }

    const ext = getExtension(heroUrl);
    const filename = `${slug}${ext}`;
    const filepath = path.join(HERO_DIR, filename);

    // Skip if already downloaded
    if (fs.existsSync(filepath)) {
      imageMap[slug] = {
        heroImage: `hero-images/${filename}`,
        allImages: (collection.allImages || []).map((img: any) => img.url || img),
      };
      console.log(`  ○ ${slug} (already exists)`);
      downloaded++;
      continue;
    }

    const success = await downloadImage(heroUrl, filepath);
    if (success) {
      downloaded++;
      imageMap[slug] = {
        heroImage: `hero-images/${filename}`,
        allImages: (collection.allImages || []).map((img: any) => img.url || img),
      };
      console.log(`  ✓ ${slug}`);
    } else {
      failed++;
      console.log(`  ✗ ${slug} — failed to download`);
    }
  }

  // Save the mapping file
  fs.writeFileSync(MAP_FILE, JSON.stringify(imageMap, null, 2));

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Done!`);
  console.log(`  Downloaded: ${downloaded}`);
  console.log(`  Skipped (no URL): ${skipped}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Image map: ${MAP_FILE}`);
}

main().catch(console.error);
