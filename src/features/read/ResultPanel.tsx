import { useMemo, useState } from 'react';
import {
  AddressBookIcon,
  ArrowCounterClockwiseIcon,
  ArrowSquareOutIcon,
  ChatTextIcon,
  CheckIcon,
  CopySimpleIcon,
  EnvelopeSimpleIcon,
  EyeIcon,
  EyeSlashIcon,
  KeyIcon,
  MapPinIcon,
  PhoneIcon,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DetectedCode } from '@/lib/decode';
import { parseContent, type Field } from '@/lib/parse';
import { actionsFor, type Action, type ActionIcon } from '@/lib/actions';
import { copyText } from './copy';
import { OtpCode } from './OtpCode';

const MASK = '••••••••••••';

/** Copies on user action only; secrets are cleared from the clipboard after 30 s (countdown toast). */
function CopyButton({
  value,
  label,
  text = 'Copy',
  secret = false,
  size = 'default',
  variant = 'outline',
  icon: IconBase = CopySimpleIcon,
}: {
  value: string;
  label: string;
  text?: string;
  secret?: boolean;
  size?: 'default' | 'sm' | 'icon';
  variant?: 'outline' | 'ghost' | 'default';
  icon?: PhosphorIcon;
}) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    if (!(await copyText(value, { secret }))) return;
    setDone(true);
    window.setTimeout(() => setDone(false), 1800);
  };
  const Icon = done ? CheckIcon : IconBase;
  return size === 'icon' ? (
    <Button variant={variant} size="icon" onClick={() => void copy()} aria-label={done ? 'Copied' : label}>
      <Icon />
    </Button>
  ) : (
    <Button variant={variant} size={size} onClick={() => void copy()} aria-label={label === text ? undefined : label}>
      <Icon data-icon="inline-start" />
      {done ? 'Copied' : text}
    </Button>
  );
}

const ACTION_ICONS: Record<ActionIcon, PhosphorIcon> = {
  open: ArrowSquareOutIcon,
  call: PhoneIcon,
  map: MapPinIcon,
  email: EnvelopeSimpleIcon,
  sms: ChatTextIcon,
  contact: AddressBookIcon,
  password: KeyIcon,
};

