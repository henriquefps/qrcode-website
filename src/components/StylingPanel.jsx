import React, { useEffect, useRef, useState } from 'react';
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
  WifiHighIcon
} from '@phosphor-icons/react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { PRESET_LOGOS } from '../utils/qrHelper';

const LOGO_PRESETS = [
  { id: 'none', label: 'None', Icon: ProhibitIcon },
  { id: 'wifi', label: 'WiFi', Icon: WifiHighIcon },
  { id: 'web', label: 'Globe', Icon: GlobeSimpleIcon },
  { id: 'whatsapp', label: 'WhatsApp', Icon: WhatsappLogoIcon },
  { id: 'email', label: 'Email', Icon: EnvelopeSimpleIcon },
  { id: 'github', label: 'GitHub', Icon: GithubLogoIcon },
  { id: 'instagram', label: 'Instagram', Icon: InstagramLogoIcon }
];

function ColorField({ id, label, value, disabled, onChange }) {
  const [draft, setDraft] = useState(value);

  // Keep the text draft in sync when the color changes from outside (picker, import)
  useEffect(() => {
    setDraft(value);
  }, [value]);

  const handleTextChange = (text) => {
    setDraft(text);
    if (/^#[0-9A-F]{6}$/i.test(text)) {
      onChange(text.toLowerCase());
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          id={id}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="size-9 shrink-0 cursor-pointer border border-input bg-transparent p-0.5 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <Input
          type="text"
          value={disabled ? 'TRANSPARENT' : draft}
          disabled={disabled}
          onChange={(e) => handleTextChange(e.target.value)}
          className="font-mono uppercase"
          aria-label={`${label} hex value`}
        />
      </div>
    </div>
  );
}

function SliderField({ id, label, valueLabel, value, min, max, step, onChange }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        <Badge variant="secondary" className="font-mono">{valueLabel}</Badge>
      </div>
      <Slider
        id={id}
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : v)}
      />
    </div>
  );
}

