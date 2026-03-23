import { createClient } from '@sanity/client';
import * as fs from 'fs';
import * as path from 'path';

const client = createClient({
  projectId: '6kv11yeo',
  dataset: 'production',
  token: 'skjBBxKzhOiNUrGjMNwflpPvMIN455xbyiMYgIuxOdztNNy2djId32Fy9fs4GOvmyuaYpM1UkBMzeI5PB6k9LwGF97K1cHu8vjuxePWKfOTzbVK81qggFmMtOkG9hKK0vfwcNI2Z0oydsTcrFIGwndhkv821miYvfmhkEANdAL0QXgpMBwdO',
  apiVersion: '2024-01-01',
  useCdn: false,
});

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const DATA_DIR = path.join(process.cwd(), 'data');
const missingSlugs = ['midtown-by-gio', 'progetto-by-gio', 'royale-by-gio', 'zellige-by-gio'];

async function uploadImage(filepath: string, filename: string): Promise<any> {
  const buffer = fs.readFileSync(filepath);
  const asset = await client.assets.upload('image', buffer, { filename });
  return {
    _type: 'image',
    asset: { _type: 'reference', _ref: asset._id },
  };
}

async function main() {
  const collections = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'collections-complete.json'), 'utf-8'));
  const heroMap = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'hero-image-map.json'), 'utf-8'));
  
  const missing = collections.filter((c: any) => missingSlugs.includes(c.slug));
  
  for (const col of missing) {
    const ed = col.extractedData;
    const collectionId = `collection-${col.slug}`;
    const collectionTitle = (col.title || col.slug)
      .replace(/ by GIO.*$/i, '')
      .replace(/ - Gio Tile$/i, '')
      .replace(/Floor & Wall Tile$/i, '')
      .replace(/Floor &\u00a0Wall Tile$/i, '')
      .replace(/Wall Tile$/i, '')
      .replace(/Floor Tile$/i, '')
      .trim();

    const collectionDoc: any = {
      _id: collectionId,
      _type: 'collection',
      title: collectionTitle,
      slug: { _type: 'slug', current: col.slug },
    };

    if (ed) {
      const specs = ed.technicalSpecs || {};
      if (specs.usage) {
        collectionDoc.surfaces = specs.usage.filter((u: string) =>
          ['Floor', 'Wall', 'Countertop', 'Outdoor'].includes(u)
        );
      }
    }

    // Upload hero image if local file exists
    const heroInfo = heroMap[col.slug];
    if (heroInfo && heroInfo.heroImage) {
      const heroPath = path.join(DATA_DIR, heroInfo.heroImage);
      if (fs.existsSync(heroPath)) {
        try {
          const heroAsset = await uploadImage(heroPath, `${col.slug}-hero`);
          collectionDoc.heroImages = [{ ...heroAsset, _key: 'hero-0' }];
          console.log(`  📷 Hero image uploaded for ${collectionTitle}`);
        } catch (e: any) {
          console.log(`  ⚠ Hero failed: ${e.message?.substring(0, 80)}`);
        }
      }
    }

    await client.createOrReplace(collectionDoc);
    console.log(`✓ Imported: ${collectionTitle} (${col.slug})`);

    // Create products for colors
    if (ed?.colors) {
      for (let i = 0; i < ed.colors.length; i++) {
        const color = ed.colors[i];
        if (!color.name) continue;
        const productId = `product-${col.slug}-${slugify(color.name)}-${i}`;
        await client.createOrReplace({
          _id: productId,
          _type: 'product',
          title: color.name.charAt(0).toUpperCase() + color.name.slice(1).toLowerCase(),
          slug: { _type: 'slug', current: `${col.slug}-${slugify(color.name)}-${i}` },
          collection: { _type: 'reference', _ref: collectionId },
          colorName: color.name.charAt(0).toUpperCase() + color.name.slice(1).toLowerCase(),
        });
        console.log(`  + Product: ${color.name}`);
      }
    }
  }
  console.log('\nDone!');
}

main().catch(console.error);
