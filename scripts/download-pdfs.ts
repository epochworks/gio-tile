/**
 * Downloads all product PDF spec sheets from giotile.com/downloads/
 * Maps each PDF to its collection slug where possible.
 * Safe to run alongside other scripts.
 *
 * Usage: npx tsx scripts/download-pdfs.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(__dirname, '../data');
const PDF_DIR = path.join(DATA_DIR, 'pdfs');
const MAP_FILE = path.join(DATA_DIR, 'pdf-map.json');

// All PDFs from giotile.com/downloads/
const PDF_LINKS: [string, string][] = [
  ["ABSOLUTE", "https://www.giotile.com/wp-content/uploads/2024/12/GIO_Absolute_12.12.24.pdf"],
  ["ACQUA", "https://www.giotile.com/wp-content/uploads/2025/08/GIO.Acqua_.08.13.25.pdf"],
  ["AGATA", "https://www.giotile.com/wp-content/uploads/2022/08/GIO_Agata_08.10.22.pdf"],
  ["ALLOY", "https://www.giotile.com/wp-content/uploads/2022/02/GIO_Alloy_02.16.22.pdf"],
  ["ANTICO", "https://www.giotile.com/wp-content/uploads/2024/09/GIO_Antico.09.04.2024.pdf"],
  ["ARABESCATO_VAGLI", "https://www.giotile.com/wp-content/uploads/2025/10/GIO.Arabescato.Vagli_.10.29.25.pdf"],
  ["ARTE", "https://www.giotile.com/wp-content/uploads/2019/05/GIO-Arte.pdf"],
  ["ARDESIA", "https://www.giotile.com/wp-content/uploads/2021/02/GIO-Ardesia.pdf"],
  ["ARGILLE", "https://www.giotile.com/wp-content/uploads/2020/01/GIO-Argille.pdf"],
  ["ARTISAN", "https://www.giotile.com/wp-content/uploads/2024/08/GIO_Artisan.08.06.2024.pdf"],
  ["ATELIER", "https://www.giotile.com/wp-content/uploads/2020/02/GIO_Atelier_02.19.20.pdf"],
  ["ATHENA", "https://www.giotile.com/wp-content/uploads/2024/06/GIO_Athena_06.04.2024.pdf"],
  ["BARDIGLIO", "https://www.giotile.com/wp-content/uploads/2024/09/GIO_Bardiglio.09.18.2024.pdf"],
  ["BARISTA", "https://www.giotile.com/wp-content/uploads/2024/06/GIO_Barista_06.04.2024.pdf"],
  ["BARNWOOD", "https://www.giotile.com/wp-content/uploads/2024/02/GIO_Barnwood.02.08.24.pdf"],
  ["BASALTINA", "https://www.giotile.com/wp-content/uploads/2024/05/GIO.Basaltina.05.15.24.pdf"],
  ["BERGEN", "https://www.giotile.com/wp-content/uploads/2025/11/GIO.Bergen.01.03.25.pdf"],
  ["BIANCA", "https://www.giotile.com/wp-content/uploads/2022/04/GIO-Bianca.pdf"],
  ["BIANCO_CAMOUFLAGE", "https://www.giotile.com/wp-content/uploads/2025/11/GIO.Bianco_Camouflage.11.17.25-1.pdf"],
  ["BLENDSTONE", "https://www.giotile.com/wp-content/uploads/2024/05/GIO.Blendstone.05.22.24.pdf"],
  ["BLUESTONE_PIERRE", "https://www.giotile.com/wp-content/uploads/2024/06/GIO_Bluestone.Pierre_06.04.2024.pdf"],
  ["BRECCIA_CREMA", "https://www.giotile.com/wp-content/uploads/2025/07/GIO.Breccia_crema.06.30.25.pdf"],
  ["BRICK", "https://www.giotile.com/wp-content/uploads/2021/08/GIO_Brick.08.09.21.pdf"],
  ["BRICK_DIMENSION", "https://www.giotile.com/wp-content/uploads/2025/11/GIO.Brick_Dimension.11.20.25.pdf"],
  ["BRICK_FILO", "https://www.giotile.com/wp-content/uploads/2024/05/GIO.Brick_.Filo_.05.09.24.pdf"],
  ["BRICK_MOOD", "https://www.giotile.com/wp-content/uploads/2024/09/GIO_Brick.Mood_.09.18.2024.pdf"],
  ["BRICK_ROMA", "https://www.giotile.com/wp-content/uploads/2024/05/GIO.Brick_Roma.05.14.24.pdf"],
  ["CALACATTA", "https://www.giotile.com/wp-content/uploads/2024/06/GIO_Calacatta_06.04.2024.pdf"],
  ["CANELA", "https://www.giotile.com/wp-content/uploads/2025/07/GIO.Canela.07.14.25.pdf"],
  ["CANVAS", "https://www.giotile.com/wp-content/uploads/2019/05/GIO-Canvas.pdf"],
  ["CARDOSA", "https://www.giotile.com/wp-content/uploads/2021/08/GIO-Cardoso.pdf"],
  ["CARRARA", "https://www.giotile.com/wp-content/uploads/2022/07/GIO_Cararra.12.05.21.pdf"],
  ["CEMENT+", "https://www.giotile.com/wp-content/uploads/2019/05/GIO-Cement.pdf"],
  ["CEMENTO", "https://www.giotile.com/wp-content/uploads/2025/08/GIO.Cemento.08.28.25.pdf"],
  ["CEPPO_PRIMA", "https://www.giotile.com/wp-content/uploads/2025/07/GIO.Cepo_Prima.07.07.25.pdf"],
  ["CHAR", "https://www.giotile.com/wp-content/uploads/2021/08/GIO_Char_01.24.20.pdf"],
  ["CHATEAU", "https://www.giotile.com/wp-content/uploads/2019/05/Gio-Chateau.pdf"],
  ["CHROMA", "https://www.giotile.com/wp-content/uploads/2023/08/GIO_Chroma.08.01.23-1.pdf"],
  ["CLAYSTONE", "https://www.giotile.com/wp-content/uploads/2024/05/GIO.Claystone.05.20.24.pdf"],
  ["CREMA_AVORIO", "https://www.giotile.com/wp-content/uploads/2024/11/GIO.CremaAvorio.11.13.24.pdf"],
  ["COCCIO", "https://www.giotile.com/wp-content/uploads/2022/05/GIO-Coccio.pdf"],
  ["COLORI", "https://www.giotile.com/wp-content/uploads/2024/11/GIO.Colori.11.08.24-1.pdf"],
  ["COLORPLAY", "https://www.giotile.com/wp-content/uploads/2025/07/GIO.ColorPlay.06.30.25.pdf"],
  ["CORTON", "https://www.giotile.com/wp-content/uploads/2024/11/GIO.Corton.11.12.24-1.pdf"],
  ["CONTEMPO", "https://www.giotile.com/wp-content/uploads/2025/11/GIO.Contempo.11.19.25.pdf"],
  ["COTTO_CEMENTO", "https://www.giotile.com/wp-content/uploads/2024/05/GIO.Cotto_.Cemento.05.30.24-1.pdf"],
  ["CREMA", "https://www.giotile.com/wp-content/uploads/2019/05/GIO-Crema.pdf"],
  ["CRYSTAL_GLASS", "https://www.giotile.com/wp-content/uploads/2019/05/GIO-Crystal-Glass.pdf"],
  ["CURVE", "https://www.giotile.com/wp-content/uploads/2025/10/GIO.Curve_.10.01.25-1.pdf"],
  ["DORATO", "https://www.giotile.com/wp-content/uploads/2024/06/GIO_Dorato_06.04.2024.pdf"],
  ["ETERNAL", "https://www.giotile.com/wp-content/uploads/2020/10/GIO_ETERNAL_10.15.2020.pdf"],
  ["ELEMENT", "https://www.giotile.com/wp-content/uploads/2020/11/GIO-Element.pdf"],
  ["EMILIA", "https://www.giotile.com/wp-content/uploads/2024/07/GIO_Emilia_07.19.2024.pdf"],
  ["ESSENTIALS", "https://www.giotile.com/wp-content/uploads/2025/06/GIO.Essentials.06.13.25.pdf"],
  ["FARMHOUSE", "https://www.giotile.com/wp-content/uploads/2019/05/GIO-Farmhouse.pdf"],
  ["FIO", "https://www.giotile.com/wp-content/uploads/2025/02/GIO.Fio_.02.26.25.pdf"],
  ["FLUID", "https://www.giotile.com/wp-content/uploads/2019/05/GIO-Fluid.pdf"],
  ["FORZA", "https://www.giotile.com/wp-content/uploads/2024/06/GIO_Forza_06.04.2024.pdf"],
  ["FOUNTAINE", "https://www.giotile.com/wp-content/uploads/2019/05/GIO-Fountaine.pdf"],
  ["FRAMMENTO", "https://www.giotile.com/wp-content/uploads/2025/01/GIO_Frammento.09.12.2024.pdf"],
  ["FUSION", "https://www.giotile.com/wp-content/uploads/2024/06/GIO_Fusion_06.04.2024.pdf"],
  ["FREESTYLE", "https://www.giotile.com/wp-content/uploads/2019/05/GIO-Freestyle.pdf"],
  ["GEOMETRY_HEX", "https://www.giotile.com/wp-content/uploads/2023/02/GIO_GeometryHex_02.27.23.pdf"],
  ["GEOMETRY_OPTIONS", "https://www.giotile.com/wp-content/uploads/2025/10/GIO.Geo_.Options.09.30.25.pdf"],
  ["GEOMETRY_PICKET", "https://www.giotile.com/wp-content/uploads/2024/03/GIO_Geomtry.Picket.02.27.24.pdf"],
  ["GEOMETRY_SQUARED", "https://www.giotile.com/wp-content/uploads/2025/02/GIO.Geometry.SQ_.02.13.25.pdf"],
  ["GIO_THICK_1.0", "https://www.giotile.com/wp-content/uploads/2021/01/GIO_GIO.THICK_01.21.21.pdf"],
  ["GIO_THIN_5.5", "https://www.giotile.com/wp-content/uploads/2022/06/GIO_THIN5.5_05.24.22.pdf"],
  ["GLASS_&_STONE", "https://www.giotile.com/wp-content/uploads/2025/07/GIO.GlassStone.07.01.25.pdf"],
  ["GRANELLO", "https://www.giotile.com/wp-content/uploads/2025/03/GIO.Granello.03.18.25.pdf"],
  ["HANDMADE", "https://www.giotile.com/wp-content/uploads/2024/05/GIO.Handmade.05.30.24.pdf"],
  ["HEX_AG", "https://www.giotile.com/wp-content/uploads/2019/05/GIO-Hex_AG.pdf"],
  ["HEX_FRAME", "https://www.giotile.com/wp-content/uploads/2021/04/GIO-Hex_Frame.pdf"],
  ["HEX_LEONIS", "https://www.giotile.com/wp-content/uploads/2020/04/GIO-Hex_Leonis.pdf"],
  ["HEX_PRIMA", "https://www.giotile.com/wp-content/uploads/2022/05/GIO-Hex_Prima.pdf"],
  ["JURA", "https://www.giotile.com/wp-content/uploads/2023/11/GIO_Jura_11.02.23-1.pdf"],
  ["LAYERS", "https://www.giotile.com/wp-content/uploads/2025/06/GIO.Layers.06.23.25.pdf"],
  ["LINEA", "https://www.giotile.com/wp-content/uploads/2023/08/GIO_Linea_08.23.23.pdf"],
  ["LINEN", "https://www.giotile.com/wp-content/uploads/2019/05/GIO-Linen.pdf"],
  ["LUCE", "https://www.giotile.com/wp-content/uploads/2025/11/GIO.Luce_.01.03.25.pdf"],
  ["LUSTRO", "https://www.giotile.com/wp-content/uploads/2021/08/GIO_Lustro_08.17.21.pdf"],
  ["MACRO", "https://www.giotile.com/wp-content/uploads/2024/11/GIO.Macro_.11.12.24.pdf"],
  ["MARMI_LUX", "https://www.giotile.com/wp-content/uploads/2025/02/GIO.Marmi_.Lux_.02.25.25.pdf"],
  ["MARMI_REVIVAL", "https://www.giotile.com/wp-content/uploads/2025/08/GIO.Marmi_.Revival.08.18.25.pdf"],
  ["MARMI_SATIN", "https://www.giotile.com/wp-content/uploads/2024/05/GIO.Marmi_Satin.05.07.24.pdf"],
  ["MARMI_TREND", "https://www.giotile.com/wp-content/uploads/2021/01/GIO_Marmi_Trend_01.22.21.pdf"],
  ["MAXIMUS", "https://www.giotile.com/wp-content/uploads/2025/04/GIO.Maximus.04.11.25.pdf"],
  ["METALLO", "https://www.giotile.com/wp-content/uploads/2019/05/GIO-Metallo.pdf"],
  ["MIA", "https://www.giotile.com/wp-content/uploads/2023/08/GIO-Mia.pdf"],
  ["MIDTOWN", "https://www.giotile.com/wp-content/uploads/2026/03/GIO.Midtown.03.04.26.pdf"],
  ["MIRABELLA", "https://www.giotile.com/wp-content/uploads/2023/03/GIO_Mirabella_03.23.23.pdf"],
  ["MIX", "https://www.giotile.com/wp-content/uploads/2025/06/GIO.Mix_.06.13.25.pdf"],
  ["MODA", "https://www.giotile.com/wp-content/uploads/2019/05/GIO-Moda.pdf"],
  ["MODERN", "https://www.giotile.com/wp-content/uploads/2020/04/GIO_MODERN_04.09.20.pdf"],
  ["MOSA", "https://www.giotile.com/wp-content/uploads/2026/01/GIO.Mosa_.02.13.26.pdf"],
  ["MURAL", "https://www.giotile.com/wp-content/uploads/2025/09/GIO.Mural_.09.16.25.pdf"],
  ["NAXOS", "https://www.giotile.com/wp-content/uploads/2022/01/GIO-Naxos.pdf"],
  ["NEO_BRICK", "https://www.giotile.com/wp-content/uploads/2020/03/GIO_NEO_BRICK_03.27.20.pdf"],
  ["NEOLITH", "https://www.giotile.com/wp-content/uploads/2023/11/GIO_Neolith_11.29.23.pdf"],
  ["NUANCE", "https://www.giotile.com/wp-content/uploads/2024/09/GIO_Nuance.09.18.2024.pdf"],
  ["PADANA", "https://www.giotile.com/wp-content/uploads/2023/09/GIO_Padana_09.19.23.pdf"],
  ["PAINTWOOD", "https://www.giotile.com/wp-content/uploads/2019/05/GIO-Paintwood.pdf"],
  ["PASTEL", "https://www.giotile.com/wp-content/uploads/2021/03/GIO-Pastel.pdf"],
  ["PAVERS", "https://www.giotile.com/wp-content/uploads/2024/10/GIO_Pavers.10.11.2024.pdf"],
  ["PEBBLES", "https://www.giotile.com/wp-content/uploads/2025/03/GIO.Pebbles.03.27.25-1.pdf"],
  ["PETRA", "https://www.giotile.com/wp-content/uploads/2023/09/GIO_Petra_09.12.23.pdf"],
  ["PETRIFIED", "https://www.giotile.com/wp-content/uploads/2024/12/GIO_Petrified_12.17.24.pdf"],
  ["PICKET", "https://www.giotile.com/wp-content/uploads/2023/01/GIO_Picket_01.18.23.pdf"],
  ["3D_PIETRA", "https://www.giotile.com/wp-content/uploads/2025/10/GIO.3d.Pietra.09.29.25.pdf"],
  ["PIETRA_MARMI", "https://www.giotile.com/wp-content/uploads/2025/03/GIO.Pietra.Marmi_.03.27.25.pdf"],
  ["PIGMENT", "https://www.giotile.com/wp-content/uploads/2025/06/GIO.Pigment.06.03.25.pdf"],
  ["PLUSH", "https://www.giotile.com/wp-content/uploads/2024/08/GIO_Plush.08.21.2024.pdf"],
  ["PROGETTO", "https://www.giotile.com/wp-content/uploads/2026/03/GIO.Progetto.03.04.26.pdf"],
  ["PROVENZA", "https://www.giotile.com/wp-content/uploads/2021/02/GIO-Provenza.pdf"],
  ["QUARZO", "https://www.giotile.com/wp-content/uploads/2025/02/GIO.Quarzo.02.24.25.pdf"],
  ["QUARTZITE", "https://www.giotile.com/wp-content/uploads/2025/12/GIO.Quartzite.12.17.25.pdf"],
  ["RAPOLANO", "https://www.giotile.com/wp-content/uploads/2025/09/GIO.Rapolano.09.16.25.pdf"],
  ["REALE", "https://www.giotile.com/wp-content/uploads/2020/10/GIO_REALE_10.15.2020.pdf"],
  ["REFLECTIONS", "https://www.giotile.com/wp-content/uploads/2026/01/GIO.Reflections.01.29.26.pdf"],
  ["RENOIR", "https://www.giotile.com/wp-content/uploads/2024/04/GIO.Renoir.04.17.24.pdf"],
  ["RENA", "https://www.giotile.com/wp-content/uploads/2026/02/GIO.Rena_.02.05.26.pdf"],
  ["RETRO", "https://www.giotile.com/wp-content/uploads/2021/08/GIO_RETRO_07.08.19.pdf"],
  ["REX", "https://www.giotile.com/wp-content/uploads/2025/06/GIO.Rex_.06.03.25.pdf"],
  ["RIDGES", "https://www.giotile.com/wp-content/uploads/2025/02/GIO.Ridges.02.26.25.pdf"],
  ["RIGATO_2.0", "https://www.giotile.com/wp-content/uploads/2024/12/GIO_Rigato_12.16.24.pdf"],
  ["RIVEL", "https://www.giotile.com/wp-content/uploads/2019/08/GIO_RIVEL_07.24.19.pdf"],
  ["ROMAN_FORUM", "https://www.giotile.com/wp-content/uploads/2020/04/GIO_ROMAN_FORUM_04.06.20.pdf"],
  ["ROMBO", "https://www.giotile.com/wp-content/uploads/2025/06/GIO.Rombo_.06.03.25.pdf"],
  ["ROSATA", "https://www.giotile.com/wp-content/uploads/2025/02/GIO.Rosata.02.05.25.pdf"],
  ["ROYALE", "https://www.giotile.com/wp-content/uploads/2026/03/GIO.Royale.11.20.25.pdf"],
  ["SABBIOSA", "https://www.giotile.com/wp-content/uploads/2025/08/GIO.Sabbiosa.08.12.25.pdf"],
  ["SALENTO", "https://www.giotile.com/wp-content/uploads/2024/05/GIO.Salento.05.15.24.pdf"],
  ["SATIN_SOLUTIONS", "https://www.giotile.com/wp-content/uploads/2019/05/GIO-Satin_Solutions.pdf"],
  ["SELECT", "https://www.giotile.com/wp-content/uploads/2025/01/GIO.Select.01.16.31.pdf"],
  ["SHADES", "https://www.giotile.com/wp-content/uploads/2023/11/GIO_Shades_11.02.23.pdf"],
  ["SHELL", "https://www.giotile.com/wp-content/uploads/2025/12/GIO.Shell_.12.06.25.pdf"],
  ["SIMPLESTONE", "https://www.giotile.com/wp-content/uploads/2025/10/GIO.Simplestone.10.01.25-1.pdf"],
  ["SLAB_48", "https://www.giotile.com/wp-content/uploads/2023/06/GIO_Slab-48.pdf"],
  ["SLATE_ARDOSIA", "https://www.giotile.com/wp-content/uploads/2024/12/GIO_Slate.Ardosia_12.17.24.pdf"],
  ["SLATE_MONTAUK", "https://www.giotile.com/wp-content/uploads/2024/10/GIO_Slate.Montauk.10.03.2024.pdf"],
  ["SOHO", "https://www.giotile.com/wp-content/uploads/2026/02/GIO.Soho_.02.23.26.pdf"],
  ["STAINED_GLASS", "https://www.giotile.com/wp-content/uploads/2019/05/GIO-Stained-Glass.pdf"],
  ["STAINLESS_GLASS_STONE", "https://www.giotile.com/wp-content/uploads/2019/05/GIO-Stainless-Glass-Stone.pdf"],
  ["STAINLESS_STEEL", "https://www.giotile.com/wp-content/uploads/2021/08/GIO_StainlessSteel_08.16.21.pdf"],
  ["STATUARIETTO_BIANCO", "https://www.giotile.com/wp-content/uploads/2024/12/GIO_stat_12.18.24.pdf"],
  ["STONELINE", "https://www.giotile.com/wp-content/uploads/2025/10/GIO.Stoneline.10.27.25.pdf"],
  ["SUBWAY", "https://www.giotile.com/wp-content/uploads/2020/01/GIO_SUBWAY_01.02.20.pdf"],
  ["TAJ", "https://www.giotile.com/wp-content/uploads/2025/11/GIO.Taj_.11.17.25-1.pdf"],
  ["TERRACOTTA", "https://www.giotile.com/wp-content/uploads/2024/08/GIO_TerraCotta.08.06.2024.pdf"],
  ["TERRAZZO", "https://www.giotile.com/wp-content/uploads/2026/02/GIO.Terrazzo.02.04.26.pdf"],
  ["TOSCANA", "https://www.giotile.com/wp-content/uploads/2026/02/GIO.Toscana.02.18.26.pdf"],
  ["TIGERWOOD", "https://www.giotile.com/wp-content/uploads/2019/05/GIO-Tigerwood.pdf"],
  ["TRAFFIC", "https://www.giotile.com/wp-content/uploads/2019/05/GIO-Traffic.pdf"],
  ["TRAVERSE", "https://www.giotile.com/wp-content/uploads/2021/08/GIO_Traverse_08.12.21.pdf"],
  ["TREVIZO", "https://www.giotile.com/wp-content/uploads/2025/04/GIO.Trevizo.04.01.25.pdf"],
  ["TRIBECA", "https://www.giotile.com/wp-content/uploads/2022/01/GIO_Tribeca.01.19.22.pdf"],
  ["VEIN_GLASS", "https://www.giotile.com/wp-content/uploads/2019/05/GIO_VEIN_GLASS_05.17.19.pdf"],
  ["VENETO", "https://www.giotile.com/wp-content/uploads/2019/08/GIO_VENETO_08.07.19.pdf"],
  ["VERDE_ALPI", "https://www.giotile.com/wp-content/uploads/2025/06/GIO.Verde_.Alpi_.06.03.25.pdf"],
  ["VARENNA", "https://www.giotile.com/wp-content/uploads/2023/07/GIO_Varenna.07.17.23.pdf"],
  ["VERSAILLES", "https://www.giotile.com/wp-content/uploads/2019/05/GIO-Versailles.pdf"],
  ["VERVE", "https://www.giotile.com/wp-content/uploads/2019/05/GIO-Verve.pdf"],
  ["VINTAGE", "https://www.giotile.com/wp-content/uploads/2022/09/GIO_Vintage_09.08.22.pdf"],
  ["VITRO", "https://www.giotile.com/wp-content/uploads/2019/05/GIO-Vitro.pdf"],
  ["WORKSHOP", "https://www.giotile.com/wp-content/uploads/2019/05/GIO-Workshop.pdf"],
  ["WORKSHOP_2.0", "https://www.giotile.com/wp-content/uploads/2025/05/GIO.Workshop.05.20.25.pdf"],
  ["ZELLIGE", "https://www.giotile.com/wp-content/uploads/2026/03/GIO.Zellige.03.09.26.pdf"],
  ["CHALK", "https://www.giotile.com/wp-content/uploads/2023/09/GIO_Chalk_09.12.23.pdf"],
  ["ONYX_LUX", "https://www.giotile.com/wp-content/uploads/2023/11/GIO_Onyx.Lux_11.02.23.pdf"],
];

async function downloadPdf(url: string, filepath: string): Promise<boolean> {
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
  if (!fs.existsSync(PDF_DIR)) {
    fs.mkdirSync(PDF_DIR, { recursive: true });
  }

  const pdfMap: Record<string, string> = {};
  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const [name, url] of PDF_LINKS) {
    const filename = `${name.toLowerCase().replace(/[^a-z0-9_]/g, '_')}.pdf`;
    const filepath = path.join(PDF_DIR, filename);

    if (fs.existsSync(filepath)) {
      pdfMap[name] = `pdfs/${filename}`;
      console.log(`  ○ ${name} (already exists)`);
      skipped++;
      continue;
    }

    const success = await downloadPdf(url, filepath);
    if (success) {
      downloaded++;
      pdfMap[name] = `pdfs/${filename}`;
      console.log(`  ✓ ${name}`);
    } else {
      failed++;
      console.log(`  ✗ ${name} — failed`);
    }
  }

  fs.writeFileSync(MAP_FILE, JSON.stringify(pdfMap, null, 2));

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Done!`);
  console.log(`  Downloaded: ${downloaded}`);
  console.log(`  Already existed: ${skipped}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  PDF map: ${MAP_FILE}`);
}

main().catch(console.error);
