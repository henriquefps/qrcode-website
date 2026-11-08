import { ScanIcon } from '@phosphor-icons/react';

/** Placeholder: the reader (camera, image, paste, result panel) replaces this component. */
export function ReadView() {
  return (
    <section aria-labelledby="read-title" className="flex flex-col items-center gap-3 px-4 py-16 text-center">
      <ScanIcon className="size-10 text-muted-foreground" aria-hidden="true" />
      <h2 id="read-title" className="text-lg font-semibold">
        Read a QR code
      </h2>
      <p className="max-w-md text-muted-foreground">The reader is coming soon: scan with your camera or open an image.</p>
    </section>
  );
}
