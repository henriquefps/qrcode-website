import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgPath = path.resolve('logo.png');
const publicDir = path.resolve('public');

async function generate() {
  console.log('Generating PNG icons from logo.png using Sharp...');
  const svgBuffer = fs.readFileSync(svgPath);

  // 1. icon-192.png
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'icon-192.png'));
  console.log('✔ Generated icon-192.png');

  // 2. icon-512.png
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-512.png'));
  console.log('✔ Generated icon-512.png');

  // 3. icon-maskable-192.png (PWA requirements want a 10% safety padding for maskable icons)
  // Let's create it with slightly downscaled logo and a clean background if we want, or simple fit.
  // Sharp can add padding:
  await sharp(svgBuffer)
    .resize(192, 192, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .png()
    .toFile(path.join(publicDir, 'icon-maskable-192.png'));
  console.log('✔ Generated icon-maskable-192.png');

  // 4. icon-maskable-512.png
  await sharp(svgBuffer)
    .resize(512, 512, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .png()
    .toFile(path.join(publicDir, 'icon-maskable-512.png'));
  console.log('✔ Generated icon-maskable-512.png');

  // 5. apple-touch-icon.png (180x180 px for iOS devices)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✔ Generated apple-touch-icon.png');

  // 6. favicon.png (32x32 px for standard favicon)
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('✔ Generated favicon.png');

  console.log('✨ All PWA icons generated successfully!');
}

generate().catch((err) => {
  console.error('❌ Failed to generate PWA icons:', err);
  process.exit(1);
});
