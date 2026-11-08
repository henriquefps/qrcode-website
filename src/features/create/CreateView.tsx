import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ContentInputs, ContentTypeTabs } from './ContentInputs';
import { LivePreview } from './LivePreview';
import { StylingPanel } from './StylingPanel';
import { PRESET_LOGOS } from './logos';
import { Separator } from '@/components/ui/separator';
import { DEFAULT_STYLE, parsePresetText, toPreset, type StyleConfig } from '@/lib/preset';
import { EMPTY_FORM, getQRDataString, type ContentType, type FormValues } from '@/lib/qrData';

export function CreateView() {
  const [type, setType] = useState<ContentType>('url');
  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [style, setStyle] = useState<StyleConfig>(DEFAULT_STYLE);

  const setValue = <K extends keyof FormValues>(key: K, value: FormValues[K]) => setValues((prev) => ({ ...prev, [key]: value }));

  // Changing the content type also suggests a matching preset logo (Wi-Fi, Email, URL).
  const changeType = (next: ContentType) => {
    setType(next);
    setStyle((prev) => {
      const suggestion = next === 'wifi' ? 'wifi' : next === 'email' ? 'email' : next === 'url' ? 'web' : null;
      if (!suggestion) return prev;
      const replaceable = next === 'wifi' ? prev.logoPreset === 'none' : prev.logoPreset === 'wifi' || (next === 'url' && prev.logoPreset === 'email');
      if (!replaceable) return prev;
      return { ...prev, logoPreset: suggestion, logoFile: PRESET_LOGOS[suggestion], logoFilename: `${suggestion}-logo`, ecLevel: 'H' };
    });
  };

  const data = useMemo(() => getQRDataString(type, values), [type, values]);

  const exportPreset = () => {
    const blob = new Blob([JSON.stringify(toPreset(style), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qrcode-style-preset.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
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
          <h2 id="content-heading" className="eyebrow">
            Content
          </h2>
          <ContentTypeTabs value={type} onChange={changeType} />
          <ContentInputs type={type} values={values} onChange={setValue} />
        </section>
        <Separator />
        <StylingPanel style={style} setStyle={setStyle} onExport={exportPreset} onImport={importPreset} />
      </div>
    </div>
  );
}
