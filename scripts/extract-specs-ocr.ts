/**
 * GIO Tile Spec Image Extractor (Tesseract OCR - Free/Local)
 *
 * Processes downloaded spec images through Tesseract OCR
 * to extract structured product data (colors, SKUs, sizes, specs).
 *
 * Usage:
 *   npx tsx scripts/extract-specs-ocr.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const DATA_DIR = path.join(__dirname, '../data');
const RAW_FILE = path.join(DATA_DIR, 'collections-raw.json');
const OUTPUT_FILE = path.join(DATA_DIR, 'collections-complete.json');
const IMAGES_DIR = path.join(DATA_DIR, 'spec-images');

// Patterns to extract structured data from OCR text
const SKU_PATTERN = /\b(GIO[A-Z0-9_]{4,})\b/gi;
const SIZE_PATTERN = /\b(\d+["″]?\s*[xX×]\s*\d+["″]?)\b/g;
const THICKNESS_PATTERN = /(?:thickness|thk)[:\s]*(\d+\.?\d*\s*mm)/i;
const WATER_ABS_PATTERN = /(?:water\s*absorption)[:\s]*(<?[≤]?\s*\d+\.?\d*\s*%)/i;
const COF_PATTERN = /(?:C\.?O\.?F\.?\s*(?:\(Dynamic\))?)[:\s]*(\d+\.?\d*)/i;
const PEI_PATTERN = /(?:PEI)[:\s\-]*(\d+|[IVX]+)/i;
const SHADE_PATTERN = /(?:V\d)\b/g;
const RECTIFIED_PATTERN = /\brectified\b/i;
const FROST_PATTERN = /(?:frost\s*resistance)[:\s]*(resistant|not\s*resistant)/i;

// Common color names in tile industry
const COLOR_NAMES = [
  'BIANCO', 'NERO', 'GRIGIO', 'CREMA', 'AVORIO', 'BEIGE', 'TAUPE',
  'GRAPHITE', 'SILVER', 'GOLD', 'BRONZE', 'COPPER',
  'BLACK', 'WHITE', 'GREY', 'GRAY', 'CREAM', 'IVORY',
  'BLUE', 'COBALT', 'NAVY', 'AZURE', 'TEAL', 'AQUA',
  'RED', 'BORDEAUX', 'BURGUNDY', 'RUST', 'TERRACOTTA',
  'GREEN', 'VERDE', 'OLIVE', 'SAGE', 'EMERALD', 'FOREST',
  'BROWN', 'CHOCOLATE', 'MOCHA', 'COFFEE', 'ESPRESSO', 'WALNUT', 'OAK',
  'NATURAL', 'SAND', 'DESERT', 'DUNE', 'LINEN', 'BONE',
  'PEARL', 'PLATINUM', 'TITANIUM', 'STEEL', 'IRON', 'ZINC',
  'NOCE', 'MIELE', 'CENERE', 'FUMO', 'PERLA', 'SABBIA',
  'CALCE', 'ARGENTO', 'ORO', 'RAME', 'PIOMBO',
  'WARM', 'COOL', 'LIGHT', 'DARK', 'MEDIUM', 'MULTI',
  'MATTE', 'POLISHED', 'HONED', 'SATIN', 'LAPPATO', 'GRIP',
  'MAPLE', 'CHERRY', 'ASH', 'BIRCH', 'PINE', 'CEDAR', 'TEAK',
  'CARAMEL', 'HONEY', 'AMBER', 'COTTO', 'CLAY',
  'MARFIL', 'STATUARIO', 'CALACATTA', 'CARRARA', 'TRAVERTINO',
  'ONYX', 'OPAL', 'ALABASTER', 'BASALT',
  'SMOKE', 'CHARCOAL', 'ASH', 'SLATE', 'PEWTER',
  'ROSE', 'BLUSH', 'CORAL', 'SALMON', 'PINK',
  'LATTE', 'CAPPUCCINO', 'BISCUIT', 'ALMOND',
  'OCEAN', 'SKY', 'ICE', 'ARCTIC', 'FROST',
  'EARTH', 'STONE', 'ROCK', 'PEBBLE', 'GRANITE',
];

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
  waterAbsorption?: string;
  cof?: string;
  pei?: string;
  rectified?: boolean;
  frostResistance?: string;
  usage?: string[];
}

interface PackagingInfo {
  piecesPerBox?: number;
  sqftPerBox?: number;
  boxesPerPallet?: number;
  sqftPerPallet?: number;
  weightPerPallet?: string;
}

interface ExtractedData {
  ocrText: string;
  colors: ColorVariant[];
  technicalSpecs: TechnicalSpecs;
  packaging: PackagingInfo;
  applications?: string[];
  shadeVariation?: string;
}

function ocrImage(imagePath: string): string {
  try {
    // Use --psm 6 for uniform block of text, --oem 3 for best accuracy
    const text = execSync(
      `tesseract "${imagePath}" stdout --psm 6 --oem 3 2>/dev/null`,
      { encoding: 'utf-8', timeout: 30000 }
    );
    return text.trim();
  } catch {
    // Fallback with default settings
    try {
      const text = execSync(
        `tesseract "${imagePath}" stdout 2>/dev/null`,
        { encoding: 'utf-8', timeout: 30000 }
      );
      return text.trim();
    } catch {
      return '';
    }
  }
}

function extractColors(text: string): ColorVariant[] {
  const colors: ColorVariant[] = [];
  const lines = text.split('\n');
  const skus = text.match(SKU_PATTERN) || [];

  // Strategy 1: Find color names near SKUs
  for (const sku of skus) {
    const skuIndex = text.indexOf(sku);
    // Look at nearby text (200 chars before the SKU) for a color name
    const nearbyText = text.substring(Math.max(0, skuIndex - 200), skuIndex + sku.length).toUpperCase();

    let colorName = '';
    for (const name of COLOR_NAMES) {
      if (nearbyText.includes(name)) {
        colorName = name;
        break;
      }
    }

    // Check for finish type
    let finish: string | undefined;
    if (/matte|matt/i.test(nearbyText)) finish = 'Matte';
    else if (/bright|glossy|gloss/i.test(nearbyText)) finish = 'Bright';
    else if (/satin/i.test(nearbyText)) finish = 'Satin';
    else if (/lappato/i.test(nearbyText)) finish = 'Lappato';
    else if (/polished/i.test(nearbyText)) finish = 'Polished';
    else if (/honed/i.test(nearbyText)) finish = 'Honed';
    else if (/grip|anti.?slip/i.test(nearbyText)) finish = 'Grip';

    // Only add if we haven't seen this SKU
    if (!colors.find(c => c.sku === sku)) {
      colors.push({
        name: colorName || 'Unknown',
        sku: sku.toUpperCase(),
        ...(finish && { finish }),
      });
    }
  }

  // Strategy 2: Find standalone color names (lines that are just a color name)
  if (colors.length === 0) {
    for (const line of lines) {
      const trimmed = line.trim().toUpperCase();
      for (const name of COLOR_NAMES) {
        if (trimmed === name || trimmed.startsWith(name + ' ')) {
          if (!colors.find(c => c.name === name)) {
            colors.push({ name, sku: '' });
          }
        }
      }
    }
  }

  return colors;
}

function extractSpecs(text: string): TechnicalSpecs {
  const specs: TechnicalSpecs = {};

  // Sizes
  const sizes = text.match(SIZE_PATTERN);
  if (sizes) {
    specs.sizes = [...new Set(sizes.map(s => s.replace(/[""″]/g, '"').replace(/\s+/g, '')))];
  }

  // Thickness
  const thickness = text.match(THICKNESS_PATTERN);
  if (thickness) specs.thickness = thickness[1].trim();

  // Water absorption
  const waterAbs = text.match(WATER_ABS_PATTERN);
  if (waterAbs) specs.waterAbsorption = waterAbs[1].trim();

  // COF
  const cof = text.match(COF_PATTERN);
  if (cof) specs.cof = cof[1];

  // PEI
  const pei = text.match(PEI_PATTERN);
  if (pei) specs.pei = pei[1];

  // Rectified
  if (RECTIFIED_PATTERN.test(text)) specs.rectified = true;

  // Frost resistance
  const frost = text.match(FROST_PATTERN);
  if (frost) specs.frostResistance = frost[1];

  // Material type
  if (/porcelain/i.test(text)) specs.material = 'Porcelain';
  else if (/ceramic/i.test(text)) specs.material = 'Ceramic';
  else if (/glass/i.test(text)) specs.material = 'Glass';
  else if (/natural\s*stone/i.test(text)) specs.material = 'Natural Stone';
  else if (/marble/i.test(text)) specs.material = 'Marble';
  else if (/travertine/i.test(text)) specs.material = 'Travertine';

  // Finish
  if (/\bmatte\b/i.test(text)) specs.finish = 'Matte';
  else if (/\bpolished\b/i.test(text)) specs.finish = 'Polished';
  else if (/\bhoned\b/i.test(text)) specs.finish = 'Honed';
  else if (/\bsatin\b/i.test(text)) specs.finish = 'Satin';
  else if (/\blappato\b/i.test(text)) specs.finish = 'Lappato';

  // Usage/Applications
  const usage: string[] = [];
  if (/\bfloor\b/i.test(text)) usage.push('Floor');
  if (/\bwall\b/i.test(text)) usage.push('Wall');
  if (/\bcommercial\b/i.test(text)) usage.push('Commercial');
  if (/\bresidential\b/i.test(text)) usage.push('Residential');
  if (/\bindustrial\b/i.test(text)) usage.push('Industrial');
  if (/\boutdoor\b/i.test(text)) usage.push('Outdoor');
  if (/\bpool\b/i.test(text)) usage.push('Pool');
  if (/\bcountertop\b/i.test(text)) usage.push('Countertop');
  if (usage.length > 0) specs.usage = usage;

  return specs;
}

function extractPackaging(text: string): PackagingInfo {
  const packaging: PackagingInfo = {};

  // Try to find packaging table data
  const packagingSection = text.match(/PACKAGING[\s\S]{0,500}/i);
  if (packagingSection) {
    const section = packagingSection[0];
    // Look for numbers in packaging context
    const numbers = section.match(/\d+\.?\d*/g);
    if (numbers && numbers.length >= 2) {
      // Typical order: pieces/box, sqft/box, lbs/box, boxes/pallet, sqft/pallet, weight/pallet
      const nums = numbers.map(n => parseFloat(n));
      if (nums.length >= 2) packaging.piecesPerBox = nums[0];
      if (nums.length >= 3) packaging.sqftPerBox = nums[1];
      if (nums.length >= 5) packaging.boxesPerPallet = nums[3];
      if (nums.length >= 6) packaging.sqftPerPallet = nums[4];
    }
  }

  return packaging;
}

