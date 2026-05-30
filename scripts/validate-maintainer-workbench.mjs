import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pixelArtPath = path.join(rootDir, 'assets', 'pixel-art', 'maintainer-workbench.png');
const demoPath = path.join(rootDir, 'demo', 'maintainer-workbench-demo.mp4');

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const MIN_CANVAS_SIZE = 64;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function readExistingFile(filePath, label) {
  const metadata = await stat(filePath);

  assert(metadata.isFile(), `${label} is not a file: ${filePath}`);
  assert(metadata.size > 0, `${label} is empty: ${filePath}`);

  return {
    bytes: await readFile(filePath),
    size: metadata.size,
  };
}

function inspectPng(buffer) {
  assert(buffer.length >= 33, 'PNG file is too small to include an IHDR chunk');
  assert(buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE), 'PNG signature is invalid');
  assert(buffer.readUInt32BE(8) === 13, 'PNG IHDR chunk length is invalid');
  assert(buffer.subarray(12, 16).toString('ascii') === 'IHDR', 'PNG IHDR chunk is missing');

  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  const bitDepth = buffer.readUInt8(24);
  const colorType = buffer.readUInt8(25);

  assert(width >= MIN_CANVAS_SIZE, `PNG width must be at least ${MIN_CANVAS_SIZE}px, got ${width}px`);
  assert(height >= MIN_CANVAS_SIZE, `PNG height must be at least ${MIN_CANVAS_SIZE}px, got ${height}px`);
  assert(bitDepth === 8, `PNG bit depth should be 8 for predictable review, got ${bitDepth}`);
  assert([2, 6].includes(colorType), `PNG color type should be RGB or RGBA, got ${colorType}`);

  return { width, height, bitDepth, colorType };
}

function inspectMp4(buffer) {
  assert(buffer.length >= 16, 'Demo video is too small to include an MP4 ftyp box');

  const firstBoxSize = buffer.readUInt32BE(0);
  const firstBoxType = buffer.subarray(4, 8).toString('ascii');
  const majorBrand = buffer.subarray(8, 12).toString('ascii').replace(/\0/g, '');

  assert(firstBoxSize >= 16, `MP4 ftyp box size is invalid: ${firstBoxSize}`);
  assert(firstBoxType === 'ftyp', `Demo video should start with an MP4 ftyp box, got ${firstBoxType}`);
  assert(majorBrand.length > 0, 'Demo video MP4 major brand is missing');

  return { majorBrand };
}

const [{ bytes: png, size: pngSize }, { bytes: mp4, size: demoSize }] = await Promise.all([
  readExistingFile(pixelArtPath, 'Pixel art image'),
  readExistingFile(demoPath, 'Demo video'),
]);

const pngInfo = inspectPng(png);
const demoInfo = inspectMp4(mp4);

console.log('Maintainer workbench pixel-art validation passed');
console.log(`- PNG: ${pngInfo.width}x${pngInfo.height}, bit depth ${pngInfo.bitDepth}, color type ${pngInfo.colorType}, ${pngSize} bytes`);
console.log(`- Demo: MP4 major brand ${demoInfo.majorBrand}, ${demoSize} bytes`);