/** Saves a generated file (e.g. a .vcf) without navigating. */
function download(filename: string, mime: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** One per-type action. Links only open when clicked. */
function ActionButton({ action }: { action: Action }) {
  const Icon = ACTION_ICONS[action.icon];
  if (action.kind === 'copy') return <CopyButton value={action.value} label={action.label} text={action.label} secret={action.secret} icon={Icon} />;
  if (action.kind === 'download') {
    return (
      <Button variant="outline" onClick={() => download(action.filename, action.mime, action.content)}>
        <Icon data-icon="inline-start" />
        {action.label}
      </Button>
    );
  }
  return (
    <Button asChild variant="outline">
      <a href={action.href} {...(action.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
        <Icon data-icon="inline-start" />
        {action.label}
      </a>
    </Button>
  );
}

function FieldRow({ field, hidden }: { field: Field; hidden: boolean }) {
  const masked = field.secret && hidden;
  return (
    <div className="flex items-start gap-2 border-b py-3 last:border-b-0">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <dt className="text-sm text-muted-foreground">{field.label}</dt>
        <dd className={cn('select-text text-[0.9375rem] [overflow-wrap:anywhere]', field.secret && 'font-mono')}>
          {masked ? (
            <span aria-label="Hidden">{MASK}</span>
          ) : field.href ? (
            <a href={field.href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
              {field.value}
            </a>
          ) : (
            field.value
          )}
        </dd>
      </div>
      {field.copy && <CopyButton value={field.value} label={`Copy ${field.label.toLowerCase()}`} secret={field.secret} size="icon" variant="ghost" />}
    </div>
  );
}

function previewOf(code: DetectedCode) {
  const parsed = parseContent(code.text);
  const first = parsed.fields.find((f) => !f.secret);
  const text = parsed.kind === 'text' || parsed.kind === 'url' ? code.text : (first?.value ?? parsed.title);
  return { title: parsed.title, text: text.length > 80 ? `${text.slice(0, 80)}…` : text };
}

interface ResultPanelProps {
  codes: DetectedCode[];
  onScanAgain: () => void;
}

export function ResultPanel({ codes, onScanAgain }: ResultPanelProps) {
  const [index, setIndex] = useState(0);
  const code = codes[Math.min(index, codes.length - 1)];
  return (
    <div className="flex flex-col gap-4">
      {codes.length > 1 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium" id="codes-label">
            {codes.length} codes found. Pick one.
          </p>
          <ul aria-labelledby="codes-label" className="flex flex-col overflow-hidden rounded-xl border">
            {codes.map((c, i) => {
              const p = previewOf(c);
              return (
                <li key={c.text} className="border-b last:border-b-0">
                  <button
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-current={i === index ? 'true' : undefined}
                    className={cn(
                      'flex min-h-14 w-full flex-col items-start gap-0.5 px-4 py-2 text-left outline-none hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset',
                      i === index && 'bg-muted font-medium',
                    )}
                  >
                    <span className="text-xs text-muted-foreground">
                      {i + 1}. {p.title}
                    </span>
                    <span className="w-full truncate text-[0.9375rem]">{p.text}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <Result key={code.text} code={code} onScanAgain={onScanAgain} />
    </div>
  );
}

function Result({ code, onScanAgain }: { code: DetectedCode; onScanAgain: () => void }) {
  const parsed = useMemo(() => parseContent(code.text), [code.text]);
  const hasSecret = parsed.fields.some((f) => f.secret);
  const [hidden, setHidden] = useState(hasSecret);
  const [showRaw, setShowRaw] = useState(false);
  const isPlain = parsed.kind === 'text' || parsed.kind === 'url';
  const actions = useMemo(() => actionsFor(code.text, parsed), [code.text, parsed]);
  const rawMasked = hidden && (hasSecret || isPlain);
  // Raw text with a secret in it, or text the user chose to hide, is cleared from the clipboard after a while.
  const rawSecret = hasSecret || (isPlain && hidden);

  return (
    <section aria-labelledby="result-title" className="flex flex-col gap-4 rounded-xl border p-4 md:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h3 id="result-title" className="mr-auto text-lg font-semibold">
          {parsed.title}
        </h3>
        <Badge variant="outline">{code.format.replace(/_/g, ' ')}</Badge>
        <Button variant="outline" size="icon" aria-pressed={hidden} onClick={() => setHidden((h) => !h)} aria-label={hidden ? 'Show content' : 'Hide content'}>
          {hidden ? <EyeIcon /> : <EyeSlashIcon />}
        </Button>
      </div>

      {parsed.kind === 'otpauth' && <OtpCode text={code.text} />}

      {isPlain ? (
        <p
          data-testid="result-text"
          className={cn('select-text rounded-lg bg-muted/50 p-3 text-lg [overflow-wrap:anywhere]', parsed.kind === 'url' ? '' : 'whitespace-pre-wrap')}
        >
          {rawMasked ? <span aria-label="Hidden">{MASK}</span> : code.text}
        </p>
      ) : (
        <dl data-testid="result-fields" className="flex flex-col rounded-lg border px-3">
          {parsed.fields.map((f) => (
            <FieldRow key={f.label} field={f} hidden={hidden} />
          ))}
        </dl>
      )}

      <div className="flex flex-wrap gap-2 max-sm:[&>*]:flex-1">
        {actions.map((a) => (
          <ActionButton key={a.id} action={a} />
        ))}
        <CopyButton value={code.text} label={isPlain ? 'Copy' : 'Copy raw text'} text={isPlain ? 'Copy' : 'Copy raw'} secret={rawSecret} />
        <Button onClick={onScanAgain} className="sm:ml-auto">
          <ArrowCounterClockwiseIcon data-icon="inline-start" />
          Scan again
        </Button>
      </div>

      {!isPlain && (
        <div className="flex flex-col gap-2">
          <Button variant="ghost" size="sm" className="self-start" onClick={() => setShowRaw((s) => !s)} aria-expanded={showRaw}>
            {showRaw ? 'Hide raw text' : 'Show raw text'}
          </Button>
          {showRaw && (
            <p data-testid="result-raw" className="select-text whitespace-pre-wrap rounded-lg bg-muted/50 p-3 font-mono text-[0.8125rem] [overflow-wrap:anywhere]">
              {rawMasked ? <span aria-label="Hidden">{MASK}</span> : code.text}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
