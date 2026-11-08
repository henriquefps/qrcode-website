import { useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { toast } from 'sonner';
import {
  DownloadSimpleIcon,
  EnvelopeSimpleIcon,
  ExportIcon,
  GithubLogoIcon,
  GlobeSimpleIcon,
  InstagramLogoIcon,
  ProhibitIcon,
  TrashIcon,
  UploadSimpleIcon,
  WhatsappLogoIcon,
  WifiHighIcon,
} from '@phosphor-icons/react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { FgType, LogoPresetId, StyleConfig } from '@/lib/preset';
import { PRESET_LOGOS } from './logos';

const LOGO_PRESETS: { id: Exclude<LogoPresetId, 'custom'>; label: string; Icon: typeof ProhibitIcon }[] = [
  { id: 'none', label: 'None', Icon: ProhibitIcon },
  { id: 'wifi', label: 'Wi-Fi', Icon: WifiHighIcon },
  { id: 'web', label: 'Globe', Icon: GlobeSimpleIcon },
  { id: 'whatsapp', label: 'WhatsApp', Icon: WhatsappLogoIcon },
  { id: 'email', label: 'Email', Icon: EnvelopeSimpleIcon },
  { id: 'github', label: 'GitHub', Icon: GithubLogoIcon },
  { id: 'instagram', label: 'Instagram', Icon: InstagramLogoIcon },
];

const HEX = /^#[0-9a-f]{6}$/i;

function ColorField({ id, label, value, disabled, onChange }: { id: string; label: string; value: string; disabled?: boolean; onChange: (v: string) => void }) {
  // Text typed but not yet a valid color; null shows the committed value (so picker and import win).
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          id={id}
          value={value}
          disabled={disabled}
          onChange={(e) => {
            setDraft(null);
            onChange(e.target.value);
          }}
          className="size-9 shrink-0 cursor-pointer rounded-md border border-input bg-transparent p-0.5 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <Input
          type="text"
          value={disabled ? 'TRANSPARENT' : (draft ?? value)}
          onBlur={() => setDraft(null)}
          disabled={disabled}
          onChange={(e) => {
            if (HEX.test(e.target.value)) {
              setDraft(null);
              onChange(e.target.value.toLowerCase());
            } else {
              setDraft(e.target.value);
            }
          }}
          className="font-mono uppercase"
          aria-label={`${label} hex value`}
        />
      </div>
    </div>
  );
}

function SliderField({ id, label, valueLabel, value, min, max, step, onChange }: { id: string; label: string; valueLabel: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        <Badge variant="outline" className="font-mono">
          {valueLabel}
        </Badge>
      </div>
      <Slider id={id} min={min} max={max} step={step} value={[value]} onValueChange={(v) => onChange(v[0])} />
    </div>
  );
}

