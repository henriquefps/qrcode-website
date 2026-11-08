import { ChatTextIcon, EnvelopeSimpleIcon, IdentificationCardIcon, LinkSimpleIcon, TextTIcon, WifiHighIcon } from '@phosphor-icons/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CONTENT_TYPES, type ContentType, type FormValues, type WifiSecurity } from '@/lib/qrData';

const TABS: Record<ContentType, { label: string; Icon: typeof LinkSimpleIcon }> = {
  url: { label: 'URL', Icon: LinkSimpleIcon },
  text: { label: 'Text', Icon: TextTIcon },
  wifi: { label: 'Wi-Fi', Icon: WifiHighIcon },
  email: { label: 'Email', Icon: EnvelopeSimpleIcon },
  sms: { label: 'SMS', Icon: ChatTextIcon },
  vcard: { label: 'vCard', Icon: IdentificationCardIcon },
};

export function ContentTypeTabs({ value, onChange }: { value: ContentType; onChange: (type: ContentType) => void }) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as ContentType)}>
      <TabsList aria-label="Content type" className="grid w-full grid-cols-3 gap-1 group-data-horizontal/tabs:h-auto sm:grid-cols-6">
        {CONTENT_TYPES.map((id) => {
          const { label, Icon } = TABS[id];
          return (
            <TabsTrigger key={id} value={id} className="min-w-0 gap-1.5 px-1 py-2">
              <Icon aria-hidden="true" />
              <span className="truncate">{label}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}

interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}

function Field({ id, label, value, onChange, placeholder, type = 'text', className }: FieldProps) {
  return (
    <div className={`flex flex-col gap-2 ${className ?? ''}`}>
      <Label htmlFor={id}>{label}</Label>
      <Input type={type} id={id} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function AreaField({ id, label, value, onChange, placeholder, rows }: Omit<FieldProps, 'type' | 'className'> & { rows: number }) {
  return (
    <div className="flex flex-col gap-2 sm:col-span-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea id={id} rows={rows} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

interface InputsProps {
  type: ContentType;
  values: FormValues;
  onChange: <K extends keyof FormValues>(key: K, value: FormValues[K]) => void;
}

export function ContentInputs({ type, values: v, onChange }: InputsProps) {
  switch (type) {
    case 'url':
      return (
        <div className="grid gap-4">
          <Field id="input-url" label="Website URL" placeholder="example.com" value={v.url} onChange={(x) => onChange('url', x)} />
        </div>
      );
    case 'text':
      return (
        <div className="grid gap-4">
          <AreaField id="input-text" label="Text or message" rows={4} placeholder="Type your text here..." value={v.text} onChange={(x) => onChange('text', x)} />
        </div>
      );
    case 'wifi':
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="input-wifi-ssid" label="Network name (SSID)" placeholder="My home network" className="sm:col-span-2" value={v.wifiSsid} onChange={(x) => onChange('wifiSsid', x)} />
          <Field id="input-wifi-pass" label="Password" type="password" placeholder="••••••••" value={v.wifiPass} onChange={(x) => onChange('wifiPass', x)} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="input-wifi-type">Security</Label>
            <Select value={v.wifiType} onValueChange={(x) => onChange('wifiType', x as WifiSecurity)}>
              <SelectTrigger id="input-wifi-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WPA">WPA/WPA2</SelectItem>
                <SelectItem value="WEP">WEP</SelectItem>
                <SelectItem value="nopass">Open (no password)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3 sm:col-span-2">
            <Switch id="input-wifi-hidden" checked={v.wifiHidden} onCheckedChange={(x) => onChange('wifiHidden', x)} />
            <Label htmlFor="input-wifi-hidden">Hidden network</Label>
          </div>
        </div>
      );
    case 'email':
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="input-email-to" label="To" type="email" placeholder="hello@company.com" value={v.emailTo} onChange={(x) => onChange('emailTo', x)} />
          <Field id="input-email-sub" label="Subject" placeholder="Subject" value={v.emailSub} onChange={(x) => onChange('emailSub', x)} />
          <AreaField id="input-email-body" label="Message" rows={3} placeholder="Hello..." value={v.emailBody} onChange={(x) => onChange('emailBody', x)} />
        </div>
      );
    case 'sms':
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="input-sms-phone" label="Phone number" type="tel" placeholder="+1234567890" className="sm:col-span-2" value={v.smsPhone} onChange={(x) => onChange('smsPhone', x)} />
          <AreaField id="input-sms-body" label="Message (optional)" rows={3} placeholder="Hi! Let's connect." value={v.smsBody} onChange={(x) => onChange('smsBody', x)} />
        </div>
      );
    case 'vcard':
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="input-vcard-first" label="First name" placeholder="Jane" value={v.vcardFirst} onChange={(x) => onChange('vcardFirst', x)} />
          <Field id="input-vcard-last" label="Last name" placeholder="Doe" value={v.vcardLast} onChange={(x) => onChange('vcardLast', x)} />
          <Field id="input-vcard-company" label="Company" placeholder="My Company" value={v.vcardCompany} onChange={(x) => onChange('vcardCompany', x)} />
          <Field id="input-vcard-title" label="Job title" placeholder="Solutions Specialist" value={v.vcardTitle} onChange={(x) => onChange('vcardTitle', x)} />
          <Field id="input-vcard-phone" label="Mobile phone" type="tel" placeholder="+351 912 345 678" value={v.vcardPhone} onChange={(x) => onChange('vcardPhone', x)} />
          <Field id="input-vcard-email" label="Work email" type="email" placeholder="email@company.com" value={v.vcardEmail} onChange={(x) => onChange('vcardEmail', x)} />
          <Field id="input-vcard-url" label="Website" type="url" placeholder="https://example.com" className="sm:col-span-2" value={v.vcardUrl} onChange={(x) => onChange('vcardUrl', x)} />
        </div>
      );
  }
}
