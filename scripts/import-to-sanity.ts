/**
 * GIO Tile - Import all scraped data into Sanity CMS
 *
 * Imports: taxonomy data, collections, products (colors/SKUs),
 * hero images, spec images, and PDFs.
 *
 * Usage: npx tsx scripts/import-to-sanity.ts
 */

import { createClient } from '@sanity/client';
import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(__dirname, '../data');

const client = createClient({
  projectId: '6kv11yeo',
  dataset: 'production',
  token: process.env.SANITY_API_TOKEN || 'skjBBxKzhOiNUrGjMNwflpPvMIN455xbyiMYgIuxOdztNNy2djId32Fy9fs4GOvmyuaYpM1UkBMzeI5PB6k9LwGF97K1cHu8vjuxePWKfOTzbVK81qggFmMtOkG9hKK0vfwcNI2Z0oydsTcrFIGwndhkv821miYvfmhkEANdAL0QXgpMBwdO',
  apiVersion: '2024-01-01',
  useCdn: false,
});

// ─── Helpers ────────────────────────────────────────────

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function uploadImage(filepath: string, filename: string): Promise<any> {
  const buffer = fs.readFileSync(filepath);
  const asset = await client.assets.upload('image', buffer, { filename });
  return {
    _type: 'image',
    asset: { _type: 'reference', _ref: asset._id },
  };
}