function SelectField({ id, label, value, options, onChange }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {/* `items` lets Base UI's SelectValue render the option label, not the raw value */}
      <Select value={value} onValueChange={onChange} items={options}>
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

export default function StylingPanel({ styleConfig, setStyleConfig, onExport, onImport }) {
  const fileInputRef = useRef(null);
  const importStyleRef = useRef(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleChange = (key, value) => {
    setStyleConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handlePresetSelect = (preset) => {
    setStyleConfig((prev) => {
      const updated = { ...prev, logoPreset: preset };
      if (preset === 'none') {
        updated.logoFile = '';
        updated.logoFilename = '';
      } else {
        updated.logoFile = PRESET_LOGOS[preset];
        updated.logoFilename = `${preset}-logo`;
        // Logos eat into the code's data area, so bump error correction to max
        updated.ecLevel = 'H';
      }
      return updated;
    });
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const processFile = (file) => {
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (PNG, JPG, SVG).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('The file is too large. Max size allowed is 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setStyleConfig((prev) => ({
        ...prev,
        logoPreset: 'custom',
        logoFile: e.target.result,
        logoFilename: file.name,
        ecLevel: 'H'
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const clearLogo = () => {
    setStyleConfig((prev) => ({
      ...prev,
      logoPreset: 'none',
      logoFile: '',
      logoFilename: ''
    }));
  };

  const handleImportFile = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target.result);
          onImport(imported);
          toast.success('Style configuration imported.');
        } catch {
          toast.error('Invalid file format. Please upload a valid JSON config file.');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    }
  };

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          02 — Style
        </span>
        <span className="h-px max-w-[48px] flex-1 bg-border" />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="xs" onClick={onExport}>
          <ExportIcon data-icon="inline-start" />
          Export style
        </Button>
        <Button variant="outline" size="xs" onClick={() => importStyleRef.current?.click()}>
          <DownloadSimpleIcon data-icon="inline-start" />
          Import style
        </Button>
        <input
          type="file"
          ref={importStyleRef}
          accept=".json"
          className="hidden"
          onChange={handleImportFile}
        />
      </div>

      <Accordion defaultValue={['shapes', 'colors', 'logo']} className="w-full">
        <AccordionItem value="shapes">
          <AccordionTrigger>QR Shapes &amp; Layout</AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SelectField
                id="select-dot-style"
                label="Dot Pattern"
                value={styleConfig.dotsType}
                onChange={(v) => handleChange('dotsType', v)}
                options={[
                  { value: 'rounded', label: 'Rounded' },
                  { value: 'dots', label: 'Circular Dots' },
                  { value: 'classy', label: 'Classy' },
                  { value: 'classy-rounded', label: 'Classy Rounded' },
                  { value: 'extra-rounded', label: 'Extra Rounded' },
                  { value: 'square', label: 'Classic Square' }
                ]}
              />
              <SelectField
                id="select-ec-level"
                label="Error Correction"
                value={styleConfig.ecLevel}
                onChange={(v) => handleChange('ecLevel', v)}
                options={[
                  { value: 'L', label: 'L (7% recovery)' },
                  { value: 'M', label: 'M (15% recovery)' },
                  { value: 'Q', label: 'Q (25% recovery)' },
                  { value: 'H', label: 'H (30% — best with logo)' }
                ]}
              />
              <SelectField
                id="select-corner-outer"
                label="Corner Frame (Outer)"
                value={styleConfig.cornersSquareType}
                onChange={(v) => handleChange('cornersSquareType', v)}
                options={[
                  { value: 'extra-rounded', label: 'Extra Rounded' },
                  { value: 'rounded', label: 'Soft Rounded' },
                  { value: 'dot', label: 'Circular Ring' },
                  { value: 'square', label: 'Classic Square' }
                ]}
              />
              <SelectField
                id="select-corner-inner"
                label="Corner Core (Inner)"
                value={styleConfig.cornersDotType}
                onChange={(v) => handleChange('cornersDotType', v)}
                options={[
                  { value: 'rounded', label: 'Soft Rounded' },
                  { value: 'dot', label: 'Circular Dot' },
                  { value: 'square', label: 'Classic Square' }
                ]}
              />
              <div className="sm:col-span-2">
                <SliderField
                  id="range-margin"
                  label="Quiet Zone Margin"
                  valueLabel={`${styleConfig.margin}px`}
                  min={0}
                  max={40}
                  step={5}
                  value={styleConfig.margin}
                  onChange={(v) => handleChange('margin', v)}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="colors">
          <AccordionTrigger>Colors &amp; Gradients</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-4">
              <Tabs
                value={styleConfig.fgType}
                onValueChange={(v) => handleChange('fgType', v)}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="single">Solid Color</TabsTrigger>
                  <TabsTrigger value="gradient">Gradient</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <ColorField
                  id="color-dots-primary"
                  label="Dots Color"
                  value={styleConfig.dotsColor}
                  onChange={(v) => handleChange('dotsColor', v)}
                />
                {styleConfig.fgType === 'gradient' && (
                  <ColorField
                    id="color-dots-secondary"
                    label="Dots Secondary"
                    value={styleConfig.dotsColorSecondary}
                    onChange={(v) => handleChange('dotsColorSecondary', v)}
                  />
                )}
              </div>

              {styleConfig.fgType === 'gradient' && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <SelectField
                    id="select-gradient-type"
                    label="Gradient Style"
                    value={styleConfig.gradientType}
                    onChange={(v) => handleChange('gradientType', v)}
                    options={[
                      { value: 'linear', label: 'Linear' },
                      { value: 'radial', label: 'Radial' }
                    ]}
                  />
                  {styleConfig.gradientType === 'linear' && (
                    <SliderField
                      id="range-gradient-rotation"
                      label="Rotation"
                      valueLabel={`${styleConfig.gradientRotation}°`}
                      min={0}
                      max={360}
                      step={5}
                      value={styleConfig.gradientRotation}
                      onChange={(v) => handleChange('gradientRotation', v)}
                    />
                  )}
                </div>
              )}

              <div className="flex items-center gap-3">
                <Switch
                  id="toggle-custom-corners"
                  checked={styleConfig.customCorners}
                  onCheckedChange={(checked) => handleChange('customCorners', checked)}
                />
                <Label htmlFor="toggle-custom-corners">
                  Customize corner colors separately
                </Label>
              </div>

              {styleConfig.customCorners && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <ColorField
                    id="color-corner-outer"
                    label="Outer Frame Color"
                    value={styleConfig.cornersSquareColor}
                    onChange={(v) => handleChange('cornersSquareColor', v)}
                  />
                  <ColorField
                    id="color-corner-inner"
                    label="Inner Core Color"
                    value={styleConfig.cornersDotColor}
                    onChange={(v) => handleChange('cornersDotColor', v)}
                  />
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2">
                <ColorField
                  id="color-bg"
                  label="Background"
                  value={styleConfig.bgColor}
                  disabled={styleConfig.bgTransparent}
                  onChange={(v) => handleChange('bgColor', v)}
                />
                <div className="flex items-center gap-3 pb-2.5">
                  <Switch
                    id="toggle-bg-transparent"
                    checked={styleConfig.bgTransparent}
                    onCheckedChange={(checked) => handleChange('bgTransparent', checked)}
                  />
                  <Label htmlFor="toggle-bg-transparent">Transparent background</Label>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="logo">
          <AccordionTrigger>Logo &amp; Custom Icon</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
                {LOGO_PRESETS.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    title={label}
                    onClick={() => handlePresetSelect(id)}
                    className={cn(
                      'flex min-w-0 flex-col items-center gap-1.5 border p-2 text-[0.65rem] font-semibold transition-colors',
                      styleConfig.logoPreset === id
                        ? 'border-primary bg-muted text-foreground'
                        : 'border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Icon className="size-4.5 shrink-0" aria-hidden="true" />
                    <span className="w-full truncate">{label}</span>
                  </button>
                ))}
              </div>

              {styleConfig.logoPreset !== 'custom' && !styleConfig.logoFile && (
                <div
                  role="button"
                  tabIndex={0}
                  className={cn(
                    'flex cursor-pointer flex-col items-center gap-2 border border-dashed p-6 text-center transition-colors',
                    isDragActive
                      ? 'border-primary bg-muted'
                      : 'border-border hover:border-muted-foreground'
                  )}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
                  }}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/png, image/jpeg, image/jpg, image/svg+xml"
                    className="hidden"
                  />
                  <UploadSimpleIcon className="size-6 text-muted-foreground" aria-hidden="true" />
                  <p className="text-sm font-medium">Drag &amp; drop your own logo here</p>
                  <p className="text-xs text-muted-foreground">SVG, PNG or JPG · max 2MB</p>
                </div>
              )}

              {styleConfig.logoFile && (
                <div className="flex flex-col gap-4 border p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center border bg-background p-1">
                      <img
                        src={styleConfig.logoFile}
                        alt="Logo preview"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium">
                        {styleConfig.logoFilename || 'logo.png'}
                      </span>
                      <Badge variant="secondary" className="w-fit">Active</Badge>
                    </div>
                    <Button
                      variant="destructive"
                      size="icon-sm"
                      onClick={clearLogo}
                      aria-label="Remove logo"
                    >
                      <TrashIcon />
                    </Button>
                  </div>

                  <SliderField
                    id="range-logo-size"
                    label="Logo Scale"
                    valueLabel={`${Math.round(styleConfig.logoScale * 100)}%`}
                    min={5}
                    max={45}
                    step={5}
                    value={Math.round(styleConfig.logoScale * 100)}
                    onChange={(v) => handleChange('logoScale', v / 100)}
                  />

                  <div className="flex items-center gap-3">
                    <Switch
                      id="toggle-logo-bg"
                      checked={styleConfig.logoMargin}
                      onCheckedChange={(checked) => handleChange('logoMargin', checked)}
                    />
                    <Label htmlFor="toggle-logo-bg">
                      Protective margin behind logo
                    </Label>
                  </div>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}
