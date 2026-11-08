import { describe, expect, it, vi } from 'vitest';
import { handle } from './routing';

const env = () => ({ ASSETS: { fetch: vi.fn(async () => new Response('asset')) } });

describe('worker routing', () => {
  it('serves assets for qrcode.hfps.dev', async () => {
    const e = env();
    const res = await handle(new Request('https://qrcode.hfps.dev/foo?x=1'), e);
    expect(await res.text()).toBe('asset');
    expect(e.ASSETS.fetch).toHaveBeenCalledOnce();
  });

  it('serves the real sw.js from assets on the new host', async () => {
    const e = env();
    await handle(new Request('https://qrcode.hfps.dev/sw.js'), e);
    expect(e.ASSETS.fetch).toHaveBeenCalledOnce();
  });

  it('redirects the old host keeping path and query with 301', async () => {
    const e = env();
    const res = await handle(new Request('https://qrgo.hfps.dev/a/b?c=d'), e);
    expect(res.status).toBe(301);
    expect(res.headers.get('location')).toBe('https://qrcode.hfps.dev/a/b?c=d');
    expect(e.ASSETS.fetch).not.toHaveBeenCalled();
  });

  it('redirects the old root', async () => {
    const res = await handle(new Request('https://qrgo.hfps.dev/'), env());
    expect(res.headers.get('location')).toBe('https://qrcode.hfps.dev/');
  });

  it('serves a self-unregistering service worker on the old host', async () => {
    const e = env();
    const res = await handle(new Request('https://qrgo.hfps.dev/sw.js'), e);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('javascript');
    expect(res.headers.get('cache-control')).toContain('no-cache');
    const body = await res.text();
    expect(body).toContain('registration.unregister()');
    expect(body).toContain('caches.delete');
    expect(body).toContain('clients.matchAll');
    expect(body).toContain('https://qrcode.hfps.dev/');
    expect(e.ASSETS.fetch).not.toHaveBeenCalled();
  });

  it('sends a share that reaches the Worker (no service worker yet) to Read without storing it', async () => {
    const e = env();
    const form = new FormData();
    form.append('image', new File([new Uint8Array([1, 2, 3])], 'shot.png', { type: 'image/png' }));
    const request = new Request('https://qrcode.hfps.dev/share-target', { method: 'POST', body: form });
    const res = await handle(request, e);
    expect(res.status).toBe(303);
    expect(res.headers.get('location')).toBe('https://qrcode.hfps.dev/#/read');
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(await res.text()).toBe('');
    expect(request.bodyUsed).toBe(false);
    expect(e.ASSETS.fetch).not.toHaveBeenCalled();
  });

  it('also redirects a GET to /share-target', async () => {
    const res = await handle(new Request('https://qrcode.hfps.dev/share-target'), env());
    expect(res.status).toBe(303);
    expect(res.headers.get('location')).toBe('https://qrcode.hfps.dev/#/read');
  });
});
