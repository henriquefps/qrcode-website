import { useCallback, useEffect, useRef, useState } from 'react';
import { CameraIcon, ImageIcon, UploadSimpleIcon, WarningIcon } from '@phosphor-icons/react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { detectFromBlob, type DetectedCode } from '@/lib/decode';
import { CameraScanner } from './CameraScanner';
import { ImageSource } from './ImageSource';
import { ResultPanel } from './ResultPanel';
import { useIncomingFiles } from './useIncomingFiles';

type Source = 'camera' | 'image';

/** Picks the first image out of a clipboard or drop payload. */
function imageFrom(files: FileList | null | undefined): File | undefined {
  return Array.from(files ?? []).find((f) => f.type.startsWith('image/'));
}

export function ReadView() {
  const [source, setSource] = useState<Source>('camera');
  const [codes, setCodes] = useState<DetectedCode[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);

  const readImage = useCallback(async (file: Blob) => {
    setBusy(true);
    setMessage(null);
    try {
      const found = await detectFromBlob(file);
      if (found.length === 0) setMessage('No QR code was found in that image. Try a sharper or larger picture.');
      else setCodes(found);
    } catch {
      setMessage('Could not read that image. Make sure it is a PNG, JPEG or WebP file.');
    } finally {
      setBusy(false);
    }
  }, []);

  // Images shared to the installed app or opened with it (share sheet, "Open with").
  useIncomingFiles(
    (file) => {
      setCodes([]);
      setSource('image');
      void readImage(file);
    },
    () => {
      setSource('image');
      setMessage('No image arrived. Share or open a PNG, JPEG, WebP or GIF file.');
    },
  );

  // Paste an image (screenshot) anywhere while Read is active.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const file = imageFrom(e.clipboardData?.files);
      if (!file) return;
      e.preventDefault();
      setSource('image');
      void readImage(file);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [readImage]);

  const reset = () => {
    setCodes([]);
    setMessage(null);
  };

  return (
    <section
      aria-labelledby="read-title"
      className="relative mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6 md:px-6 md:py-8"
      onDragEnter={(e) => {
        if (!e.dataTransfer.types.includes('Files')) return;
        dragDepth.current += 1;
        setDragging(true);
      }}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes('Files')) e.preventDefault();
      }}
      onDragLeave={() => {
        dragDepth.current = Math.max(0, dragDepth.current - 1);
        if (dragDepth.current === 0) setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        dragDepth.current = 0;
        setDragging(false);
        const file = imageFrom(e.dataTransfer.files);
        if (file) {
          setSource('image');
          void readImage(file);
        } else {
          setMessage('That file is not an image.');
        }
      }}
    >
      <div className="flex flex-col gap-1">
        <h2 id="read-title" className="text-lg font-semibold">
          Read a QR code
        </h2>
        <p className="text-sm text-muted-foreground">Scan with a camera, open an image or paste a screenshot. Everything stays on this device.</p>
      </div>

      {codes.length > 0 ? (
        <ResultPanel codes={codes} onScanAgain={reset} />
      ) : (
        <>
          <Tabs value={source} onValueChange={(v) => setSource(v as Source)}>
            <TabsList aria-label="Source">
              <TabsTrigger value="camera" className="gap-1.5 px-3">
                <CameraIcon aria-hidden="true" />
                Camera
              </TabsTrigger>
              <TabsTrigger value="image" className="gap-1.5 px-3">
                <ImageIcon aria-hidden="true" />
                Image
              </TabsTrigger>
            </TabsList>
          </Tabs>
          {message && (
            <p role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/40 p-3 text-sm text-destructive">
              <WarningIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {message}
            </p>
          )}
          {source === 'camera' ? <CameraScanner onDetect={setCodes} /> : <ImageSource busy={busy} onFile={(f) => void readImage(f)} />}
        </>
      )}

      {dragging && (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary bg-card/90 text-primary">
          <UploadSimpleIcon className="size-8" aria-hidden="true" />
          <p className="text-base font-semibold">Drop an image to read it</p>
        </div>
      )}
    </section>
  );
}
