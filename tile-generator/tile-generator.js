const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

// === CORRIGÉ : le fichier source est dans tile-generator/
const inputImagePath = path.join(__dirname, "map.png");

// === Le dossier de sortie reste dans assets/tiles à la racine
const outputFolder = path.join(__dirname, "..", "assets", "tiles");

const tileSize = 1024;
const tileFormat = "png";

async function generateTiles() {
  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
  }

  const { width, height } = await sharp(inputImagePath).metadata();
  const cols = Math.ceil(width / tileSize);
  const rows = Math.ceil(height / tileSize);

  console.log(`📐 Image : ${width} x ${height}`);
  console.log(`🔳 Grille : ${cols} colonnes x ${rows} lignes`);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const left = x * tileSize;
      const top = y * tileSize;
      const w = Math.min(tileSize, width - left);
      const h = Math.min(tileSize, height - top);

      if (w <= 0 || h <= 0) continue;

      const tilePath = path.join(outputFolder, `${y}_${x}.${tileFormat}`);
      try {
        await sharp(inputImagePath)
          .extract({ left, top, width: w, height: h })
          .toFile(tilePath);
        console.log(`✅ Tuile : ${tilePath}`);
      } catch (err) {
        console.error(`❌ Erreur tuile ${x},${y} :`, err.message);
      }
    }
  }

  console.log("🎉 Tuiles générées dans :", outputFolder);
}

generateTiles().catch((err) => {
  console.error("💥 Erreur :", err.message);
});