import { useEffect, useRef } from 'react';

/** `#/show` (the manifest's "Quick show" shortcut) opens the overlay instead of being a page of its own. */
export function isShowHash(hash: string): boolean {
  return /^#\/?show(?:[/?]|$)/.test(hash);
}

/** Opens Quick show when the app is launched or navigated to `#/show`, then rewrites the URL to `#/create`. */
export function useShowRoute(open: () => void) {
  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  });
  useEffect(() => {
    const check = () => {
      if (!isShowHash(window.location.hash)) return;
      // replaceState: Back should not reopen the overlay, and a reload should not either.
      window.history.replaceState(window.history.state, '', '#/create');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
      openRef.current();
    };
    check();
    window.addEventListener('hashchange', check);
    return () => window.removeEventListener('hashchange', check);
  }, []);
}
