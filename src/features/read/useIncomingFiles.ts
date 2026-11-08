import { useEffect, useRef } from 'react';
import { consumeLaunchQueue, getLaunchQueue } from '@/pwa/launchQueue';
import { isImage, isShareRedirect, takeSharedFiles } from '@/pwa/shareTarget';

/**
 * Images handed to the installed app from outside: the OS share sheet (Web Share Target, via the service worker)
 * and "Open with" (File Handling, via launchQueue). The first image goes to `onImage`; nothing is kept afterwards.
 * `onEmpty` runs when a share arrived without a usable image.
 */
export function useIncomingFiles(onImage: (file: File) => void, onEmpty?: () => void) {
  const handlers = useRef({ onImage, onEmpty });
  useEffect(() => {
    handlers.current = { onImage, onEmpty };
  });

  useEffect(() => {
    // Goes through the ref, so a result that lands after a remount (StrictMode) still reaches the live view.
    const deliver = (files: File[]) => {
      const image = files.find(isImage);
      if (image) handlers.current.onImage(image);
      else handlers.current.onEmpty?.();
    };

    consumeLaunchQueue(getLaunchQueue(), deliver);

    // Always empty the share cache (a share that was never picked up must not linger); report only for a fresh share.
    const shared = isShareRedirect(window.location.hash);
    if (shared) window.history.replaceState(window.history.state, '', '#/read');
    void takeSharedFiles(globalThis.caches)
      .catch(() => [] as File[])
      .then((files) => {
        if (shared || files.length > 0) deliver(files);
      });
  }, []);
}
