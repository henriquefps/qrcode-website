import { lazy, Suspense, useMemo, useState } from 'react';
import { StackIcon } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ContentInputs, ContentTypeTabs } from './ContentInputs';
import { LivePreview } from './LivePreview';
import { StylingPanel } from './StylingPanel';
import { PRESET_LOGOS } from './logos';
import { Separator } from '@/components/ui/separator';
import { DEFAULT_STYLE, parsePresetText, toPreset, type StyleConfig } from '@/lib/preset';
import { EMPTY_FORM, getQRDataString, validateForm, type ContentType, type FormValues } from '@/lib/qrData';
import { downloadBlob } from './download';

// Batch (and jszip, which it imports on demand) is a separate chunk, loaded on first open.
const BatchDialog = lazy(() => import('./BatchDialog'));

const TYPE_LABELS: Record<ContentType, string> = {
  url: 'URL',
  text: 'Text',
  wifi: 'Wi-Fi',
  email: 'Email',
  sms: 'SMS',
  phone: 'Phone',
  whatsapp: 'WhatsApp',
  vcard: 'vCard',
  event: 'Event',
  geo: 'Location',
  otp: '2FA (OTP)',
};

/** Logo suggested for a content type; replaces only none or another suggestion, never a user's choice. */
const SUGGESTED_LOGO: Partial<Record<ContentType, 'wifi' | 'email' | 'web' | 'whatsapp'>> = { wifi: 'wifi', email: 'email', url: 'web', whatsapp: 'whatsapp' };

export function CreateView() {
  const [type, setType] = useState<ContentType>('url');
  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [style, setStyle] = useState<StyleConfig>(DEFAULT_STYLE);

  const setValue = <K extends keyof FormValues>(key: K, value: FormValues[K]) => setValues((prev) => ({ ...prev, [key]: value }));

  const [batchOpen, setBatchOpen] = useState(false);
  const [batchMounted, setBatchMounted] = useState(false);

  // Changing the content type also suggests a matching preset logo (Wi-Fi, Email, URL, WhatsApp).
  const changeType = (next: ContentType) => {
    setType(next);
    setStyle((prev) => {
      const suggestion = SUGGESTED_LOGO[next];
      if (!suggestion || prev.logoPreset === suggestion) return prev;
      const wasSuggested = prev.logoPreset === 'wifi' || prev.logoPreset === 'email' || prev.logoPreset === 'web' || prev.logoPreset === 'whatsapp';
      const replaceable = wasSuggested || (prev.logoPreset === 'none' && (next === 'wifi' || next === 'whatsapp'));
      if (!replaceable) return prev;
      return { ...prev, logoPreset: suggestion, logoFile: PRESET_LOGOS[suggestion], logoFilename: `${suggestion}-logo`, ecLevel: 'H' };
    });
  };

  const data = useMemo(() => getQRDataString(type, values), [type, values]);
  const errors = useMemo(() => validateForm(type, values), [type, values]);

  const exportPreset = () => {
    downloadBlob(new Blob([JSON.stringify(toPreset(style), null, 2)], { type: 'application/json' }), 'qrcode-style-preset.json');
  };

  const importPreset = (text: string) => {
    const result = parsePresetText(text, PRESET_LOGOS);
    if (result.ok) {
      setStyle(result.style);
      toast.success('Style preset imported.');
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="grid items-start gap-8 p-4 md:p-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
      {/* Mobile: preview first. Desktop: controls left, sticky preview right. */}
      <div className="lg:sticky lg:top-6 lg:order-2">
        <LivePreview data={data} style={style} />
      </div>
      <div className="flex flex-col gap-6 lg:order-1">
        <section aria-labelledby="content-heading" className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <h2 id="content-heading" className="eyebrow">
              Content
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setBatchMounted(true);
                setBatchOpen(true);
              }}
            >
              <StackIcon data-icon="inline-start" />
              Batch
            </Button>
          </div>
          <ContentTypeTabs value={type} onChange={changeType} />
          <ContentInputs type={type} values={values} errors={errors} onChange={setValue} />
        </section>
        <Separator />
        <StylingPanel style={style} setStyle={setStyle} onExport={exportPreset} onImport={importPreset} />
      </div>
      {batchMounted && (
        <Suspense fallback={null}>
          <BatchDialog open={batchOpen} onOpenChange={setBatchOpen} type={type} typeLabel={TYPE_LABELS[type]} values={values} style={style} />
        </Suspense>
      )}
    </div>
  );
}
