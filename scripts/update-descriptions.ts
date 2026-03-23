import { createClient } from '@sanity/client';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

const client = createClient({
  projectId: '6kv11yeo',
  dataset: 'production',
  token: 'skjBBxKzhOiNUrGjMNwflpPvMIN455xbyiMYgIuxOdztNNy2djId32Fy9fs4GOvmyuaYpM1UkBMzeI5PB6k9LwGF97K1cHu8vjuxePWKfOTzbVK81qggFmMtOkG9hKK0vfwcNI2Z0oydsTcrFIGwndhkv821miYvfmhkEANdAL0QXgpMBwdO',
  apiVersion: '2024-01-01',
  useCdn: false,
});

const DATA_DIR = path.join(process.cwd(), 'data');

function fetchPage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function extractDescription(html: string): string | null {
  // The description is typically in a <p> tag right after the <h3> title
  // Look for text between the title area and the first image
  
  // Try to find content between entry-content and the first img
  const entryMatch = html.match(/class="entry-content"[^>]*>([\s\S]*?)<\/div>/);
  if (entryMatch) {
    const content = entryMatch[1];
    // Find paragraph text that's not breadcrumbs
    const pMatches = content.match(/<p[^>]*>(.*?)<\/p>/g);
    if (pMatches) {
      for (const p of pMatches) {
        const text = p.replace(/<[^>]+>/g, '').trim();
        if (text && !text.startsWith('Home') && !text.includes('DOWNLOAD') && text.length > 20) {
          return text;
        }
      }
    }
  }
  
  // Fallback: look for og:description meta tag
  const ogMatch = html.match(/property="og:description"\s+content="([^"]+)"/);
  if (ogMatch) {
    const desc = ogMatch[1].trim();
    if (!desc.startsWith('Home') && desc.length > 20) {
      return desc;
    }
  }
  
  // Fallback: meta description
  const metaMatch = html.match(/name="description"\s+content="([^"]+)"/);
  if (metaMatch) {
    const desc = metaMatch[1].trim();
    if (!desc.startsWith('Home') && desc.length > 20) {
      return desc;
    }
  }
  
  return null;
}

async function main() {
  const collections = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, 'collections-complete.json'), 'utf-8')
  );

  console.log(`Processing ${collections.length} collections...\n`);

  let updated = 0;
  let descFound = 0;

  for (const col of collections) {
    const ed = col.extractedData || {};
    const ts = ed.technicalSpecs || {};
    const slug = col.slug;
    const collectionId = `collection-${slug}`;

    // Check if this collection exists in Sanity
    const exists = await client.fetch('*[_id == $id][0] {_id, title}', { id: collectionId });
    if (!exists) continue;

    const updates: any = {};

    // 1. Build technicalSummary from extracted data
    const parts: string[] = [];
    if (ts.material) parts.push(ts.material);
    
    const title = col.title || '';
    if (title.includes('Floor') && title.includes('Wall')) {
      parts.push('Floor & Wall Tile');
    } else if (title.includes('Wall')) {
      parts.push('Wall Tile');
    } else if (title.includes('Floor')) {
      parts.push('Floor Tile');
    }
    
    if (ts.sizes && ts.sizes.length > 0) {
      parts.push(ts.sizes.join(' | '));
    }
    
    if (parts.length > 0) {
      updates.technicalSummary = parts.join(' · ');
    }

    // 2. Fetch actual description from the live page
    try {
      const html = await fetchPage(col.url);
      const desc = extractDescription(html);
      if (desc) {
        updates.description = desc;
        descFound++;
      }
    } catch (e) {
      // Skip if fetch fails
    }

    // 3. Apply updates
    if (Object.keys(updates).length > 0) {
      await client.patch(collectionId).set(updates).commit();
      updated++;
      const summary = updates.technicalSummary ? `summary: "${updates.technicalSummary.substring(0, 50)}"` : '';
      const desc = updates.description ? `desc: "${updates.description.substring(0, 40)}..."` : '';
      console.log(`  ✓ ${exists.title}: ${[summary, desc].filter(Boolean).join(' | ')}`);
    }

    // Rate limit
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\nDone! Updated ${updated} collections, found ${descFound} descriptions.`);
}

main().catch(console.error);
