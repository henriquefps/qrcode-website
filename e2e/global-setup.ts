import { mkdirSync, writeFileSync } from 'node:fs';
import QRCode from 'qrcode';
import { CAMERA_TEXT, CAMERA_Y4M, FIXTURES, fixture } from './paths';
import { CODES } from './codes';

/** A QR code as a YUV4MPEG2 video (one grey frame, looped by Chrome's fake camera). */
function y4m(text: string, width = 640, height = 480): Buffer {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: 'M' });
  const quiet = 4;
  const total = modules.size + quiet * 2;
  const scale = Math.floor((Math.min(width, height) * 0.8) / total);
  const ox = Math.floor((width - total * scale) / 2);
  const oy = Math.floor((height - total * scale) / 2);
  const y = Buffer.alloc(width * height, 0xc8); // light grey background, like a desk
  for (let py = 0; py < total * scale; py++) {
    for (let px = 0; px < total * scale; px++) {
      const mx = Math.floor(px / scale) - quiet;
      const my = Math.floor(py / scale) - quiet;
      const dark = mx >= 0 && my >= 0 && mx < modules.size && my < modules.size && modules.get(my, mx);
      y[(oy + py) * width + ox + px] = dark ? 0x10 : 0xf0;
    }
  }
  const chroma = Buffer.alloc((width / 2) * (height / 2) * 2, 0x80);
  return Buffer.concat([Buffer.from(`YUV4MPEG2 W${width} H${height} F10:1 Ip A1:1 C420jpeg\nFRAME\n`), y, chroma]);
}

export default async function globalSetup() {
  mkdirSync(FIXTURES, { recursive: true });
  writeFileSync(CAMERA_Y4M, y4m(CAMERA_TEXT));
  for (const [name, text] of Object.entries(CODES)) {
    writeFileSync(fixture(`${name}.png`), await QRCode.toBuffer(text, { width: 480, margin: 4, errorCorrectionLevel: 'M' }));
  }
}