function extractApplications(text: string): string[] {
  const apps: string[] = [];
  if (/residential/i.test(text)) apps.push('Residential');
  if (/commercial/i.test(text)) apps.push('Commercial');
  if (/industrial/i.test(text)) apps.push('Industrial');
  return apps;
}

function extractShadeVariation(text: string): string | undefined {
  const shades = text.match(SHADE_PATTERN);
  if (shades) return shades[shades.length - 1]; // Usually the last V-rating is the shade variation
  // Also check for written forms
  if (/moderate\s*variation/i.test(text)) return 'V2';
  if (/slight\s*variation/i.test(text)) return 'V1';
  if (/high\s*variation/i.test(text)) return 'V3';
  if (/substantial\s*variation/i.test(text)) return 'V4';
  return undefined;
}

function processImage(imagePath: string, collectionName: string): ExtractedData | null {
  if (!fs.existsSync(imagePath)) return null;

  // Skip very small images
  const stat = fs.statSync(imagePath);
  if (stat.size < 10000) {
    console.log(`  ⊘ Skipping ${collectionName} (image too small)`);
    return null;
  }

  const ocrText = ocrImage(imagePath);
  if (!ocrText || ocrText.length < 20) {
    console.log(`  ⊘ Skipping ${collectionName} (no readable text)`);
    return null;
  }

  const colors = extractColors(ocrText);
  const technicalSpecs = extractSpecs(ocrText);
  const packaging = extractPackaging(ocrText);
  const applications = extractApplications(ocrText);
  const shadeVariation = extractShadeVariation(ocrText);

  return {
    ocrText,
    colors,
    technicalSpecs,
    packaging,
    ...(applications.length > 0 && { applications }),
    ...(shadeVariation && { shadeVariation }),
  };
}

function main() {
  const rawData = JSON.parse(fs.readFileSync(RAW_FILE, 'utf-8'));
  console.log(`Processing ${rawData.length} collections with Tesseract OCR...\n`);

  let processed = 0;
  let failed = 0;
  let skipped = 0;

  const results = rawData.map((collection: any) => {
    if (!collection.specImageLocal) {
      skipped++;
      return { ...collection, extractedData: null };
    }

    const imagePath = path.join(DATA_DIR, collection.specImageLocal);
    const extracted = processImage(imagePath, collection.title || collection.slug);

    if (extracted) {
      processed++;
      console.log(
        `  ✓ ${collection.title || collection.slug} — ${extracted.colors.length} colors, ${extracted.technicalSpecs.sizes?.length || 0} sizes`
      );
    } else {
      failed++;
    }

    return { ...collection, extractedData: extracted };
  });

  // Save complete data
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Done!`);
  console.log(`  Successfully extracted: ${processed}`);
  console.log(`  Failed/skipped: ${failed + skipped}`);
  console.log(`  Output: ${OUTPUT_FILE}`);
  console.log(`\nThe collections-complete.json file is ready for Sanity import.`);
}

main();