async function uploadFile(filepath: string, filename: string): Promise<any> {
  const buffer = fs.readFileSync(filepath);
  const asset = await client.assets.upload('file', buffer, { filename });
  return {
    _type: 'file',
    asset: { _type: 'reference', _ref: asset._id },
  };
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Step 1: Create taxonomy documents ──────────────────

const FINISHES = [
  'Matte', 'Polished', 'Honed', 'Satin', 'Lappato', 'Grip',
  'Bright', 'Textured', 'Structured', 'Natural', 'Rectified',
  'Three Dimensional', 'Glossy', 'Silk', 'Bush Hammered',
];

const COLORS = [
  { title: 'White', hex: '#FFFFFF' },
  { title: 'Black', hex: '#000000' },
  { title: 'Grey', hex: '#808080' },
  { title: 'Beige', hex: '#D4C5A9' },
  { title: 'Brown', hex: '#8B4513' },
  { title: 'Blue', hex: '#4169E1' },
  { title: 'Green', hex: '#2E8B57' },
  { title: 'Red', hex: '#B22222' },
  { title: 'Cream', hex: '#FFFDD0' },
  { title: 'Ivory', hex: '#FFFFF0' },
  { title: 'Taupe', hex: '#483C32' },
  { title: 'Gold', hex: '#DAA520' },
  { title: 'Silver', hex: '#C0C0C0' },
  { title: 'Bronze', hex: '#CD7F32' },
  { title: 'Copper', hex: '#B87333' },
  { title: 'Sand', hex: '#C2B280' },
  { title: 'Charcoal', hex: '#36454F' },
  { title: 'Navy', hex: '#000080' },
  { title: 'Teal', hex: '#008080' },
  { title: 'Terracotta', hex: '#E2725B' },
  { title: 'Pink', hex: '#FFC0CB' },
  { title: 'Multi', hex: '#999999' },
];

const SIZE_TYPES = [
  'Field Tile', 'Wall Tile', 'Mosaic', 'Bullnose', 'Trim',
  'Paver', 'Subway Tile', 'Hexagon', 'Listello', 'Decos',
  'Pencil Liner', 'Quarter Round',
];

const LOOKS = [
  'Stone', 'Wood', 'Concrete', 'Metal', 'Marble', 'Terrazzo',
  'Brick', 'Fabric', 'Cement', 'Slate', 'Travertine', 'Onyx',
  'Quartzite', 'Limestone',
];

const STYLES = [
  'Large Format', 'Mosaic', 'Hexagonal', 'Subway', 'Picket',
  'Penny Round', 'Plank', 'Square', 'Rectangular', 'Chevron',
  '3D / Dimensional', 'Geometric',
];

// Color name to family mapping
const COLOR_FAMILY_MAP: Record<string, string> = {
  'BLACK': 'Black', 'NERO': 'Black', 'DARK': 'Black', 'EBONY': 'Black',
  'WHITE': 'White', 'BIANCO': 'White', 'BONE': 'White', 'ALABASTER': 'White',
  'GREY': 'Grey', 'GRAY': 'Grey', 'GRIGIO': 'Grey', 'GRAPHITE': 'Grey',
  'SILVER': 'Silver', 'ARGENTO': 'Silver', 'PLATINUM': 'Silver', 'PEWTER': 'Grey',
  'BEIGE': 'Beige', 'CREMA': 'Cream', 'CREAM': 'Cream', 'AVORIO': 'Ivory',
  'IVORY': 'Ivory', 'LINEN': 'Cream', 'PEARL': 'White', 'PERLA': 'White',
  'BROWN': 'Brown', 'NOCE': 'Brown', 'CHOCOLATE': 'Brown', 'MOCHA': 'Brown',
  'WALNUT': 'Brown', 'OAK': 'Brown', 'COFFEE': 'Brown', 'ESPRESSO': 'Brown',
  'CARAMEL': 'Brown', 'HONEY': 'Gold', 'AMBER': 'Gold', 'MIELE': 'Gold',
  'BLUE': 'Blue', 'COBALT': 'Blue', 'NAVY': 'Navy', 'AZURE': 'Blue',
  'TEAL': 'Teal', 'AQUA': 'Teal', 'OCEAN': 'Blue', 'SKY': 'Blue',
  'GREEN': 'Green', 'VERDE': 'Green', 'OLIVE': 'Green', 'SAGE': 'Green',
  'EMERALD': 'Green', 'FOREST': 'Green',
  'RED': 'Red', 'BORDEAUX': 'Red', 'BURGUNDY': 'Red', 'RUST': 'Red',
  'TERRACOTTA': 'Terracotta', 'COTTO': 'Terracotta', 'CLAY': 'Terracotta',
  'SAND': 'Sand', 'DESERT': 'Sand', 'DUNE': 'Sand', 'SABBIA': 'Sand',
  'NATURAL': 'Beige', 'LIGHT': 'Cream', 'MEDIUM': 'Beige', 'WARM': 'Beige', 'COOL': 'Grey',
  'GOLD': 'Gold', 'ORO': 'Gold', 'DORATO': 'Gold',
  'BRONZE': 'Bronze', 'COPPER': 'Copper', 'RAME': 'Copper',
  'TAUPE': 'Taupe', 'CENERE': 'Grey', 'FUMO': 'Grey', 'SMOKE': 'Grey',
  'CHARCOAL': 'Charcoal', 'SLATE': 'Charcoal', 'ASH': 'Grey',
  'ROSE': 'Pink', 'BLUSH': 'Pink', 'CORAL': 'Pink', 'SALMON': 'Pink', 'PINK': 'Pink',
  'MULTI': 'Multi', 'MIX': 'Multi',
  'STEEL': 'Silver', 'IRON': 'Charcoal', 'ZINC': 'Silver', 'TITANIUM': 'Silver',
  'PIOMBO': 'Grey', 'CALCE': 'White',
  'MAPLE': 'Brown', 'CHERRY': 'Brown', 'BIRCH': 'Beige', 'PINE': 'Beige',
  'CEDAR': 'Brown', 'TEAK': 'Brown',
  'LATTE': 'Cream', 'CAPPUCCINO': 'Brown', 'BISCUIT': 'Cream', 'ALMOND': 'Cream',
  'ICE': 'White', 'ARCTIC': 'White', 'FROST': 'White',
  'EARTH': 'Brown', 'STONE': 'Grey', 'ROCK': 'Grey', 'PEBBLE': 'Grey',
  'BASALT': 'Charcoal', 'ONYX': 'Black',
};

async function createTaxonomies() {
  console.log('Creating taxonomy documents...\n');

  // Finishes
  const finishIds: Record<string, string> = {};
  for (const name of FINISHES) {
    const id = `finish-${slugify(name)}`;
    await client.createOrReplace({ _id: id, _type: 'finish', title: name });
    finishIds[name.toLowerCase()] = id;
    console.log(`  ✓ Finish: ${name}`);
  }

  // Colors
  const colorIds: Record<string, string> = {};
  for (const { title, hex } of COLORS) {
    const id = `color-${slugify(title)}`;
    await client.createOrReplace({ _id: id, _type: 'color', title, hex });
    colorIds[title] = id;
    console.log(`  ✓ Color: ${title}`);
  }

  // Size Types
  const sizeTypeIds: Record<string, string> = {};
  for (const name of SIZE_TYPES) {
    const id = `sizetype-${slugify(name)}`;
    await client.createOrReplace({ _id: id, _type: 'sizeType', title: name });
    sizeTypeIds[name.toLowerCase()] = id;
    console.log(`  ✓ Size Type: ${name}`);
  }

  // Looks
  const lookIds: Record<string, string> = {};
  for (const name of LOOKS) {
    const id = `look-${slugify(name)}`;
    await client.createOrReplace({
      _id: id, _type: 'look', title: name,
      slug: { _type: 'slug', current: slugify(name) },
    });
    lookIds[name.toLowerCase()] = id;
    console.log(`  ✓ Look: ${name}`);
  }

  // Styles
  const styleIds: Record<string, string> = {};
  for (const name of STYLES) {
    const id = `style-${slugify(name)}`;
    await client.createOrReplace({
      _id: id, _type: 'style', title: name,
      slug: { _type: 'slug', current: slugify(name) },
    });
    styleIds[name.toLowerCase()] = id;
    console.log(`  ✓ Style: ${name}`);
  }

  console.log('\nTaxonomies created.\n');
  return { finishIds, colorIds, sizeTypeIds, lookIds, styleIds };
}

// ─── Step 2: Import collections and products ────────────

function getColorFamilyId(colorName: string, colorIds: Record<string, string>): string {
  const upper = colorName.toUpperCase().trim();
  const family = COLOR_FAMILY_MAP[upper];
  if (family && colorIds[family]) return colorIds[family];

  // Partial match
  for (const [key, val] of Object.entries(COLOR_FAMILY_MAP)) {
    if (upper.includes(key)) {
      if (colorIds[val]) return colorIds[val];
    }
  }

  // Default to grey
  return colorIds['Grey'] || colorIds['Multi'];
}

function guessSizeType(sku: string, size: string): string {
  const s = (sku + ' ' + size).toLowerCase();
  if (s.includes('mosaic') || s.includes('mos') || s.includes('1x1') || s.includes('2x2')) return 'mosaic';
  if (s.includes('bullnose') || s.includes('bn')) return 'bullnose';
  if (s.includes('listello') || s.includes('list')) return 'listello';
  if (s.includes('paver') || s.includes('20mm')) return 'paver';
  if (s.includes('hex')) return 'hexagon';
  if (s.includes('subway') || size === '3x6' || size === '4x12') return 'subway tile';
  if (s.includes('trim') || s.includes('pencil') || s.includes('quarter')) return 'trim';
  if (s.includes('decos') || s.includes('deco')) return 'decos';
  return 'field tile';
}

async function importCollections(taxonomyIds: any) {
  const { finishIds, colorIds, sizeTypeIds, lookIds, styleIds } = taxonomyIds;

  const collections = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'collections-complete.json'), 'utf-8'));
  const heroMap = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'hero-image-map.json'), 'utf-8'));
  const pdfMap = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'pdf-map.json'), 'utf-8'));

  console.log(`Importing ${collections.length} collections...\n`);

  let collectionCount = 0;
  let productCount = 0;

  for (const col of collections) {
    // Skip category/index pages
    if (!col.slug || col.slug === 'products' || col.slug.startsWith('gio-') || col.slug.startsWith('porcelain-')) {
      continue;
    }

    const ed = col.extractedData;
    const collectionId = `collection-${col.slug}`;
    const collectionTitle = (col.title || col.slug)
      .replace(/ by GIO.*$/i, '')
      .replace(/ - Gio Tile$/i, '')
      .replace(/Floor & Wall Tile$/i, '')
      .replace(/Wall Tile$/i, '')
      .replace(/Floor Tile$/i, '')
      .trim();

    // Build collection document
    const collectionDoc: any = {
      _id: collectionId,
      _type: 'collection',
      title: collectionTitle,
      slug: { _type: 'slug', current: col.slug },
      description: col.description && !col.description.startsWith('Home »')
        ? col.description
        : undefined,
    };

    // Material, thickness, rectified from extracted data
    if (ed) {
      const specs = ed.technicalSpecs || {};
      if (specs.material) collectionDoc.material = specs.material;
      if (specs.thickness) collectionDoc.thickness = specs.thickness;
      if (specs.rectified) collectionDoc.rectified = true;

      // Surfaces from usage
      if (specs.usage) {
        const surfaces = specs.usage.filter((u: string) =>
          ['Floor', 'Wall', 'Countertop', 'Outdoor'].includes(u)
        );
        if (surfaces.length > 0) collectionDoc.surfaces = surfaces;
      }

      // Applications
      if (ed.applications && ed.applications.length > 0) {
        collectionDoc.applications = ed.applications;
      }

      // Technical specs object
      const techSpecs: any = {};
      const rawSpecs = ed.technicalSpecifications || {};
      if (specs.waterAbsorption || rawSpecs['Water Absorption']) {
        techSpecs.waterAbsorption = specs.waterAbsorption || rawSpecs['Water Absorption'];
      }
      if (specs.frostResistance || rawSpecs['Frost Resistance']) {
        techSpecs.frostResistance = specs.frostResistance || rawSpecs['Frost Resistance'];
      }
      if (specs.cof || rawSpecs['C.O.F. (Dynamic)']) {
        techSpecs.coefficientOfFriction = specs.cof || rawSpecs['C.O.F. (Dynamic)'];
      }
      if (rawSpecs['Chemical Resistance']) {
        techSpecs.chemicalResistance = rawSpecs['Chemical Resistance'];
      }
      if (rawSpecs['Deep Abrasion Resistance'] || rawSpecs['PEI']) {
        techSpecs.peiRating = rawSpecs['Deep Abrasion Resistance'] || rawSpecs['PEI'];
      }
      if (Object.keys(techSpecs).length > 0) {
        collectionDoc.technicalSpecs = techSpecs;
      }

      // Packaging data
      if (ed.packaging) {
        const packagingArray = Array.isArray(ed.packaging) ? ed.packaging : [ed.packaging];
        const validPackaging = packagingArray
          .filter((p: any) => p.nominalSize || p.piecesPerBox || p.sqftPerBox)
          .map((p: any) => ({
            _type: 'packagingRow',
            _key: slugify(p.nominalSize || 'default'),
            ...(p.nominalSize && { nominalSize: p.nominalSize }),
            ...(p.piecesPerBox && { piecesPerBox: Number(p.piecesPerBox) }),
            ...(p.sqftPerBox && { sqftPerBox: Number(p.sqftPerBox) }),
            ...(p.lbsPerBox && { lbsPerBox: Number(p.lbsPerBox) }),
            ...(p.boxesPerPallet && { boxesPerPallet: Number(p.boxesPerPallet) }),
            ...(p.sqftPerPallet && { sqftPerPallet: Number(p.sqftPerPallet) }),
            ...(p.weightPerPallet && { weightPerPallet: Number(p.weightPerPallet) }),
          }));
        if (validPackaging.length > 0) {
          collectionDoc.packagingData = validPackaging;
        }
      }
    }

    // Upload hero image
    const heroInfo = heroMap[col.slug];
    if (heroInfo && heroInfo.heroImage) {
      const heroPath = path.join(DATA_DIR, heroInfo.heroImage);
      if (fs.existsSync(heroPath)) {
        try {
          const heroAsset = await uploadImage(heroPath, `${col.slug}-hero`);
          collectionDoc.heroImages = [{ ...heroAsset, _key: 'hero-0' }];
          console.log(`    📷 Hero image uploaded`);
        } catch (e: any) {
          console.log(`    ⚠ Hero image failed: ${e.message?.substring(0, 60)}`);
        }
      }
    }

    // Upload spec image
    const specPath = path.join(DATA_DIR, `spec-images/${col.slug}.jpg`);
    const specPathPng = path.join(DATA_DIR, `spec-images/${col.slug}.png`);
    const actualSpecPath = fs.existsSync(specPath) ? specPath : fs.existsSync(specPathPng) ? specPathPng : null;
    if (actualSpecPath) {
      try {
        const specAsset = await uploadImage(actualSpecPath, `${col.slug}-spec`);
        collectionDoc.specImage = specAsset;
        console.log(`    📋 Spec image uploaded`);
      } catch (e: any) {
        console.log(`    ⚠ Spec image failed: ${e.message?.substring(0, 60)}`);
      }
    }

    // Upload PDF
    const pdfName = collectionTitle.toUpperCase().replace(/[^A-Z0-9]/g, '_');
    const pdfEntry = pdfMap[pdfName] || pdfMap[col.slug.toUpperCase().replace(/-/g, '_')];
    // Try fuzzy match
    let pdfLocalPath: string | null = null;
    if (pdfEntry) {
      pdfLocalPath = path.join(DATA_DIR, pdfEntry);
    } else {
      // Try finding by slug pattern
      const pdfDir = path.join(DATA_DIR, 'pdfs');
      if (fs.existsSync(pdfDir)) {
        const pdfFiles = fs.readdirSync(pdfDir);
        const slugBase = col.slug.replace(/-by-gio.*$/, '').replace(/-/g, '_');
        const match = pdfFiles.find(f => f.toLowerCase().includes(slugBase.toLowerCase()));
        if (match) pdfLocalPath = path.join(pdfDir, match);
      }
    }
    if (pdfLocalPath && fs.existsSync(pdfLocalPath)) {
      try {
        const pdfAsset = await uploadFile(pdfLocalPath, `${col.slug}-spec.pdf`);
        collectionDoc.specSheet = pdfAsset;
        console.log(`    📄 PDF uploaded`);
      } catch (e: any) {
        console.log(`    ⚠ PDF failed: ${e.message?.substring(0, 60)}`);
      }
    }

    // Create collection document
    await client.createOrReplace(collectionDoc);
    collectionCount++;
    console.log(`  ✓ Collection: ${collectionTitle}`);

    // Create product documents for each color
    if (ed && ed.colors && ed.colors.length > 0) {
      const productRefs: any[] = [];

      for (let i = 0; i < ed.colors.length; i++) {
        const color = ed.colors[i];
        if (!color.name || color.name === 'Unknown') continue;

        const productId = `product-${col.slug}-${slugify(color.name)}-${i}`;
        const colorFamilyId = getColorFamilyId(color.name, colorIds);

        // Determine finish
        let finishRef: string | undefined;
        if (color.finish) {
          const finishLower = color.finish.toLowerCase();
          // Try exact match
          finishRef = finishIds[finishLower];
          // Try partial match
          if (!finishRef) {
            for (const [key, id] of Object.entries(finishIds)) {
              if (finishLower.includes(key)) {
                finishRef = id;
                break;
              }
            }
          }
        }

        // Determine size type
        const sizeTypeKey = guessSizeType(color.sku || '', color.finish || '');
        const sizeTypeId = sizeTypeIds[sizeTypeKey] || sizeTypeIds['field tile'];

        // Build finishes array with SKU
        const finishVariants: any[] = [];
        if (color.sku) {
          const size = ed.technicalSpecs?.sizes?.[0] || '';
          finishVariants.push({
            _type: 'finishVariant',
            _key: `finish-${i}`,
            type: { _type: 'reference', _ref: finishRef || finishIds['matte'] || Object.values(finishIds)[0] },
            skus: [{
              _type: 'sku',
              _key: `sku-${i}`,
              code: color.sku,
              size: size,
              sizeType: { _type: 'reference', _ref: sizeTypeId },
            }],
          });
        }

        const productDoc: any = {
          _id: productId,
          _type: 'product',
          title: color.name.charAt(0).toUpperCase() + color.name.slice(1).toLowerCase(),
          slug: { _type: 'slug', current: `${col.slug}-${slugify(color.name)}-${i}` },
          collection: { _type: 'reference', _ref: collectionId },
          colorName: color.name.charAt(0).toUpperCase() + color.name.slice(1).toLowerCase(),
          colorFamily: { _type: 'reference', _ref: colorFamilyId },
        };

        if (ed.shadeVariation) {
          productDoc.shadeVariation = ed.shadeVariation;
        }

        if (finishVariants.length > 0) {
          productDoc.finishes = finishVariants;
        }

        await client.createOrReplace(productDoc);
        productCount++;
        productRefs.push({
          _type: 'reference',
          _ref: productId,
          _key: `prod-${i}`,
        });
      }

      // Update collection with product references
      if (productRefs.length > 0) {
        await client.patch(collectionId).set({ products: productRefs }).commit();
      }
    }

    // Small delay to avoid rate limits
    await sleep(500);
  }

  return { collectionCount, productCount };
}

// ─── Main ───────────────────────────────────────────────

async function main() {
  console.log('GIO Tile - Sanity Import\n');
  console.log('='.repeat(50));

  // Step 1: Taxonomies
  const taxonomyIds = await createTaxonomies();

  // Step 2: Collections + Products
  const { collectionCount, productCount } = await importCollections(taxonomyIds);

  console.log('\n' + '='.repeat(50));
  console.log('Import complete!');
  console.log(`  Collections: ${collectionCount}`);
  console.log(`  Products: ${productCount}`);
  console.log(`  Taxonomies: ${FINISHES.length} finishes, ${COLORS.length} colors, ${SIZE_TYPES.length} size types, ${LOOKS.length} looks, ${STYLES.length} styles`);
}

main().catch(console.error);
