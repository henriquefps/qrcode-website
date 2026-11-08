import { useMemo, useRef, useState } from 'react';
import QRCodeStyling from 'qr-code-styling';
import { FileArchiveIcon, UploadSimpleIcon, XIcon } from '@phosphor-icons/react';
import { toast } from 'sonner';
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ResponsiveDialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { autoMap, BATCH_FIELDS, looksLikeHeader, MAX_BATCH_FILE_BYTES, MAX_BATCH_ROWS, parseCsv, parseLines, planBatch, type ColumnMapping } from '@/lib/batch';
import { buildQrOptions } from '@/lib/qrOptions';
import type { StyleConfig } from '@/lib/preset';
import type { ContentType, FormValues } from '@/lib/qrData';
import { downloadBlob } from './download';

const PNG_SIZES = ['256', '512', '1024', '2048'] as const;
const NOT_USED = '-1';

interface BatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: ContentType;
  typeLabel: string;
  values: FormValues;
  style: StyleConfig;
}

type Progress = { done: number; total: number; phase: 'render' | 'zip' };

export default function BatchDialog({ open, onOpenChange, type, typeLabel, values, style }: BatchDialogProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [source, setSource] = useState('');
  const singleField = BATCH_FIELDS[type].length === 1;
  const [modeChoice, setModeChoice] = useState<'lines' | 'csv' | null>(null);
  const mode = modeChoice ?? (singleField ? 'lines' : 'csv');
  const [headerChoice, setHeaderChoice] = useState<boolean | null>(null);
  const [format, setFormat] = useState<'png' | 'svg'>('png');
  const [pngSize, setPngSize] = useState<(typeof PNG_SIZES)[number]>('512');
  const [progress, setProgress] = useState<Progress | null>(null);

  const allRows = useMemo(() => (mode === 'lines' ? parseLines(source) : parseCsv(source)), [source, mode]);
  const hasHeader = mode === 'csv' && (headerChoice ?? (allRows.length > 0 && looksLikeHeader(type, allRows[0])));
  const headers = hasHeader ? allRows[0] : null;
  const rows = useMemo(() => (hasHeader ? allRows.slice(1) : allRows), [allRows, hasHeader]);
  const columnCount = Math.max(1, headers?.length ?? 0, ...rows.slice(0, 50).map((r) => r.length));
  const columns = Array.from({ length: columnCount }, (_, i) => (headers?.[i]?.trim() ? `${headers[i].trim()} (column ${i + 1})` : `Column ${i + 1}`));

  // Column choices reset when the shape of the input changes (type, header, mode).
  const shape = JSON.stringify([type, mode, headers]);
  const [mappingState, setMappingState] = useState<{ shape: string; mapping: ColumnMapping; nameColumn: number } | null>(null);
  const defaults = useMemo(() => {
    const h: string[] | null = JSON.parse(shape)[2];
    return {
      shape,
      mapping: mode === 'lines' ? { [BATCH_FIELDS[type][0].key]: 0 } : autoMap(type, h),
      nameColumn: h ? h.findIndex((x) => /^(name|file ?name|file|label)$/i.test(x.trim())) : -1,
    };
  }, [shape, mode, type]);
  const current = mappingState && mappingState.shape === shape ? mappingState : defaults;
  const setMapping = (patch: Partial<Omit<typeof current, 'shape'>>) => setMappingState({ ...current, ...patch });

  const plan = useMemo(() => planBatch(type, rows, current.mapping, current.nameColumn, values), [type, rows, current.mapping, current.nameColumn, values]);
  const running = progress !== null;

  const loadFile = (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_BATCH_FILE_BYTES) {
      toast.error('The file is too large. The maximum is 2 MB.');
      return;
    }
    file.text().then(
      (text) => {
        setSource(text);
        if (modeChoice === null && !singleField) setModeChoice('csv');
        if (singleField && /[,;\t]/.test(text.split(/\r?\n/, 1)[0] ?? '') && /\.(csv|tsv)$/i.test(file.name)) setModeChoice('csv');
      },
      () => toast.error('Could not read the file.'),
    );
  };

  const generate = async () => {
    const controller = new AbortController();
    abortRef.current = controller;
    const items = plan.items;
    setProgress({ done: 0, total: items.length, phase: 'render' });
    const failed: number[] = [];
    try {
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();
      const size = format === 'png' ? Number(pngSize) : 512;
      for (let i = 0; i < items.length; i++) {
        if (controller.signal.aborted) return;
        const item = items[i];
        try {
          const qr = new QRCodeStyling({ ...buildQrOptions(item.data, style, size), type: format === 'svg' ? 'svg' : 'canvas' });
          const blob = await qr.getRawData(format);
          if (blob instanceof Blob) zip.file(`${item.name}.${format}`, blob);
          else failed.push(item.row);
        } catch {
          failed.push(item.row); // e.g. too much data for a QR code
        }
        if (!controller.signal.aborted) setProgress({ done: i + 1, total: items.length, phase: 'render' });
        if (i % 8 === 7) await new Promise((r) => setTimeout(r, 0)); // keep the UI (and Cancel) responsive
      }
      if (controller.signal.aborted) return;
      if (failed.length === items.length) {
        toast.error('None of the codes could be created.');
        return;
      }
      setProgress({ done: 0, total: 100, phase: 'zip' });
      const out = await zip.generateAsync({ type: 'blob', compression: format === 'svg' ? 'DEFLATE' : 'STORE' }, (meta) => {
        if (!controller.signal.aborted) setProgress({ done: Math.round(meta.percent), total: 100, phase: 'zip' });
      });
      if (controller.signal.aborted) return;
      downloadBlob(out, `qrcode-batch-${type}.zip`);
      const made = items.length - failed.length;
      if (failed.length > 0) toast.warning(`${made} codes saved. Skipped rows ${failed.slice(0, 5).join(', ')}${failed.length > 5 ? '…' : ''} (too much data for a code).`);
      else toast.success(`${made} codes saved to a ZIP file.`);
    } catch {
      if (!controller.signal.aborted) toast.error('Could not create the ZIP file.');
    } finally {
      // A canceled run must not clear the progress of a newer one.
      if (abortRef.current === controller) {
        abortRef.current = null;
        setProgress(null);
      }
    }
  };

  const cancel = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setProgress(null);
    toast('Batch canceled.');
  };

  const pct = progress ? Math.round((progress.done / Math.max(1, progress.total)) * 100) : 0;
  const fields = BATCH_FIELDS[type];

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(next) => {
        if (!next && running) cancel();
        onOpenChange(next);
      }}
    >
      <ResponsiveDialogContent className="sm:max-w-2xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Batch create · {typeLabel}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>One code per row, with the current style. Everything happens on this device.</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <div className="flex items-end justify-between gap-2">
              <Label htmlFor="batch-source">Rows</Label>
              <div className="flex gap-2">
                {source && (
                  <Button variant="ghost" size="sm" onClick={() => setSource('')} disabled={running}>
                    <XIcon data-icon="inline-start" />
                    Clear
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={running}>
                  <UploadSimpleIcon data-icon="inline-start" />
                  Upload CSV
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.tsv,.txt,text/csv,text/plain,text/tab-separated-values"
                  className="hidden"
                  aria-label="Upload a CSV or text file"
                  tabIndex={-1}
                  onChange={(e) => {
                    loadFile(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
              </div>
            </div>
            <Textarea
              id="batch-source"
              rows={6}
              spellCheck={false}
              className="max-h-60 font-mono text-[0.8125rem]"
              placeholder={mode === 'lines' ? 'One value per line' : `${fields.map((f) => f.label.toLowerCase()).join(',')}\n…`}
              value={source}
              disabled={running}
              onChange={(e) => setSource(e.target.value)}
              aria-describedby="batch-source-hint"
            />
            <p id="batch-source-hint" className="text-xs text-muted-foreground">
              Paste rows or upload a file (up to {MAX_BATCH_ROWS.toLocaleString('en')} rows, 2 MB). Fields without a column use the values in the form.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="batch-mode">Each row is</Label>
              <Select value={mode} onValueChange={(v) => setModeChoice(v as 'lines' | 'csv')} disabled={running}>
                <SelectTrigger id="batch-mode" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lines">One value per line</SelectItem>
                  <SelectItem value="csv">CSV with columns</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {mode === 'csv' && (
              <div className="flex items-center gap-3 sm:pt-7">
                <Switch id="batch-header" checked={hasHeader} onCheckedChange={setHeaderChoice} disabled={running} />
                <Label htmlFor="batch-header">First row has column names</Label>
              </div>
            )}
          </div>

          {mode === 'csv' && (
            <fieldset className="flex flex-col gap-3" disabled={running}>
              <legend className="mb-3 text-sm font-medium">Columns</legend>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {fields.map((f, i) => (
                  <div key={f.key} className="flex flex-col gap-2">
                    <Label htmlFor={`batch-map-${f.key}`}>
                      {f.label}
                      {i === 0 && <span className="text-muted-foreground"> (required)</span>}
                    </Label>
                    <Select value={String(current.mapping[f.key] ?? NOT_USED)} onValueChange={(v) => setMapping({ mapping: { ...current.mapping, [f.key]: Number(v) } })}>
                      <SelectTrigger id={`batch-map-${f.key}`} className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NOT_USED}>From the form</SelectItem>
                        {columns.map((c, idx) => (
                          <SelectItem key={idx} value={String(idx)}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </fieldset>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="batch-name">File names</Label>
              <Select value={String(current.nameColumn)} onValueChange={(v) => setMapping({ nameColumn: Number(v) })} disabled={running || mode === 'lines'}>
                <SelectTrigger id="batch-name" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NOT_USED}>Row number (qrcode-001)</SelectItem>
                  {mode === 'csv' &&
                    columns.map((c, idx) => (
                      <SelectItem key={idx} value={String(idx)}>
                        {c}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label id="batch-format-label">Format</Label>
              <div className="flex gap-2">
                <ToggleGroup type="single" variant="outline" value={format} onValueChange={(v) => v && setFormat(v as 'png' | 'svg')} aria-labelledby="batch-format-label" disabled={running}>
                  <ToggleGroupItem value="png">PNG</ToggleGroupItem>
                  <ToggleGroupItem value="svg">SVG</ToggleGroupItem>
                </ToggleGroup>
                {format === 'png' && (
                  <Select value={pngSize} onValueChange={(v) => setPngSize(v as (typeof PNG_SIZES)[number])} disabled={running}>
                    <SelectTrigger aria-label="PNG size" className="min-w-0 flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PNG_SIZES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s} px
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-lg border p-4" aria-live="polite">
            <p className="text-[0.9375rem]">
              <span className="text-xl font-semibold tabular-nums">{plan.items.length.toLocaleString('en')}</span> {plan.items.length === 1 ? 'code' : 'codes'}
            </p>
            {(plan.empty > 0 || plan.invalid.length > 0 || plan.truncated) && (
              <ul className="flex flex-col gap-1 text-[0.8125rem] text-muted-foreground">
                {plan.truncated && <li className="text-warning">Only the first {MAX_BATCH_ROWS.toLocaleString('en')} rows are used.</li>}
                {plan.empty > 0 && <li>{plan.empty === 1 ? '1 row' : `${plan.empty} rows`} skipped: the required field is empty.</li>}
                {plan.invalid.length > 0 && (
                  <li className="text-destructive">
                    {plan.invalid.length === 1 ? '1 row' : `${plan.invalid.length} rows`} skipped with errors, e.g. row {plan.invalid[0].row}: {plan.invalid[0].message}
                  </li>
                )}
              </ul>
            )}
            {plan.items.length > 0 && (
              <ul className="flex flex-col gap-1 border-t pt-2" aria-label="First codes">
                {plan.items.slice(0, 3).map((item) => (
                  <li key={item.row} className="flex min-w-0 gap-2 text-[0.8125rem]">
                    <span className="shrink-0 font-medium">
                      {item.name}.{format}
                    </span>
                    <span className="truncate font-mono text-muted-foreground" title={item.data}>
                      {item.data.replace(/\r?\n/g, ' ⏎ ')}
                    </span>
                  </li>
                ))}
                {plan.items.length > 3 && <li className="text-xs text-muted-foreground">and {plan.items.length - 3} more</li>}
              </ul>
            )}
          </div>

          {progress && (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-[0.8125rem] text-muted-foreground">
                <span>{progress.phase === 'render' ? 'Creating codes…' : 'Packing the ZIP…'}</span>
                <span className="tabular-nums">{progress.phase === 'render' ? `${progress.done} of ${progress.total}` : `${pct}%`}</span>
              </div>
              <div
                role="progressbar"
                aria-label={progress.phase === 'render' ? 'Creating codes' : 'Packing the ZIP'}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={pct}
                className="h-2 overflow-hidden rounded-full bg-muted"
              >
                <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter>
          {/* Primary first on phones (stacked); last (right) on desktop. */}
          <Button className="md:order-last" onClick={generate} disabled={running || plan.items.length === 0}>
            <FileArchiveIcon data-icon="inline-start" />
            Download ZIP
          </Button>
          {running ? (
            <Button variant="outline" onClick={cancel}>
              Cancel batch
            </Button>
          ) : (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          )}
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
