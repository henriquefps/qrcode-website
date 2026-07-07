import React, { useState } from 'react';
import LegalDialog from './LegalDialog';

export default function Footer() {
  const [legalOpen, setLegalOpen] = useState(false);

  return (
    <footer className="mt-auto flex flex-col items-center gap-2 border-t pt-6 text-center">
      <p className="text-sm text-muted-foreground">
        © 2026 QRGo · Developed by{' '}
        <a
          href="https://hfps.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground underline underline-offset-4"
        >
          Henrique Silva
        </a>
        . Everything runs in your browser — no data ever leaves your device.{' '}
        <button
          type="button"
          onClick={() => setLegalOpen(true)}
          className="cursor-pointer font-medium text-foreground underline underline-offset-4"
        >
          Terms &amp; Privacy
        </button>
      </p>
      <p className="flex flex-wrap justify-center gap-3 text-[0.65rem] text-muted-foreground/70">
        <a
          href="https://www.flaticon.com/free-icons/whatsapp"
          target="_blank"
          rel="noopener noreferrer"
        >
          WhatsApp icon by Freepik — Flaticon
        </a>
        <a
          href="https://www.flaticon.com/free-icons/instagram"
          target="_blank"
          rel="noopener noreferrer"
        >
          Instagram icon by cobynecz — Flaticon
        </a>
      </p>

      <LegalDialog open={legalOpen} onOpenChange={setLegalOpen} />
    </footer>
  );
}
