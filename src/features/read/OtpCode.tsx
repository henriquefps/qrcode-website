import { useEffect, useMemo, useState } from 'react';
import { CheckIcon, CopySimpleIcon, InfoIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatOtp, parseOtpParams, totp, totpCounter, totpRemaining } from '@/lib/otp';
import { copyText } from './copy';

const RING = 2 * Math.PI * 20;

/** Seconds-left ring around the countdown number. */
function TimeRing({ remaining, period }: { remaining: number; period: number }) {
  const low = remaining <= 5;
  return (
    <div className={cn('relative size-14 shrink-0', low ? 'text-warning' : 'text-primary')}>
      <svg viewBox="0 0 48 48" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="24" cy="24" r="20" fill="none" strokeWidth="4" className="stroke-muted" />
        <circle
          cx="24"
          cy="24"
          r="20"
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          stroke="currentColor"
          strokeDasharray={RING}
          strokeDashoffset={RING * (1 - remaining / period)}
          className="transition-[stroke-dashoffset] duration-1000 ease-linear motion-reduce:transition-none"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold tabular-nums text-foreground" aria-hidden="true">
        {remaining}
      </span>
    </div>
  );
}

/** The current TOTP code, computed locally from the scanned secret. HOTP only shows its counter. */
export function OtpCode({ text }: { text: string }) {
  const params = useMemo(() => parseOtpParams(text), [text]);
  const [now, setNow] = useState(() => Date.now());
  const [code, setCode] = useState<{ step: number; value: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const isTotp = params?.type === 'totp';
  const period = params?.period ?? 30;
  const step = totpCounter(now, period);

  useEffect(() => {
    if (!isTotp) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [isTotp]);

  useEffect(() => {
    if (!params || params.type !== 'totp') return;
    let cancelled = false;
    totp(params.secret, step * params.period * 1000, params.algorithm, params.digits, params.period)
      .then((value) => {
        if (!cancelled) setCode({ step, value });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [params, step]);

  if (!params) {
    return (
      <p className="flex items-start gap-2 rounded-lg border p-3 text-sm text-muted-foreground">
        <InfoIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        No code can be computed: the secret or a parameter of this link is not valid.
      </p>
    );
  }

  if (params.type === 'hotp') {
    return (
      <div className="flex items-start gap-2 rounded-lg border p-3 text-sm">
        <InfoIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <p>
          Counter-based code (HOTP){params.counter !== undefined ? <>, starting at counter <span className="font-semibold tabular-nums">{params.counter}</span></> : null}.
          <span className="text-muted-foreground"> The next code depends on the counter your authenticator keeps, so none is shown here.</span>
        </p>
      </div>
    );
  }

  const remaining = totpRemaining(now, period);
  const current = code?.step === step ? code.value : null;

  return (
    <div data-testid="otp-code" className="flex items-center gap-4 rounded-lg border p-3 md:p-4">
      <TimeRing remaining={remaining} period={period} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm text-muted-foreground" id="otp-label">
          Current code
        </span>
        <output aria-labelledby="otp-label" className="font-mono text-3xl font-semibold tabular-nums sm:text-4xl">
          {current ? formatOtp(current) : '–'}
        </output>
        <span className="text-sm text-muted-foreground">
          Changes in <span className="tabular-nums">{remaining}</span> s
        </span>
      </div>
      <Button
        variant="outline"
        disabled={!current}
        aria-label={copied ? 'Code copied' : 'Copy code'}
        onClick={() => {
          if (!current) return;
          void copyText(current, { secret: true }).then((ok) => {
            if (!ok) return;
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1800);
          });
        }}
      >
        {copied ? <CheckIcon data-icon="inline-start" /> : <CopySimpleIcon data-icon="inline-start" />}
        <span className="max-sm:sr-only">{copied ? 'Copied' : 'Copy'}</span>
      </Button>
    </div>
  );
}