function SelectField({ id, label, value, options, onChange }: { id: string; label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function SwitchField({ id, label, checked, onChange }: { id: string; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-3">
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
      <Label htmlFor={id}>{label}</Label>
    </div>
  );
}

interface StylingPanelProps {
  style: StyleConfig;
  setStyle: Dispatch<SetStateAction<StyleConfig>>;
  onExport: () => void;
  onImport: (text: string) => void;
}

const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml'];

export function StylingPanel({ style, setStyle, onExport, onImport }: StylingPanelProps) {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const set = <K extends keyof StyleConfig>(key: K, value: StyleConfig[K]) => setStyle((prev) => ({ ...prev, [key]: value }));

  const selectPreset = (preset: Exclude<LogoPresetId, 'custom'>) => {
    setStyle((prev) =>
      preset === 'none'
        ? { ...prev, logoPreset: 'none', logoFile: '', logoFilename: '' }
        : // Logos eat into the data area, so raise error correction to the maximum.
          { ...prev, logoPreset: preset, logoFile: PRESET_LOGOS[preset], logoFilename: `${preset}-logo`, ecLevel: 'H' },
    );
  };

  const processLogo = (file: File | undefined) => {
    if (!file) return;
    if (!LOGO_TYPES.includes(file.type)) {
      toast.error('Please choose a PNG, JPG or SVG image.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('The file is too large. The maximum is 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      const dataUrl = reader.result;
      setStyle((prev) => ({ ...prev, logoPreset: 'custom', logoFile: dataUrl, logoFilename: file.name, ecLevel: 'H' }));
    };
    reader.readAsDataURL(file);
  };

  const handleImportFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' && onImport(reader.result);
    reader.readAsText(file);
  };

  const gradient = style.fgType === 'gradient';

  return (
    <section className="flex flex-col gap-4" aria-labelledby="style-heading">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="style-heading" className="eyebrow">
          Style
        </h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onExport}>
            <ExportIcon data-icon="inline-start" />
            Export preset
          </Button>
          <Button variant="outline" size="sm" onClick={() => importRef.current?.click()}>
            <DownloadSimpleIcon data-icon="inline-start" />
            Import preset
          </Button>
          <input
            type="file"
            ref={importRef}
            accept=".json,application/json"
            className="hidden"
            aria-label="Import style preset file"
            onChange={(e) => {
              handleImportFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </div>
      </div>

      <Accordion type="multiple" defaultValue={['shapes', 'colors', 'logo']} className="w-full">
        <AccordionItem value="shapes">
          <AccordionTrigger>Shapes and layout</AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SelectField
                id="select-dot-style"
                label="Dot pattern"
                value={style.dotsType}
                onChange={(v) => set('dotsType', v as StyleConfig['dotsType'])}
                options={[
                  { value: 'rounded', label: 'Rounded' },
                  { value: 'dots', label: 'Circular dots' },
                  { value: 'classy', label: 'Classy' },
                  { value: 'classy-rounded', label: 'Classy rounded' },
                  { value: 'extra-rounded', label: 'Extra rounded' },
                  { value: 'square', label: 'Classic square' },
                ]}
              />
              <SelectField
                id="select-ec-level"
                label="Error correction"
                value={style.ecLevel}
                onChange={(v) => set('ecLevel', v as StyleConfig['ecLevel'])}
                options={[
                  { value: 'L', label: 'L (7% recovery)' },
                  { value: 'M', label: 'M (15% recovery)' },
                  { value: 'Q', label: 'Q (25% recovery)' },
                  { value: 'H', label: 'H (30%, best with a logo)' },
                ]}
              />
              <SelectField
                id="select-corner-outer"
                label="Corner frame"
                value={style.cornersSquareType}
                onChange={(v) => set('cornersSquareType', v as StyleConfig['cornersSquareType'])}
                options={[
                  { value: 'extra-rounded', label: 'Extra rounded' },
                  { value: 'rounded', label: 'Soft rounded' },
                  { value: 'dot', label: 'Circular ring' },
                  { value: 'square', label: 'Classic square' },
                ]}
              />
              <SelectField
                id="select-corner-inner"
                label="Corner core"
                value={style.cornersDotType}
                onChange={(v) => set('cornersDotType', v as StyleConfig['cornersDotType'])}
                options={[
                  { value: 'rounded', label: 'Soft rounded' },
                  { value: 'dot', label: 'Circular dot' },
                  { value: 'square', label: 'Classic square' },
                ]}
              />
              <div className="sm:col-span-2">
                <SliderField id="range-margin" label="Quiet zone margin" valueLabel={`${style.margin}px`} min={0} max={40} step={5} value={style.margin} onChange={(v) => set('margin', v)} />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="colors">
          <AccordionTrigger>Colors and gradients</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-4">
              <Tabs value={style.fgType} onValueChange={(v) => set('fgType', v as FgType)}>
                <TabsList className="grid w-full grid-cols-2" aria-label="Dot color mode">
                  <TabsTrigger value="single">Solid color</TabsTrigger>
                  <TabsTrigger value="gradient">Gradient</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <ColorField id="color-dots-primary" label="Dots color" value={style.dotsColor} onChange={(v) => set('dotsColor', v)} />
                {gradient && <ColorField id="color-dots-secondary" label="Dots secondary" value={style.dotsColorSecondary} onChange={(v) => set('dotsColorSecondary', v)} />}
              </div>

              {gradient && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <SelectField
                    id="select-gradient-type"
                    label="Gradient style"
                    value={style.gradientType}
                    onChange={(v) => set('gradientType', v as StyleConfig['gradientType'])}
                    options={[
                      { value: 'linear', label: 'Linear' },
                      { value: 'radial', label: 'Radial' },
                    ]}
                  />
                  {style.gradientType === 'linear' && (
                    <SliderField id="range-gradient-rotation" label="Rotation" valueLabel={`${style.gradientRotation}°`} min={0} max={360} step={5} value={style.gradientRotation} onChange={(v) => set('gradientRotation', v)} />
                  )}
                </div>
              )}

              <SwitchField id="toggle-custom-corners" label="Customize corner colors separately" checked={style.customCorners} onChange={(v) => set('customCorners', v)} />

              {style.customCorners && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <ColorField id="color-corner-outer" label="Outer frame color" value={style.cornersSquareColor} onChange={(v) => set('cornersSquareColor', v)} />
                  <ColorField id="color-corner-inner" label="Inner core color" value={style.cornersDotColor} onChange={(v) => set('cornersDotColor', v)} />
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2">
                <ColorField id="color-bg" label="Background" value={style.bgColor} disabled={style.bgTransparent} onChange={(v) => set('bgColor', v)} />
                <div className="pb-2">
                  <SwitchField id="toggle-bg-transparent" label="Transparent background" checked={style.bgTransparent} onChange={(v) => set('bgTransparent', v)} />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="logo">
          <AccordionTrigger>Logo</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7" role="group" aria-label="Logo presets">
                {LOGO_PRESETS.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={style.logoPreset === id}
                    onClick={() => selectPreset(id)}
                    className={cn(
                      'flex min-w-0 flex-col items-center gap-1.5 rounded-md border p-2 text-xs font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50',
                      style.logoPreset === id ? 'border-primary bg-muted text-foreground' : 'border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                    )}
                  >
                    <Icon className="size-5 shrink-0" aria-hidden="true" />
                    <span className="w-full truncate text-center">{label}</span>
                  </button>
                ))}
              </div>

              {!style.logoFile && (
                <div
                  role="button"
                  tabIndex={0}
                  aria-label="Upload your own logo"
                  className={cn(
                    'flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed p-6 text-center outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50',
                    dragActive ? 'border-primary bg-muted' : 'border-border hover:border-muted-foreground',
                  )}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                    processLogo(e.dataTransfer.files[0]);
                  }}
                  onClick={() => logoInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      logoInputRef.current?.click();
                    }
                  }}
                >
                  <input
                    type="file"
                    ref={logoInputRef}
                    tabIndex={-1}
                    onChange={(e) => {
                      processLogo(e.target.files?.[0]);
                      e.target.value = '';
                    }}
                    accept="image/png, image/jpeg, image/svg+xml"
                    className="hidden"
                  />
                  <UploadSimpleIcon className="size-6 text-muted-foreground" aria-hidden="true" />
                  <p className="text-sm font-medium">Drop your own logo here, or choose a file</p>
                  <p className="text-xs text-muted-foreground">SVG, PNG or JPG · max 2 MB</p>
                </div>
              )}

              {style.logoFile && (
                <div className="flex flex-col gap-4 rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-background p-1">
                      <img src={style.logoFile} alt="Logo preview" className="max-h-full max-w-full object-contain" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium">{style.logoFilename || 'logo'}</span>
                      <Badge variant="outline" className="w-fit">
                        Active
                      </Badge>
                    </div>
                    <Button variant="destructive" size="icon" onClick={() => selectPreset('none')} aria-label="Remove logo">
                      <TrashIcon />
                    </Button>
                  </div>
                  <SliderField id="range-logo-size" label="Logo scale" valueLabel={`${Math.round(style.logoScale * 100)}%`} min={5} max={45} step={5} value={Math.round(style.logoScale * 100)} onChange={(v) => set('logoScale', v / 100)} />
                  <SwitchField id="toggle-logo-bg" label="Protective margin behind the logo" checked={style.logoMargin} onChange={(v) => set('logoMargin', v)} />
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}
