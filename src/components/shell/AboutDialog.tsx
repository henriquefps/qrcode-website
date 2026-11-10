import { Button } from '@/components/ui/button';
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ResponsiveDialog';

export const REPO_URL = 'https://github.com/henriquefps/qrcode-website';

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a className="font-medium text-primary underline-offset-4 hover:underline" href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}

const PRIVACY = [
  ['No account', 'Open the page and use it. There is nothing to sign up for.'],
  ['Nothing leaves your device', 'Codes are drawn and read in your browser. What you type, scan or upload is never sent to a server and never stored.'],
  ['Icon browsing', 'The only requests to another server go to the Iconify API, when you open the Logo section to browse or pick an icon. They carry icon names or your search words, never your code content.'],
  ['No tracking', 'No analytics, no cookies and no ads. The only thing saved in this browser is your theme and palette choice.'],
] as const;

const CREDITS = [
  ['Phosphor icons', 'MIT license', 'https://github.com/phosphor-icons/homepage/blob/master/LICENSE'],
  ['Lucide icons (logo picker)', 'ISC license', 'https://github.com/lucide-icons/lucide/blob/main/LICENSE'],
  ['Simple Icons (logo picker; brand marks belong to their owners)', 'CC0 1.0', 'https://github.com/simple-icons/simple-icons/blob/develop/LICENSE.md'],
  ['Other logo icons from Iconify', 'each collection\'s own license, shown next to the selected icon', 'https://iconify.design/'],
  ['Inter', 'SIL Open Font License 1.1', 'https://openfontlicense.org/'],
  ['qr-code-styling', 'MIT license', 'https://github.com/kozakdenys/qr-code-styling'],
  ['zxing-wasm and barcode-detector (camera fallback)', 'MIT license', 'https://github.com/Sec-ant/zxing-wasm'],
  ['ZXing-C++ (compiled into the fallback decoder)', 'Apache License 2.0', 'https://github.com/zxing-cpp/zxing-cpp/blob/master/LICENSE'],
  ['React, Radix UI, shadcn/ui, Tailwind CSS', 'MIT license', 'https://ui.shadcn.com/'],
] as const;

export function AboutDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>About Qrcode</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>Create and read QR codes. Free, open source, runs in your browser.</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody className="flex flex-col gap-5 text-[0.9375rem]">
          <p className="text-muted-foreground">
            Version <span className="font-mono text-[0.8125rem]">{__APP_VERSION__}</span> · Made by <ExternalLink href="https://hfps.dev">Henrique Silva</ExternalLink>. Formerly QRGo.
          </p>
          <section className="flex flex-col gap-2" aria-label="Privacy">
            <h3 className="eyebrow">Privacy</h3>
            <ul className="flex flex-col gap-2">
              {PRIVACY.map(([title, text]) => (
                <li key={title}>
                  <span className="font-medium">{title}.</span> <span className="text-muted-foreground">{text}</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="flex flex-col gap-2" aria-label="License">
            <h3 className="eyebrow">License</h3>
            <p>
              <span className="font-medium">Free and open source, AGPL-3.0-or-later.</span>{' '}
              <span className="text-muted-foreground">
                Qrcode is free software under the GNU Affero General Public License, version 3 or later, provided without warranty. Test your codes before you print
                them. The complete source code is available: <ExternalLink href={REPO_URL}>source on GitHub</ExternalLink>.
              </span>
            </p>
          </section>
          <section className="flex flex-col gap-2" aria-label="Credits">
            <h3 className="eyebrow">Third-party notices</h3>
            <ul className="flex flex-col gap-2 text-sm">
              {CREDITS.map(([name, license, href]) => (
                <li key={name}>
                  <ExternalLink href={href}>{name}</ExternalLink> <span className="text-muted-foreground">· {license}</span>
                </li>
              ))}
            </ul>
          </section>
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
