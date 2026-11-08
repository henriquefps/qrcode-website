// Maskable PWA icons: full-bleed blue square, glyph inside the 80% safe zone.
// Run after build-icons.mjs:  NODE_PATH=<sharp dir>/node_modules node scripts/build-maskable.mjs
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const sharp = createRequire(resolve('package.json'))('sharp');
const glyph = (await readFile('scripts/glyph.svg', 'utf8')).replace(/<!--[\s\S]*?-->/g, '').replaceAll('currentColor', '#fff');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" fill="#2f6fb5"/><g transform="translate(26 26) scale(0.59375)">${glyph}</g></svg>`;
for (const size of [192, 512]) {
  await sharp(Buffer.from(svg), { density: (72 * size) / 128 * 2 }).resize(size, size).png().toFile(`public/icon-maskable-${size}.png`);
}
