import { describe, expect, it, vi } from 'vitest';
import { consumeLaunchQueue, filesFromLaunch, type LaunchParamsLike } from './launchQueue';

const handle = (file: File) => ({ kind: 'file', getFile: async () => file });
const flush = () => new Promise((r) => setTimeout(r, 0));

describe('launchQueue', () => {
  it('reads file handles and skips directories and failures', async () => {
    const a = new File(['a'], 'a.png', { type: 'image/png' });
    const files = await filesFromLaunch({
      files: [handle(a), { kind: 'directory', getFile: async () => a }, { kind: 'file', getFile: () => Promise.reject(new Error('gone')) }],
    });
    expect(files).toEqual([a]);
    expect(await filesFromLaunch({})).toEqual([]);
  });

  it('hands launched files to the callback', async () => {
    let consumer: ((p: LaunchParamsLike) => void) | undefined;
    const queue = { setConsumer: vi.fn((c: (p: LaunchParamsLike) => void) => (consumer = c)) };
    const onFiles = vi.fn();
    consumeLaunchQueue(queue, onFiles);
    expect(queue.setConsumer).toHaveBeenCalledOnce();
    const img = new File(['x'], 'shot.webp', { type: 'image/webp' });
    consumer!({ files: [handle(img)] });
    await flush();
    expect(onFiles).toHaveBeenCalledWith([img]);
    // A launch without files (plain app start) does nothing.
    consumer!({ files: [] });
    await flush();
    expect(onFiles).toHaveBeenCalledOnce();
  });

  it('is a no-op without launchQueue', () => {
    expect(() => consumeLaunchQueue(undefined, vi.fn())).not.toThrow();
  });
});
