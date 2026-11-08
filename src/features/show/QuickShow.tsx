import { useEffect, useRef, useState } from 'react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import QRCodeStyling from 'qr-code-styling';
import { EyeIcon, EyeSlashIcon, QrCodeIcon, XIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface QuickShowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Highest byte capacity of a QR code at error correction M. */
const MAX_BYTES = 2331;
const RENDER_SIZE = 1000;

/** Full-screen overlay: paste text, get a huge black-on-white QR. Closing unmounts the body, which clears the text. */
export function QuickShow({ open, onOpenChange }: QuickShowProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex flex-col bg-background outline-none"
          onOpenAutoFocus={(e) => {
            // Autofocus the text field, not the first button.
            e.preventDefault();
            document.getElementById('quick-show-input')?.focus();
          }}
        >
          <QuickShowBody />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function QuickShowBody() {
  const [text, setText] = useState('');
  const [masked, setMasked] = useState(false);
  const holder = useRef<HTMLDivElement>(null);
  const qr = useRef<QRCodeStyling | null>(null);
  const bytes = new TextEncoder().encode(text).length;
  const tooLong = bytes > MAX_BYTES;
  const showCode = text.length > 0 && !tooLong;

  useEffect(() => {
    const node = holder.current;
    if (!node || !showCode) return;
    const options = {
      width: RENDER_SIZE,
      height: RENDER_SIZE,
      type: 'svg' as const,
      data: text,
      margin: 80,
      qrOptions: { typeNumber: 0 as const, mode: 'Byte' as const, errorCorrectionLevel: 'M' as const },
      backgroundOptions: { color: '#ffffff' },
      dotsOptions: { type: 'square' as const, color: '#000000' },
      cornersSquareOptions: { type: 'square' as const, color: '#000000' },
      cornersDotOptions: { type: 'square' as const, color: '#000000' },
    };
    if (qr.current) {
      qr.current.update(options);
    } else {
      qr.current = new QRCodeStyling(options);
      node.replaceChildren();
      qr.current.append(node);
    }
  }, [text, showCode]);

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col gap-3 p-3 md:p-6">
      <div className="flex items-center gap-2">
        <QrCodeIcon className="size-6 text-primary" weight="duotone" aria-hidden="true" />
        <DialogPrimitive.Title className="mr-auto text-lg font-semibold">Quick show</DialogPrimitive.Title>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogPrimitive.Close asChild>
              <Button variant="outline" aria-label="Close and clear (Esc)">
                <XIcon data-icon="inline-start" />
                Close
              </Button>
            </DialogPrimitive.Close>
          </TooltipTrigger>
          <TooltipContent>Closes and clears the text (Esc)</TooltipContent>
        </Tooltip>
      </div>
      <DialogPrimitive.Description className="sr-only">
        Paste a password or link to show it as a large QR code. Nothing is saved.
      </DialogPrimitive.Description>

      <div className="flex items-start gap-2">
        {masked ? (
          <Input
            id="quick-show-input"
            type="password"
            autoComplete="off"
            spellCheck={false}
            aria-label="Text to show as a QR code"
            placeholder="Paste a password or link"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="h-11 min-w-0 flex-1 text-base"
          />
        ) : (
          <Textarea
            id="quick-show-input"
            rows={2}
            autoComplete="off"
            spellCheck={false}
            aria-label="Text to show as a QR code"
            placeholder="Paste a password or link"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="max-h-28 min-h-11 min-w-0 flex-1 resize-none font-mono text-base"
          />
        )}
        <Button
          variant="outline"
          size="icon-lg"
          aria-pressed={masked}
          aria-label={masked ? 'Show text' : 'Hide text'}
          onClick={() => {
            setMasked((m) => !m);
            requestAnimationFrame(() => document.getElementById('quick-show-input')?.focus());
          }}
        >
          {masked ? <EyeIcon /> : <EyeSlashIcon />}
        </Button>
      </div>

      <div className="relative min-h-0 flex-1 [container-type:size]">
        <div className="absolute inset-0 flex items-center justify-center">
          {showCode ? (
            <div
              ref={holder}
              role="img"
              aria-label="QR code for the text you entered"
              data-testid="quick-show-qr"
              className="aspect-square h-[min(100cqw,100cqh)] overflow-hidden rounded-lg bg-white [&_canvas]:size-full [&_svg]:size-full"
            />
          ) : (
            <p role={tooLong ? 'alert' : undefined} className="max-w-sm text-center text-base text-muted-foreground">
              {tooLong ? 'That is too long to fit in a QR code. Shorten the text.' : 'Your QR code appears here as you type. Nothing is saved.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
