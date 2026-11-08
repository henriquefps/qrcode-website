import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const raw = readFileSync(new URL('../public/_headers', import.meta.url), 'utf8');
const all = raw.split(/\n(?=\S)/).find((block) => block.startsWith('/*')) ?? '';
const header = (name: string) => all.split('\n').find((l) => l.trim().startsWith(`${name}:`))?.split(/:(.*)/s)[1]?.trim() ?? '';
const csp = Object.fromEntries(
  header('Content-Security-Policy')
    .split(';')
    .map((d) => d.trim().split(/\s+/))
    .filter((d) => d[0])
    .map(([name, ...values]) => [name, values]),
);

describe('public/_headers security headers', () => {
  it('has a CSP with no remote origins or inline/eval scripts', () => {
    expect(csp['default-src']).toEqual(["'self'"]);
    expect(csp['script-src']).toEqual(["'self'", "'wasm-unsafe-eval'"]);
    expect(csp['object-src']).toEqual(["'none'"]);
    expect(csp['frame-ancestors']).toEqual(["'none'"]);
    expect(csp['base-uri']).toEqual(["'none'"]);
    for (const values of Object.values(csp)) for (const v of values) expect(v).not.toMatch(/^(https?:|\*)/);
  });

  it('allows the camera and screen capture for our own origin only', () => {
    const pp = header('Permissions-Policy');
    expect(pp).toContain('camera=(self)');
    expect(pp).toContain('display-capture=(self)');
    expect(pp).toContain('microphone=()');
    expect(pp).toContain('geolocation=()');
  });

  it('sends the simple hardening headers', () => {
    expect(header('Referrer-Policy')).toBe('no-referrer');
    expect(header('X-Content-Type-Options')).toBe('nosniff');
    expect(header('Cross-Origin-Opener-Policy')).toBe('same-origin');
  });

  it('keeps the cache rules', () => {
    expect(raw).toContain('/assets/*\n  Cache-Control: public, max-age=31536000, immutable');
    expect(raw).toContain('/sw.js\n  Cache-Control: no-cache');
  });
});
