const sharp = require("sharp");
const path  = require("path");

const input  = path.join(__dirname, "map.jpg");
const output = path.join(__dirname, "..", "assets", "map-mini.webp");

sharp(input)
  .resize(320)          // largeur 320px, hauteur calculée automatiquement
  .webp({ quality: 80 })
  .toFile(output)
  .then(info => console.log(`✅ Minimap générée : ${output} (${info.width}x${info.height})`))
  .catch(err => console.error("❌ Erreur :", err.message));
