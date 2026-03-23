/**
 * GIO Tile Collection Scraper
 *
 * Step 1: Scrapes all product pages from giotile.com
 *   - Extracts: name, slug, description, hero image, spec image
 *   - Downloads spec/color images locally for vision processing
 *
 * Usage: npx tsx scripts/scrape-collections.ts
 */

import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import pLimit from 'p-limit';

const SITEMAP_URL = 'https://www.giotile.com/page-sitemap.xml';
const OUTPUT_DIR = path.join(__dirname, '../data');
const IMAGES_DIR = path.join(OUTPUT_DIR, 'spec-images');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'collections-raw.json');

// Rate limit: 5 concurrent requests to be polite
const limit = pLimit(5);

interface CollectionData {
  slug: string;
  url: string;
  title: string;
  description: string;
  heroImage: string;
  specImage: string;
  specImageLocal: string;
  breadcrumbs: string[];
  downloadLinks: { label: string; url: string }[];
  allImages: string[];
}

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.text();
}

async function getProductUrls(): Promise<string[]> {
  console.log('Fetching sitemap...');
  const xml = await fetchPage(SITEMAP_URL);
  const $ = cheerio.load(xml, { xmlMode: true });

  const urls: string[] = [];
  $('url > loc').each((_, el) => {
    const loc = $(el).text().trim();
    if (loc.includes('/products/') && !loc.endsWith('/products/')) {
      // Skip category/landing pages
      const slug = loc.replace('https://www.giotile.com/products/', '').replace(/\/$/, '');
      const skipSlugs = [
        'porcelain-ceramic-products',
        'gio-tile-collections',
        'gio-floor-tile-collections',
        'gio-wall-tile-collections',
        'gio-glass-tile-collections',
        'gio-mosaic-tile-options',
        'gio-wood-look-tile-collections',
        'gio-porcelain-pavers',
        'geometry-options',
      ];
      if (!skipSlugs.includes(slug)) {
        urls.push(loc);
      }
    }
  });

  console.log(`Found ${urls.length} product pages`);
  return urls;
}

async function scrapeProduct(url: string): Promise<CollectionData | null> {
  try {
    const html = await fetchPage(url);
    const $ = cheerio.load(html);

    const slug = url.replace('https://www.giotile.com/products/', '').replace(/\/$/, '');

    // Extract title - usually in h3 or h1 in the content area
    let title = '';
    const contentArea = $('.entry-content, .post-content, article, .site-content');

    // Try multiple selectors for title
    title = contentArea.find('h3').first().text().trim()
      || contentArea.find('h1').first().text().trim()
      || $('h1.entry-title').text().trim()
      || $('title').text().replace(/ - GIO.*$/, '').trim();

    // Extract description - paragraph text near the title
    let description = '';
    const paragraphs = contentArea.find('p');
    paragraphs.each((_, el) => {
      const text = $(el).text().trim();
      // Skip empty, very short, or download-related text
      if (text.length > 20 && !text.includes('DOWNLOAD') && !text.includes('download') && !description) {
        description = text;
      }
    });

    // Extract breadcrumbs
    const breadcrumbs: string[] = [];
    $('nav a, .breadcrumb a, [class*="breadcrumb"] a').each((_, el) => {
      breadcrumbs.push($(el).text().trim());
    });

    // Extract all images
    const allImages: string[] = [];
    const heroImages: string[] = [];
    const specImages: string[] = [];

    $('img').each((_, el) => {
      let src = $(el).attr('src') || $(el).attr('data-src') || '';
      if (!src || src.includes('logo') || src.includes('GIO_LOGO') || src.includes('GIO-Logo')) return;
      if (src.includes('gravatar') || src.includes('facebook') || src.includes('twitter')) return;
      if (src.includes('icon') || src.includes('emoji')) return;

      // Get full-size URL (WordPress often appends dimensions)
      src = src.replace(/-\d+x\d+\./, '.');

      if (!allImages.includes(src)) {
        allImages.push(src);

        // Classify images
        const lower = src.toLowerCase();
        if (lower.includes('color') || lower.includes('spec') || lower.includes('screen-shot') || lower.includes('swatch')) {
          specImages.push(src);
        } else {
          heroImages.push(src);
        }
      }
    });

    // Also check for background images in style attributes
    $('[style*="background"]').each((_, el) => {
      const style = $(el).attr('style') || '';
      const match = style.match(/url\(['"]?(.*?)['"]?\)/);
      if (match && match[1] && !allImages.includes(match[1])) {
        allImages.push(match[1]);
      }
    });

    // Extract download links
    const downloadLinks: { label: string; url: string }[] = [];
    $('a').each((_, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim();
      if (
        (text.toLowerCase().includes('download') || text.toLowerCase().includes('dropbox')) &&
        href && href !== '#'
      ) {
        downloadLinks.push({ label: text, url: href });
      }
    });

    // Best guess for hero vs spec image
    const heroImage = heroImages[0] || allImages[0] || '';
    // The spec/color image is usually the second image, or one with 'color'/'spec' in the name
    const specImage = specImages[0] || allImages[1] || '';

    const specImageLocal = specImage
      ? `spec-images/${slug}.jpg`
      : '';

    console.log(`  ✓ ${title || slug}`);

    return {
      slug,
      url,
      title,
      description,
      heroImage,
      specImage,
      specImageLocal,
      breadcrumbs,
      downloadLinks,
      allImages,
    };
  } catch (err) {
    console.error(`  ✗ Failed: ${url} - ${(err as Error).message}`);
    return null;
  }
}

async function downloadImage(url: string, filepath: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });
    if (!res.ok) return false;

    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(filepath, buffer);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  // Create output directories
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(IMAGES_DIR, { recursive: true });

  // Get all product URLs
  const urls = await getProductUrls();

  // Scrape all pages
  console.log('\nScraping product pages...');
  const results = await Promise.all(
    urls.map(url => limit(() => scrapeProduct(url)))
  );

  const collections = results.filter((r): r is CollectionData => r !== null);

  // Save raw JSON
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(collections, null, 2));
  console.log(`\nSaved ${collections.length} collections to ${OUTPUT_FILE}`);

  // Download spec images
  console.log('\nDownloading spec/color images...');
  let downloaded = 0;
  let skipped = 0;

  await Promise.all(
    collections.map(c => limit(async () => {
      if (!c.specImage) {
        skipped++;
        return;
      }

      const ext = path.extname(new URL(c.specImage).pathname) || '.jpg';
      const filepath = path.join(IMAGES_DIR, `${c.slug}${ext}`);
      c.specImageLocal = `spec-images/${c.slug}${ext}`;

      const ok = await downloadImage(c.specImage, filepath);
      if (ok) {
        downloaded++;
        console.log(`  ✓ ${c.slug}${ext}`);
      } else {
        console.log(`  ✗ Failed: ${c.slug}`);
      }
    }))
  );

  // Update JSON with corrected local paths
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(collections, null, 2));

  console.log(`\nDone!`);
  console.log(`  Collections scraped: ${collections.length}`);
  console.log(`  Spec images downloaded: ${downloaded}`);
  console.log(`  No spec image found: ${skipped}`);
  console.log(`\nNext step: Run scripts/extract-specs.ts to process images with Claude Vision`);
}

main().catch(console.error);
