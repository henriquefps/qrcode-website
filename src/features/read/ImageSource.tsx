import { useRef } from 'react';
import { ImageIcon, UploadSimpleIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';

interface ImageSourceProps {
  busy: boolean;
  onFile: (file: File) => void;
}

const isMac = typeof navigator !== 'undefined' && /mac|iphone|ipad/i.test(navigator.userAgent);

/** File picker. Drag-and-drop and paste are handled by ReadView so they work on every tab. */
export function ImageSource({ busy, onFile }: ImageSourceProps) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/40 px-4 py-12 text-center">
      <ImageIcon className="size-8 text-muted-foreground" aria-hidden="true" />
      <div className="flex max-w-sm flex-col gap-1">
        <p className="text-base font-semibold">Open an image</p>
        <p className="text-sm text-muted-foreground">
          Choose a file, drop it here, or paste a screenshot with {isMac ? '⌘V' : 'Ctrl+V'}.
        </p>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-label="Image file"
        data-testid="image-input"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) onFile(file);
        }}
      />
      <Button onClick={() => input.current?.click()} disabled={busy}>
        <UploadSimpleIcon data-icon="inline-start" />
        {busy ? 'Reading…' : 'Choose image'}
      </Button>
    </div>
  );
}
