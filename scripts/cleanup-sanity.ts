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

async function uploadImage(filepath: string, filename: string): Promise<any> {
  const buffer = fs.readFileSync(filepath);
  const asset = await client.assets.upload('image', buffer, { filename });
  return { _type: 'image', asset: { _type: 'reference', _ref: asset._id } };
}

const DATA_DIR = path.join(process.cwd(), 'data');

async function main() {
  console.log('=== SANITY CLEANUP ===\n');

  // 1. Delete duplicates — keep the one with more products
  console.log('1. Removing duplicates...');
  
  // Delete the draft
  await client.delete('drafts.collection-absolute-by-gio-2');
  console.log('  ✓ Deleted draft: drafts.collection-absolute-by-gio-2');
  
  // Absolute: keep collection-absolute-by-gio-2 (has slug absolute-by-gio-2), delete if there's another
  // Actually both Absolutes have 0 products, keep the one with the cleaner slug
  // Let's check what exists
  const absolutes = await client.fetch('*[_type == "collection" && title == "Absolute"] {_id, slug, "pc": count(products)}');
  console.log('  Absolutes:', JSON.stringify(absolutes));
  // Keep the non-draft one
  
  // Cemento: keep collection-cemento (24 products), delete 9f3ef70b (1 product)
  try {
    // First delete the product that references the old cemento
    const oldCementoProducts = await client.fetch('*[_type == "product" && references("9f3ef70b-abfb-4b98-a3ff-ee8e6afcd82e")] {_id}');
    for (const p of oldCementoProducts) {
      await client.delete(p._id);
      console.log(`  ✓ Deleted orphan product: ${p._id}`);
    }
    await client.delete('9f3ef70b-abfb-4b98-a3ff-ee8e6afcd82e');
    console.log('  ✓ Deleted duplicate Cemento: 9f3ef70b');
  } catch (e: any) {
    console.log(`  ⚠ Cemento cleanup: ${e.message?.substring(0, 80)}`);
  }
  
  // Vintage: keep collection-vintage-by-gio-2 (9 products), delete collection-vintage-by-gio (0 products)
  try {
    await client.delete('collection-vintage-by-gio');
    console.log('  ✓ Deleted duplicate Vintage: collection-vintage-by-gio');
  } catch (e: any) {
    console.log(`  ⚠ Vintage cleanup: ${e.message?.substring(0, 80)}`);
  }

  // 2. Fix collections with no products
  console.log('\n2. Adding products to empty collections...');
  
  const collections = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'collections-complete.json'), 'utf-8'));
  const heroMap = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'hero-image-map.json'), 'utf-8'));
  
  // Get all collections with no products
  const emptyCols = await client.fetch('*[_type == "collection" && (!defined(products) || count(products) == 0)] {_id, title, slug}');
  
  for (const emptyCol of emptyCols) {
    if (emptyCol._id.startsWith('drafts.')) continue;
    
    const slug = emptyCol.slug?.current;
    if (!slug) continue;
    
    // Find matching data in JSON
    const jsonData = collections.find((c: any) => c.slug === slug);
    if (!jsonData) {
      console.log(`  ⚠ No JSON data for: ${emptyCol.title} (${slug})`);
      continue;
    }
    
    const ed = jsonData.extractedData;
    if (!ed || !ed.colors || ed.colors.length === 0) {
      console.log(`  ⚠ No color data for: ${emptyCol.title} (${slug})`);
      continue;
    }
    
    // Upload hero image if missing
    const existingDoc = await client.fetch('*[_id == $id][0] {heroImages}', { id: emptyCol._id });
    if (!existingDoc?.heroImages || existingDoc.heroImages.length === 0) {
      const heroInfo = heroMap[slug];
      if (heroInfo?.heroImage) {
        const heroPath = path.join(DATA_DIR, heroInfo.heroImage);
        if (fs.existsSync(heroPath)) {
          try {
            const heroAsset = await uploadImage(heroPath, `${slug}-hero`);
            await client.patch(emptyCol._id).set({ heroImages: [{ ...heroAsset, _key: 'hero-0' }] }).commit();
            console.log(`    📷 Hero image added for ${emptyCol.title}`);
          } catch (e: any) {
            console.log(`    ⚠ Hero failed: ${e.message?.substring(0, 60)}`);
          }
        }
      }
    }

    // Also update surfaces from extracted data
    const specs = ed.technicalSpecs || {};
    if (specs.usage) {
      const surfaces = specs.usage.filter((u: string) => ['Floor', 'Wall', 'Countertop', 'Outdoor'].includes(u));
      if (surfaces.length > 0) {
        await client.patch(emptyCol._id).set({ surfaces }).commit();
      }
    }

    // Create products for each color
    const productRefs: any[] = [];
    const seenNames = new Set<string>();
    
    for (let i = 0; i < ed.colors.length; i++) {
      const color = ed.colors[i];
      if (!color.name || color.name === 'Unknown') continue;
      
      // Skip true duplicates (same name + same SKU)
      const dedupKey = `${color.name}-${color.sku || i}`;
      if (seenNames.has(dedupKey)) continue;
      seenNames.add(dedupKey);
      
      const productId = `product-${slug}-${slugify(color.name)}-${i}`;
      const colorName = color.name.charAt(0).toUpperCase() + color.name.slice(1).toLowerCase();
      
      // Find color family reference
      const colorFamilyMap: Record<string, string> = {
        'BLACK': 'color-black', 'NERO': 'color-black', 'DARK': 'color-black',
        'WHITE': 'color-white', 'BIANCO': 'color-white', 'BONE': 'color-white',
        'GREY': 'color-grey', 'GRAY': 'color-grey', 'GRIGIO': 'color-grey',
        'SILVER': 'color-silver', 'BEIGE': 'color-beige', 'CREAM': 'color-cream',
        'BROWN': 'color-brown', 'NOCE': 'color-brown', 'WALNUT': 'color-brown',
        'BLUE': 'color-blue', 'COBALT': 'color-blue', 'NAVY': 'color-navy',
        'GREEN': 'color-green', 'RED': 'color-red', 'BORDEAUX': 'color-red',
        'SAND': 'color-sand', 'TAUPE': 'color-taupe', 'CHARCOAL': 'color-charcoal',
        'GOLD': 'color-gold', 'IVORY': 'color-ivory', 'NATURAL': 'color-beige',
        'LIGHT': 'color-cream', 'WARM': 'color-beige', 'COOL': 'color-grey',
        'ASH': 'color-grey', 'ANTHRACITE': 'color-charcoal', 'PEARL': 'color-white',
        'OAK': 'color-brown', 'TEAK': 'color-brown', 'MAPLE': 'color-brown',
        'TERRACOTTA': 'color-terracotta', 'COTTO': 'color-terracotta',
        'LATTE': 'color-cream', 'CAPPUCCINO': 'color-brown', 'ESPRESSO': 'color-brown',
        'AQUA': 'color-teal', 'TEAL': 'color-teal',
        'ROSE': 'color-pink', 'BLUSH': 'color-pink', 'PINK': 'color-pink',
      };
      
      let colorFamilyId = 'color-grey';
      const upper = color.name.toUpperCase();
      for (const [key, id] of Object.entries(colorFamilyMap)) {
        if (upper.includes(key)) {
          colorFamilyId = id;
          break;
        }
      }

      const productDoc: any = {
        _id: productId,
        _type: 'product',
        title: colorName,
        slug: { _type: 'slug', current: `${slug}-${slugify(color.name)}-${i}` },
        collection: { _type: 'reference', _ref: emptyCol._id },
        colorName: colorName,
        colorFamily: { _type: 'reference', _ref: colorFamilyId },
      };

      // Add finish + SKU if available
      if (color.sku) {
        productDoc.finishes = [{
          _type: 'finishVariant',
          _key: `finish-${i}`,
          type: { _type: 'reference', _ref: 'finish-matte' },
          skus: [{
            _type: 'sku',
            _key: `sku-${i}`,
            code: color.sku,
            size: specs.sizes?.[0] || '',
            sizeType: { _type: 'reference', _ref: 'sizetype-field-tile' },
          }],
        }];
      }

      await client.createOrReplace(productDoc);
      productRefs.push({
        _type: 'reference',
        _ref: productId,
        _key: `prod-${i}`,
      });
    }

    // Update collection with product references
    if (productRefs.length > 0) {
      await client.patch(emptyCol._id).set({ products: productRefs }).commit();
      console.log(`  ✓ ${emptyCol.title}: added ${productRefs.length} products`);
    }
    
    // Small delay
    await new Promise(r => setTimeout(r, 300));
  }

  // 3. Also deduplicate products within collections that have too many
  console.log('\n3. Deduplicating products in existing collections...');
  
  const allCols = await client.fetch('*[_type == "collection" && defined(products)] {_id, title, products}');
  
  for (const col of allCols) {
    if (!col.products || col.products.length === 0) continue;
    
    // Fetch the actual products to check for dupes
    const productIds = col.products.map((p: any) => p._ref);
    const products = await client.fetch('*[_id in $ids] {_id, colorName, finishes}', { ids: productIds });
    
    // Group by colorName + SKU
    const seen = new Map<string, string>();
    const toDelete: string[] = [];
    const keepRefs: any[] = [];
    
    for (const prod of products) {
      const sku = prod.finishes?.[0]?.skus?.[0]?.code || '';
      const key = `${prod.colorName || ''}-${sku}`;
      
      if (seen.has(key)) {
        toDelete.push(prod._id);
      } else {
        seen.set(key, prod._id);
        keepRefs.push(col.products.find((p: any) => p._ref === prod._id));
      }
    }
    
    if (toDelete.length > 0) {
      // Update collection to only reference non-duplicate products
      const filteredRefs = keepRefs.filter(Boolean);
      await client.patch(col._id).set({ products: filteredRefs }).commit();
      
      // Delete duplicate product documents
      for (const id of toDelete) {
        await client.delete(id);
      }
      console.log(`  ✓ ${col.title}: removed ${toDelete.length} duplicate products (${filteredRefs.length} remain)`);
    }
  }

  // 4. Final count
  console.log('\n=== FINAL STATS ===');
  const finalCollections = await client.fetch('count(*[_type == "collection" && !(_id in path("drafts.**"))])');
  const finalProducts = await client.fetch('count(*[_type == "product"])');
  const emptyFinal = await client.fetch('count(*[_type == "collection" && (!defined(products) || count(products) == 0) && !(_id in path("drafts.**"))])');
  
  console.log(`Collections: ${finalCollections}`);
  console.log(`Products: ${finalProducts}`);
  console.log(`Collections with no products: ${emptyFinal}`);
  console.log('\nDone!');
}

main().catch(console.error);
