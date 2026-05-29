const fs = require('fs');
const path = require('path');

const PIXEL_ART_DIR = path.join(__dirname, '..', 'assets', 'pixel-art');
const VALID_EXTENSIONS = ['.png', '.jpg', '.jpeg'];
const MIN_SIZE = 64;

function validatePixelArt() {
  const files = fs.readdirSync(PIXEL_ART_DIR);
  const imageFiles = files.filter(f => {
    const ext = path.extname(f).toLowerCase();
    return VALID_EXTENSIONS.includes(ext);
  });

  if (imageFiles.length === 0) {
    console.error('No pixel art images found');
    process.exit(1);
  }

  for (const file of imageFiles) {
    const filePath = path.join(PIXEL_ART_DIR, file);
    const stats = fs.statSync(filePath);
    
    // Check minimum file size (rough heuristic for 64x64 image)
    if (stats.size < 100) {
      console.error(`File ${file} appears too small to be 64x64`);
      process.exit(1);
    }
  }

  console.log(`Validated ${imageFiles.length} pixel art image(s)`);
}

if (require.main === module) {
  try {
    validatePixelArt();
  } catch (err) {
    console.error('Validation failed:', err.message);
    process.exit(1);
  }
}

module.exports = { validatePixelArt };