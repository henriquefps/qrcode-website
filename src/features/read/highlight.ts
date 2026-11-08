import type { DetectedCode } from '@/lib/decode';

/** Outlines detected codes on an overlay canvas laid over an `object-contain` video. Color comes from the canvas' CSS `color`. */
export function drawHighlights(canvas: HTMLCanvasElement, video: HTMLVideoElement, codes: DetectedCode[]) {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, w, h);
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) return;
  const scale = Math.min(w / vw, h / vh);
  const ox = (w - vw * scale) / 2;
  const oy = (h - vh * scale) / 2;
  const color = getComputedStyle(canvas).color;
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  for (const code of codes) {
    if (!code.corners?.length) continue;
    ctx.beginPath();
    code.corners.forEach((p, i) => (i === 0 ? ctx.moveTo(ox + p.x * scale, oy + p.y * scale) : ctx.lineTo(ox + p.x * scale, oy + p.y * scale)));
    ctx.closePath();
    ctx.globalAlpha = 1;
    ctx.stroke();
    ctx.globalAlpha = 0.2;
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
