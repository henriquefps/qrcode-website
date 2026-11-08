import { describe, expect, it } from 'vitest';
import { SHARE_CACHE, handleShareTarget, isShareRedirect, isShareTargetRequest, takeSharedFiles } from './shareTarget';

/** Minimal in-memory CacheStorage. */
function memoryCaches() {
  const stores = new Map<string, Map<string, Response>>();
  const open = async (name: string) => {
    if (!stores.has(name)) stores.set(name, new Map());
    const store = stores.get(name)!;
    return {
      put: async (key: string, res: Response) => void store.set(key, res),
      keys: async () => [...store.keys()].map((k) => new Request(k)),
      match: async (req: Request) => store.get(req.url)?.clone(),
    };
  };
  const caches = {
    open,
    has: async (name: string) => stores.has(name),
    delete: async (name: string) => stores.delete(name),
  } as unknown as CacheStorage;
  return { caches, stores };
}

const png = (name: string, bytes = [137, 80, 78, 71]) => new File([new Uint8Array(bytes)], name, { type: 'image/png' });

function shareRequest(files: (File | string)[]) {
  const form = new FormData();
  for (const f of files) form.append('image', f);
  return new Request('https://qrcode.hfps.dev/share-target', { method: 'POST', body: form });
}

describe('share target', () => {
  it('recognises the POST to /share-target only', () => {
    expect(isShareTargetRequest(shareRequest([]))).toBe(true);
    expect(isShareTargetRequest(new Request('https://qrcode.hfps.dev/share-target'))).toBe(false);
    expect(isShareTargetRequest(new Request('https://qrcode.hfps.dev/other', { method: 'POST' }))).toBe(false);
  });

  it('parks images, redirects to Read, and the page takes and deletes them', async () => {
    const { caches, stores } = memoryCaches();
    const res = await handleShareTarget(shareRequest([png('a b.png', [1, 2, 3]), 'not a file', png('second.png')]), caches);
    expect(res.status).toBe(303);
    expect(res.headers.get('Location')).toBe('https://qrcode.hfps.dev/#/read?shared=1');
    expect(stores.get(SHARE_CACHE)?.size).toBe(2);

    const files = await takeSharedFiles(caches);
    expect(files.map((f) => f.name)).toEqual(['a b.png', 'second.png']);
    expect(files[0].type).toBe('image/png');
    expect([...new Uint8Array(await files[0].arrayBuffer())]).toEqual([1, 2, 3]);
    // Gone right after the handoff.
    expect(stores.has(SHARE_CACHE)).toBe(false);
    expect(await takeSharedFiles(caches)).toEqual([]);
  });

  it('ignores non-image files and still redirects', async () => {
    const { caches, stores } = memoryCaches();
    const res = await handleShareTarget(shareRequest([new File(['hi'], 'a.txt', { type: 'text/plain' })]), caches);
    expect(res.status).toBe(303);
    expect(stores.has(SHARE_CACHE)).toBe(false);
  });

  it('survives a body that is not multipart', async () => {
    const { caches } = memoryCaches();
    const res = await handleShareTarget(new Request('https://qrcode.hfps.dev/share-target', { method: 'POST', body: 'x' }), caches);
    expect(res.status).toBe(303);
  });

  it('drops an earlier share that was never picked up', async () => {
    const { caches } = memoryCaches();
    await handleShareTarget(shareRequest([png('old.png'), png('old2.png')]), caches);
    await handleShareTarget(shareRequest([png('new.png')]), caches);
    expect((await takeSharedFiles(caches)).map((f) => f.name)).toEqual(['new.png']);
  });

  it('works without Cache Storage', async () => {
    expect(await takeSharedFiles(undefined)).toEqual([]);
  });

  it('detects the redirect hash', () => {
    expect(isShareRedirect('#/read?shared=1')).toBe(true);
    expect(isShareRedirect('#/read?x=2&shared=1')).toBe(true);
    expect(isShareRedirect('#/read')).toBe(false);
    expect(isShareRedirect('#/create?shared=1')).toBe(false);
  });
});
