import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { iconDataUri } from '@/lib/iconify';
import type { StyleConfig } from '@/lib/preset';

export type IconLogoStatus = 'idle' | 'loading' | 'error';

/**
 * Keeps `logoFile` in step with the chosen icon and its color: fetches the icon from Iconify, turns it into a data URI
 * and stores it, so the code keeps rendering offline afterwards. An imported preset that already embeds the image is trusted as is.
 */
export function useIconLogo(style: StyleConfig, setStyle: Dispatch<SetStateAction<StyleConfig>>): { status: IconLogoStatus; retry: () => void } {
  const { logoPreset, logoIcon, logoIconColor, logoFile } = style;
  const [state, setState] = useState<{ key: string; status: 'error' } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const resolved = useRef('');
  const hasFile = useRef(false);
  useEffect(() => {
    hasFile.current = !!logoFile;
  });

  const key = logoPreset === 'icon' && logoIcon ? `${logoIcon}|${logoIconColor}|${attempt}` : '';

  useEffect(() => {
    if (!key) {
      resolved.current = '';
      return;
    }
    if (resolved.current === key) return;
    // First time for this selection with an image already there (imported preset): keep it.
    if (resolved.current === '' && hasFile.current) {
      resolved.current = key;
      return;
    }
    let live = true;
    iconDataUri(logoIcon, logoIconColor).then(
      (uri) => {
        if (!live) return;
        resolved.current = key;
        setState(null);
        setStyle((prev) => (prev.logoPreset === 'icon' && prev.logoIcon === logoIcon && prev.logoIconColor === logoIconColor ? { ...prev, logoFile: uri } : prev));
      },
      () => {
        if (!live) return;
        setState({ key, status: 'error' });
        setStyle((prev) => (prev.logoPreset === 'icon' && prev.logoIcon === logoIcon && prev.logoFile ? { ...prev, logoFile: '' } : prev));
      },
    );
    return () => {
      live = false;
    };
  }, [key, logoIcon, logoIconColor, setStyle]);

  const retry = useCallback(() => {
    resolved.current = '';
    setAttempt((n) => n + 1);
  }, []);

  if (!key) return { status: 'idle', retry };
  if (state?.key === key) return { status: 'error', retry };
  return { status: logoFile ? 'idle' : 'loading', retry };
}
