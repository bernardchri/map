/**
 * Convertit les frames PNG d'un dossier d'animation en WebP.
 *
 * Usage :
 *   node frames-to-webp.js <dossier>   # ex: node frames-to-webp.js ../assets/zone_sprite
 *   node frames-to-webp.js             # convertit tous les sous-dossiers de ../assets/
 */

const sharp  = require("sharp");
const fs     = require("fs");
const path   = require("path");

const QUALITY  = 85;
const ASSETS   = path.join(__dirname, "..", "assets");

function getFolders(target) {
  if (target) return [path.resolve(target)];
  return fs.readdirSync(ASSETS)
    .map(name => path.join(ASSETS, name))
    .filter(f => fs.statSync(f).isDirectory());
}

async function convertFolder(folder) {
  const files = fs.readdirSync(folder).filter(f => f.toLowerCase().endsWith(".png"));
  if (files.length === 0) return;

  console.log(`\n📂 ${folder} — ${files.length} fichier(s)`);

  for (const file of files) {
    const src  = path.join(folder, file);
    const dest = path.join(folder, file.replace(/\.png$/i, ".webp"));
    try {
      await sharp(src).webp({ quality: QUALITY }).toFile(dest);
      fs.unlinkSync(src); // supprime le PNG source
      console.log(`  ✅ ${file} → ${path.basename(dest)}`);
    } catch (err) {
      console.error(`  ❌ ${file} :`, err.message);
    }
  }
}

async function main() {
  const target  = process.argv[2];
  const folders = getFolders(target);

  for (const folder of folders) {
    await convertFolder(folder);
  }

  console.log("\n🎉 Conversion terminée.");
}

main().catch(err => console.error("💥", err.message));
