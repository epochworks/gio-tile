/**
 * GIO Tile - Download product images from Dropbox and upload to Sanity
 *
 * Phase 1: Scrape Dropbox URLs from live site, save to Sanity
 * Phase 2: Download ZIP files from Dropbox, extract images
 * Phase 3: Match images to products by color name, upload to Sanity
 *
 * Usage:
 *   npx tsx scripts/download-product-images.ts              # Run all phases
 *   npx tsx scripts/download-product-images.ts --phase=1    # Scrape Dropbox URLs
 *   npx tsx scripts/download-product-images.ts --phase=2    # Download & extract ZIPs
 *   npx tsx scripts/download-product-images.ts --phase=3    # Match & upload to Sanity
 */

import { createClient } from '@sanity/client';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// ─── Config ─────────────────────────────────────────────

const PROJECT_ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(PROJECT_ROOT, 'data');
const PRODUCT_IMAGES_DIR = path.join(DATA_DIR, 'product-images');
const DROPBOX_URLS_FILE = path.join(DATA_DIR, 'dropbox-urls.json');

const client = createClient({
  projectId: '6kv11yeo',
  dataset: 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
});

// ─── Helpers ────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalize(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/** Extract ZIP to a target directory, using /tmp as staging to avoid path issues */
function extractZip(zipPath: string, outputDir: string): number {
  const tmpExtract = `/tmp/gio-extract-${Date.now()}`;
  ensureDir(tmpExtract);
  ensureDir(outputDir);

  try {
    execSync(`/usr/bin/unzip -o -j "${zipPath}" -d "${tmpExtract}" 2>/dev/null || true`, {
      timeout: 120000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Copy image files to output dir, skip junk
    const files = fs.readdirSync(tmpExtract);
    let count = 0;
    for (const f of files) {
      if (f.startsWith('.') || f.startsWith('__') || !/\.(jpe?g|png|webp|tiff?)$/i.test(f)) continue;
      const src = path.join(tmpExtract, f);
      const dest = path.join(outputDir, f);
      fs.copyFileSync(src, dest);
      count++;
    }

    return count;
  } finally {
    // Clean up tmp dir
    fs.rmSync(tmpExtract, { recursive: true, force: true });
    // Clean up ZIP
    if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
  }
}

// ─── Phase 1: Scrape Dropbox URLs ───────────────────────

async function phase1() {
  console.log('\n' + '='.repeat(60));
  console.log('PHASE 1: Scrape Dropbox URLs from live site');
  console.log('='.repeat(60) + '\n');

  // Fetch all collections from Sanity
  const collections: Array<{
    _id: string;
    title: string;
    slug: string;
    dropboxUrl: string | null;
  }> = await client.fetch(
    `*[_type=="collection"]{_id, title, "slug": slug.current, dropboxUrl}`
  );

  console.log(`Found ${collections.length} collections in Sanity\n`);

  const dropboxMap: Record<string, string> = {};
  let scraped = 0;
  let alreadyHad = 0;
  let notFound = 0;

  for (const col of collections) {
    if (!col.slug) continue;

    // If already has a dropbox URL, just record it
    if (col.dropboxUrl) {
      dropboxMap[col.slug] = col.dropboxUrl;
      alreadyHad++;
      console.log(`  * ${col.slug} — already has URL`);
      continue;
    }

    // Scrape the live site
    const pageUrl = `https://www.giotile.com/products/${col.slug}/`;
    console.log(`  > Scraping ${pageUrl}...`);

    try {
      const response = await fetch(pageUrl);
      if (!response.ok) {
        console.log(`    SKIP — HTTP ${response.status}`);
        notFound++;
        await sleep(1000);
        continue;
      }

      const html = await response.text();

      // Look for Dropbox links in href attributes
      const dropboxRegex = /href=["'](https?:\/\/(?:www\.)?dropbox\.com\/[^"']+)["']/gi;
      const matches: string[] = [];
      let match;
      while ((match = dropboxRegex.exec(html)) !== null) {
        matches.push(match[1]);
      }

      if (matches.length > 0) {
        // Take the first Dropbox link (usually the folder link)
        const dropboxUrl = matches[0].replace(/&amp;/g, '&');
        dropboxMap[col.slug] = dropboxUrl;
        scraped++;
        console.log(`    FOUND: ${dropboxUrl.substring(0, 80)}...`);

        // Save back to Sanity
        try {
          await client.patch(col._id).set({ dropboxUrl }).commit();
          console.log(`    Saved to Sanity`);
        } catch (e: any) {
          console.log(`    WARNING: Could not save to Sanity: ${e.message?.substring(0, 80)}`);
        }
      } else {
        notFound++;
        console.log(`    No Dropbox link found`);
      }
    } catch (e: any) {
      notFound++;
      console.log(`    ERROR: ${e.message?.substring(0, 80)}`);
    }

    // Rate limiting delay
    await sleep(2000);
  }

  // Save mapping file
  ensureDir(DATA_DIR);
  fs.writeFileSync(DROPBOX_URLS_FILE, JSON.stringify(dropboxMap, null, 2));

  console.log(`\n${'─'.repeat(40)}`);
  console.log(`Phase 1 complete!`);
  console.log(`  Already had URL: ${alreadyHad}`);
  console.log(`  Newly scraped:   ${scraped}`);
  console.log(`  Not found:       ${notFound}`);
  console.log(`  Saved to: ${DROPBOX_URLS_FILE}`);
}

// ─── Phase 2: Download images from Dropbox ──────────────

async function phase2() {
  console.log('\n' + '='.repeat(60));
  console.log('PHASE 2: Download images from Dropbox');
  console.log('='.repeat(60) + '\n');

  if (!fs.existsSync(DROPBOX_URLS_FILE)) {
    console.log('ERROR: dropbox-urls.json not found. Run --phase=1 first.');
    return;
  }

  const dropboxMap: Record<string, string> = JSON.parse(
    fs.readFileSync(DROPBOX_URLS_FILE, 'utf-8')
  );

  ensureDir(PRODUCT_IMAGES_DIR);

  const slugs = Object.keys(dropboxMap);
  console.log(`Found ${slugs.length} collections with Dropbox URLs\n`);

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const slug of slugs) {
    const outputDir = path.join(PRODUCT_IMAGES_DIR, slug);

    // Skip if already downloaded
    if (fs.existsSync(outputDir) && fs.readdirSync(outputDir).length > 0) {
      const fileCount = fs.readdirSync(outputDir).filter((f) =>
        /\.(jpe?g|png|webp|tiff?)$/i.test(f)
      ).length;
      if (fileCount > 0) {
        console.log(`  * ${slug} — already downloaded (${fileCount} images)`);
        skipped++;
        continue;
      }
    }

    let dropboxUrl = dropboxMap[slug];

    // Clean HTML entities in URL (&#038; → &)
    dropboxUrl = dropboxUrl.replace(/&#0?38;/g, '&');

    // Convert shared link to direct download (ZIP)
    // For folder links: set dl=1 to force download
    let downloadUrl = dropboxUrl;
    // Remove any existing dl param first
    downloadUrl = downloadUrl.replace(/[?&]dl=[01]/g, '');
    // Add dl=1
    if (downloadUrl.includes('?')) {
      downloadUrl += '&dl=1';
    } else {
      downloadUrl += '?dl=1';
    }

    console.log(`  > Downloading ${slug}...`);
    console.log(`    URL: ${downloadUrl.substring(0, 80)}...`);

    // Use /tmp for ZIP to avoid path-with-spaces issues with unzip
    const zipPath = path.join('/tmp', `gio-${slug}.zip`);

    try {
      const response = await fetch(downloadUrl, {
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        },
      });

      if (!response.ok) {
        console.log(`    FAILED — HTTP ${response.status}`);
        failed++;
        await sleep(3000);
        continue;
      }

      const contentType = response.headers.get('content-type') || '';
      const buffer = Buffer.from(await response.arrayBuffer());

      // If we got HTML back, Dropbox may need a different URL format
      if (contentType.includes('text/html') && buffer.length < 500000) {
        console.log(`    Got HTML response (${(buffer.length / 1024).toFixed(0)} KB). Trying alternate URL...`);

        // Try dl.dropboxusercontent.com domain
        const altUrl = dropboxUrl.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace(/[?&]dl=[01]/, '');
        try {
          const altResponse = await fetch(altUrl, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' } });
          if (altResponse.ok) {
            const altBuffer = Buffer.from(await altResponse.arrayBuffer());
            const altIsZip = altBuffer[0] === 0x50 && altBuffer[1] === 0x4b;
            if (altIsZip) {
              fs.writeFileSync(zipPath, altBuffer);
              console.log(`    Downloaded ZIP via alt URL (${(altBuffer.length / 1024 / 1024).toFixed(1)} MB)`);
              const imgCount = extractZip(zipPath, outputDir);
              console.log(`    Extracted ${imgCount} images`);
              downloaded++;
              await sleep(3000);
              continue;
            }
          }
        } catch {}

        console.log(`    FAILED — Could not download from Dropbox`);
        failed++;
        await sleep(3000);
        continue;
      }

      if (buffer.length < 1000) {
        console.log(`    FAILED — Response too small (${buffer.length} bytes), likely an error page`);
        failed++;
        await sleep(3000);
        continue;
      }

      // Check if it's a ZIP (starts with PK magic bytes)
      const isZip = buffer[0] === 0x50 && buffer[1] === 0x4b;

      if (isZip) {
        // Save ZIP and extract using helper (stages through /tmp)
        fs.writeFileSync(zipPath, buffer);
        console.log(`    Downloaded ZIP (${(buffer.length / 1024 / 1024).toFixed(1)} MB)`);

        try {
          const imageCount = extractZip(zipPath, outputDir);
          console.log(`    Extracted ${imageCount} images`);
          downloaded++;
        } catch (e: any) {
          console.log(`    FAILED to extract: ${e.message?.substring(0, 80)}`);
          failed++;
          if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
        }
      } else if (
        contentType.includes('image/') ||
        /\.(jpe?g|png|webp)$/i.test(dropboxUrl)
      ) {
        // Single image file
        ensureDir(outputDir);
        const ext = contentType.includes('png') ? '.png' : '.jpg';
        const filename = `${slug}${ext}`;
        fs.writeFileSync(path.join(outputDir, filename), buffer);
        console.log(`    Downloaded single image (${(buffer.length / 1024).toFixed(0)} KB)`);
        downloaded++;
      } else {
        // Try treating as ZIP anyway (Dropbox sometimes doesn't set content-type right)
        fs.writeFileSync(zipPath, buffer);
        try {
          const imageCount = extractZip(zipPath, outputDir);
          if (imageCount > 0) {
            console.log(`    Extracted ${imageCount} images (from untyped response)`);
            downloaded++;
          } else {
            console.log(`    FAILED — No images in download`);
            failed++;
          }
        } catch {
          console.log(`    FAILED — Unknown content type: ${contentType}, size: ${buffer.length}`);
          failed++;
          if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
        }
      }
    } catch (e: any) {
      console.log(`    ERROR: ${e.message?.substring(0, 100)}`);
      failed++;
    }

    // Rate limiting delay
    await sleep(3000);
  }

  console.log(`\n${'─'.repeat(40)}`);
  console.log(`Phase 2 complete!`);
  console.log(`  Downloaded: ${downloaded}`);
  console.log(`  Skipped:    ${skipped}`);
  console.log(`  Failed:     ${failed}`);
}

// ─── Phase 3: Match and upload to Sanity ────────────────

async function phase3() {
  console.log('\n' + '='.repeat(60));
  console.log('PHASE 3: Match images to products and upload to Sanity');
  console.log('='.repeat(60) + '\n');

  if (!fs.existsSync(PRODUCT_IMAGES_DIR)) {
    console.log('ERROR: product-images directory not found. Run --phase=2 first.');
    return;
  }

  // Get all collections from Sanity
  const collections: Array<{
    _id: string;
    title: string;
    slug: string;
  }> = await client.fetch(
    `*[_type=="collection"]{_id, title, "slug": slug.current}`
  );

  const collectionsBySlug = new Map(collections.map((c) => [c.slug, c]));

  // Get all downloaded collection slugs
  const downloadedSlugs = fs
    .readdirSync(PRODUCT_IMAGES_DIR)
    .filter((f) => {
      const dir = path.join(PRODUCT_IMAGES_DIR, f);
      return fs.statSync(dir).isDirectory();
    });

  console.log(`Found ${downloadedSlugs.length} collections with downloaded images\n`);

  let totalMatched = 0;
  let totalUnmatched = 0;
  let totalUploaded = 0;
  let totalSkipped = 0;
  const unmatchedLog: Array<{ slug: string; filename: string }> = [];

  for (const slug of downloadedSlugs) {
    const collection = collectionsBySlug.get(slug);
    if (!collection) {
      console.log(`  ? ${slug} — collection not found in Sanity, skipping`);
      continue;
    }

    const imageDir = path.join(PRODUCT_IMAGES_DIR, slug);
    const imageFiles = fs
      .readdirSync(imageDir)
      .filter((f) => /\.(jpe?g|png|webp|tiff?)$/i.test(f) && !f.startsWith('.'));

    if (imageFiles.length === 0) {
      console.log(`  - ${slug} — no images`);
      continue;
    }

    // Get products for this collection
    const products: Array<{
      _id: string;
      colorName: string;
      title: string;
      images: any[] | null;
    }> = await client.fetch(
      `*[_type=="product" && references($collectionId)]{_id, colorName, title, images}`,
      { collectionId: collection._id }
    );

    if (products.length === 0) {
      console.log(`  - ${slug} — no products in Sanity`);
      // Log all images as unmatched
      for (const file of imageFiles) {
        unmatchedLog.push({ slug, filename: file });
      }
      totalUnmatched += imageFiles.length;
      continue;
    }

    console.log(`  > ${slug}: ${imageFiles.length} images, ${products.length} products`);

    // Normalize collection title for stripping from filenames
    const collectionNorm = normalize(collection.title);

    // Build normalized product map
    const productMap = products.map((p) => ({
      ...p,
      normalizedColor: normalize(p.colorName),
    }));

    // Match images to products
    for (const file of imageFiles) {
      const fileBase = path.parse(file).name;
      let fileNorm = normalize(fileBase);

      // Strip collection name from filename if present
      if (fileNorm.startsWith(collectionNorm)) {
        fileNorm = fileNorm.substring(collectionNorm.length);
      }
      // Also try stripping common prefixes like "gio_" etc
      fileNorm = fileNorm.replace(/^gio/, '');

      // Try to find a matching product
      let bestMatch: (typeof productMap)[0] | null = null;
      let bestScore = 0;

      for (const product of productMap) {
        const colorNorm = product.normalizedColor;

        // Exact match after normalization
        if (fileNorm === colorNorm) {
          bestMatch = product;
          bestScore = 100;
          break;
        }

        // File contains the color name
        if (fileNorm.includes(colorNorm) && colorNorm.length > 2) {
          const score = (colorNorm.length / fileNorm.length) * 90;
          if (score > bestScore) {
            bestMatch = product;
            bestScore = score;
          }
        }

        // Color name contains the file (for short filenames)
        if (colorNorm.includes(fileNorm) && fileNorm.length > 2) {
          const score = (fileNorm.length / colorNorm.length) * 80;
          if (score > bestScore) {
            bestMatch = product;
            bestScore = score;
          }
        }

        // Try matching individual words
        const colorWords = product.colorName.toLowerCase().split(/[\s_-]+/).filter(w => w.length > 2);
        const fileWords = fileBase.toLowerCase().split(/[\s_-]+/).filter(w => w.length > 2);
        const matchingWords = colorWords.filter(cw =>
          fileWords.some(fw => fw.includes(cw) || cw.includes(fw))
        );
        if (matchingWords.length > 0 && matchingWords.length >= colorWords.length * 0.5) {
          const score = (matchingWords.length / colorWords.length) * 70;
          if (score > bestScore) {
            bestMatch = product;
            bestScore = score;
          }
        }
      }

      if (bestMatch && bestScore >= 30) {
        totalMatched++;

        // Check if product already has images
        if (bestMatch.images && bestMatch.images.length > 0) {
          console.log(
            `    = ${file} -> ${bestMatch.colorName} (already has images, skipping)`
          );
          totalSkipped++;
          continue;
        }

        // Upload to Sanity
        const filePath = path.join(imageDir, file);
        try {
          const buffer = fs.readFileSync(filePath);
          const asset = await client.assets.upload('image', buffer, {
            filename: file,
          });

          const imageRef = {
            _type: 'image',
            _key: `img-${Date.now()}`,
            asset: { _type: 'reference', _ref: asset._id },
          };

          await client.patch(bestMatch._id).set({ images: [imageRef] }).commit();

          totalUploaded++;
          console.log(`    + ${file} -> ${bestMatch.colorName}`);
        } catch (e: any) {
          console.log(
            `    ! ${file} -> ${bestMatch.colorName} UPLOAD FAILED: ${e.message?.substring(0, 60)}`
          );
        }

        // Small delay between uploads
        await sleep(500);
      } else {
        totalUnmatched++;
        unmatchedLog.push({ slug, filename: file });
        console.log(`    ? ${file} — no match found`);
      }
    }
  }

  // Save unmatched log
  if (unmatchedLog.length > 0) {
    const unmatchedFile = path.join(DATA_DIR, 'unmatched-product-images.json');
    fs.writeFileSync(unmatchedFile, JSON.stringify(unmatchedLog, null, 2));
    console.log(`\n  Unmatched images log: ${unmatchedFile}`);
  }

  console.log(`\n${'─'.repeat(40)}`);
  console.log(`Phase 3 complete!`);
  console.log(`  Matched:    ${totalMatched}`);
  console.log(`  Uploaded:   ${totalUploaded}`);
  console.log(`  Skipped:    ${totalSkipped} (already had images)`);
  console.log(`  Unmatched:  ${totalUnmatched}`);
}

// ─── Main ───────────────────────────────────────────────

async function main() {
  console.log('GIO Tile - Product Image Downloader\n');

  if (!process.env.SANITY_API_TOKEN) {
    // Try loading from .env.local
    const envPath = path.join(PROJECT_ROOT, '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      const tokenMatch = envContent.match(/SANITY_API_TOKEN=(.+)/);
      if (tokenMatch) {
        process.env.SANITY_API_TOKEN = tokenMatch[1].trim();
        // Recreate client with token
        (client as any).config({ token: process.env.SANITY_API_TOKEN });
      }
    }
  }

  // Parse --phase flag
  const phaseArg = process.argv.find((a) => a.startsWith('--phase='));
  const phase = phaseArg ? parseInt(phaseArg.split('=')[1], 10) : null;

  if (phase === 1 || !phase) {
    await phase1();
  }
  if (phase === 2 || !phase) {
    await phase2();
  }
  if (phase === 3 || !phase) {
    await phase3();
  }

  console.log('\nDone!');
}

main().catch(console.error);
