import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

export default function LegalDialog({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Terms &amp; Privacy</DialogTitle>
          <DialogDescription>
            The short version: QRGo is free, runs on your device, and does no tracking.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 text-sm">
          <section className="flex flex-col gap-2">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Terms of Use
            </h3>
            <ul className="flex list-disc flex-col gap-1.5 pl-5 text-muted-foreground">
              <li>QRGo is free to use, for personal and commercial purposes, with no account required.</li>
              <li>
                The app is provided “as is”, without warranty of any kind. Always test your QR
                codes before printing or distributing them.
              </li>
              <li>
                You are solely responsible for the content you encode. Don&apos;t use QRGo to link
                to anything illegal or harmful.
              </li>
            </ul>
          </section>

          <section className="flex flex-col gap-2">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Privacy Policy
            </h3>
            <ul className="flex list-disc flex-col gap-1.5 pl-5 text-muted-foreground">
              <li>
                Everything runs locally in your browser. The content you type, your Wi-Fi
                passwords, contacts, and uploaded logos never leave your device.
              </li>
              <li>No accounts, no cookies, no analytics, no tracking of any kind.</li>
              <li>
                The only thing stored is your theme preference (light/dark), kept in your
                browser&apos;s local storage.
              </li>
            </ul>
          </section>

          <p className="text-xs text-muted-foreground">
            Questions? Reach out via{' '}
            <a
              href="https://hfps.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4"
            >
              hfps.dev
            </a>
            .
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
