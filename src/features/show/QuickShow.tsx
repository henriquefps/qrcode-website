import { useCallback, useEffect, useRef, useState } from 'react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import QRCodeStyling from 'qr-code-styling';
import { ArrowsInIcon, ArrowsOutIcon, EyeIcon, EyeSlashIcon, PauseIcon, PlayIcon, QrCodeIcon, TimerIcon, WarningIcon, XIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { type Countdown, expired, extend, formatSeconds, isPaused, pause, refresh, remaining, resume, startCountdown } from './countdown';
import { densityFor } from './density';
import { keepScreenAwake } from './wakeLock';

interface QuickShowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RENDER_SIZE = 1000;
const INPUT_ID = 'quick-show-input';
/** Below this the countdown turns to the warning colour and screen readers hear it once. */
const WARN_MS = 10_000;

const focusInput = () => document.getElementById(INPUT_ID)?.focus();

/** Full-screen overlay: paste text, get a huge black-on-white QR. Closing unmounts the body, which clears the text. */
export function QuickShow({ open, onOpenChange }: QuickShowProps) {
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex flex-col bg-background outline-none"
          onOpenAutoFocus={(e) => {
            // Autofocus the text field, not the first button.
            e.preventDefault();
            focusInput();
          }}
        >
          <QuickShowBody onClose={close} />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/** Ticks every 250 ms and closes the overlay when the countdown runs out. */
function useAutoClose(onClose: () => void) {
  const [countdown, setCountdown] = useState<Countdown>(() => startCountdown(performance.now()));
  const [now, setNow] = useState(() => performance.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(performance.now()), 250);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => {
    if (expired(countdown, now)) onClose();
  }, [countdown, now, onClose]);
  const update = useCallback((change: (c: Countdown, at: number) => Countdown) => {
    const at = performance.now();
    setNow(at);
    setCountdown((c) => change(c, at));
  }, []);
  return { left: remaining(countdown, now), paused: isPaused(countdown), update };
}

function QuickShowBody({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState('');
  const [masked, setMasked] = useState(true);
  const [bright, setBright] = useState(false);
  const [awake, setAwake] = useState(false);
  const { left, paused, update } = useAutoClose(onClose);
  const holder = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const exitBright = useRef<HTMLButtonElement>(null);
  const qr = useRef<QRCodeStyling | null>(null);
  const density = densityFor(text);
  const showCode = text.length > 0 && !density.tooLong;
  const warn = !paused && left <= WARN_MS;
  const brightOn = bright && showCode;

  // Keep the screen on while Quick show is open (re-acquired after the tab comes back; ignored where unsupported).
  useEffect(() => keepScreenAwake(undefined, setAwake), []);

  useEffect(() => {
    const node = holder.current;
    if (!node || !showCode) return;
    const options = {
      width: RENDER_SIZE,
      height: RENDER_SIZE,
      type: 'svg' as const,
      data: text,
      margin: 80,
      qrOptions: { typeNumber: 0 as const, mode: 'Byte' as const, errorCorrectionLevel: density.level },
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
  }, [text, showCode, density.level]);

  // White full-screen mode uses the Fullscreen API where it exists; leaving browser full screen (Esc) leaves it too.
  useEffect(() => {
    if (!brightOn) return;
    const el = stage.current;
    let entered = false;
    const onChange = () => {
      if (document.fullscreenElement) entered = true;
      else if (entered) setBright(false);
    };
    document.addEventListener('fullscreenchange', onChange);
    el?.requestFullscreen?.({ navigationUI: 'hide' }).catch(() => {});
    exitBright.current?.focus();
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    };
  }, [brightOn]);

  const leaveBright = () => {
    setBright(false);
    requestAnimationFrame(focusInput);
  };

  const timer = (
    <div className="flex items-center gap-1">
      <span
        role="timer"
        aria-label={paused ? `Auto-close paused at ${formatSeconds(left)}` : `Closes in ${formatSeconds(left)}`}
        className={cn(
          'flex h-9 items-center gap-1.5 rounded-md border bg-card px-2.5 text-sm font-medium tabular-nums',
          warn ? 'border-warning text-warning' : 'text-muted-foreground',
        )}
      >
        <TimerIcon className="size-4" aria-hidden="true" />
        {paused ? 'Paused' : 'Closes in'} {formatSeconds(left)}
      </span>
      <span className="sr-only" aria-live="polite">
        {warn ? 'Quick show closes in 10 seconds.' : ''}
      </span>
      <Button variant="outline" aria-label="Add 60 seconds" onClick={() => update((c, at) => extend(c, at))} className="tabular-nums">
        +60 s
      </Button>
      <Button
        variant="outline"
        size="icon"
        aria-pressed={paused}
        aria-label={paused ? 'Resume auto-close' : 'Pause auto-close'}
        onClick={() => update((c, at) => (isPaused(c) ? resume(c, at) : pause(c, at)))}
      >
        {paused ? <PlayIcon /> : <PauseIcon />}
      </Button>
    </div>
  );

  const onTextChange = (value: string) => {
    setText(value);
    // Editing counts as activity: never close while someone is still typing.
    update((c, at) => refresh(c, at));
  };

  const inputProps = {
    id: INPUT_ID,
    autoComplete: 'off',
    spellCheck: false,
    'aria-label': 'Text to show as a QR code',
    'data-1p-ignore': true,
    'data-lpignore': 'true',
    placeholder: 'Paste a password or link',
    value: text,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onTextChange(e.target.value),
  };

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col gap-3 p-3 md:p-6" data-wake-lock={awake ? 'held' : 'none'}>
      <div className="flex flex-wrap items-center gap-2">
        <QrCodeIcon className="size-6 text-primary" weight="duotone" aria-hidden="true" />
        <DialogPrimitive.Title className="mr-auto text-lg font-semibold">Quick show</DialogPrimitive.Title>
        {!brightOn && <div className="max-sm:order-last max-sm:w-full">{timer}</div>}
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
        Paste a password or link to show it as a large QR code. It closes by itself after 60 seconds and nothing is saved.
      </DialogPrimitive.Description>

      <div className="flex items-start gap-2">
        {masked ? (
          <Input {...inputProps} type="password" className="h-11 min-w-0 flex-1 text-base" />
        ) : (
          <Textarea {...inputProps} rows={2} className="max-h-28 min-h-11 min-w-0 flex-1 resize-none font-mono text-base" />
        )}
        <Button
          variant="outline"
          size="icon-lg"
          aria-pressed={!masked}
          aria-label={masked ? 'Show text' : 'Hide text'}
          onClick={() => {
            setMasked((m) => !m);
            requestAnimationFrame(focusInput);
          }}
        >
          {masked ? <EyeIcon /> : <EyeSlashIcon />}
        </Button>
      </div>

      {(density.dense || showCode) && (
        <div className="flex flex-wrap items-center gap-2">
          {density.dense && !density.tooLong ? (
            <p role="status" className="mr-auto flex min-w-0 flex-1 basis-64 items-start gap-2 text-sm text-warning">
              <WarningIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>
                Long text makes a dense code ({density.modules}×{density.modules}). Using low error correction so it stays readable: go full screen
                and hold the phone steady.
              </span>
            </p>
          ) : (
            <span className="mr-auto" />
          )}
          {showCode && (
            <Button variant="outline" onClick={() => setBright(true)}>
              <ArrowsOutIcon data-icon="inline-start" />
              White full screen
            </Button>
          )}
        </div>
      )}

      <div
        ref={stage}
        className={cn(brightOn ? 'fixed inset-0 z-10 flex flex-col gap-3 bg-white p-3 md:p-6' : 'flex min-h-0 flex-1 flex-col')}
      >
        <div className="relative min-h-0 flex-1 [container-type:size]">
          <div className="absolute inset-0 flex items-center justify-center">
            {showCode ? (
              <div
                ref={holder}
                role="img"
                aria-label="QR code for the text you entered"
                data-testid="quick-show-qr"
                data-ecc={density.level}
                className="aspect-square h-[min(100cqw,100cqh)] overflow-hidden rounded-lg bg-white [&_canvas]:size-full [&_svg]:size-full"
              />
            ) : (
              <p role={density.tooLong ? 'alert' : undefined} className="max-w-sm text-center text-base text-muted-foreground">
                {density.tooLong ? 'That is too long to fit in a QR code. Shorten the text.' : 'Your QR code appears here as you type. Nothing is saved.'}
              </p>
            )}
          </div>
        </div>
        {brightOn && (
          <div className="mx-auto flex flex-wrap items-center justify-center gap-2 rounded-xl border bg-card p-2 text-card-foreground shadow-xs">
            {timer}
            <p className="px-1 text-sm text-muted-foreground">{awake ? 'Screen stays on. Turn brightness up.' : 'Turn brightness up.'}</p>
            <Button ref={exitBright} variant="outline" onClick={leaveBright}>
              <ArrowsInIcon data-icon="inline-start" />
              Exit full screen
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
