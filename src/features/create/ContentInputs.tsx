import { useState, type HTMLAttributes } from 'react';
import {
  ArrowsClockwiseIcon,
  CalendarBlankIcon,
  ChatTextIcon,
  EnvelopeSimpleIcon,
  EyeIcon,
  EyeSlashIcon,
  IdentificationCardIcon,
  KeyIcon,
  LinkSimpleIcon,
  MapPinIcon,
  PhoneIcon,
  TextTIcon,
  WhatsappLogoIcon,
  WifiHighIcon,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { OTP_ALGORITHMS, OTP_DIGITS, randomSecret } from '@/lib/otpauth';
import { CONTENT_TYPES, type ContentType, type FieldErrors, type FormValues, type OtpAlgorithm, type WifiSecurity } from '@/lib/qrData';

const CONTENT_TYPE_INFO: Record<ContentType, { label: string; Icon: typeof LinkSimpleIcon }> = {
  url: { label: 'URL', Icon: LinkSimpleIcon },
  text: { label: 'Text', Icon: TextTIcon },
  wifi: { label: 'Wi-Fi', Icon: WifiHighIcon },
  email: { label: 'Email', Icon: EnvelopeSimpleIcon },
  sms: { label: 'SMS', Icon: ChatTextIcon },
  phone: { label: 'Phone', Icon: PhoneIcon },
  whatsapp: { label: 'WhatsApp', Icon: WhatsappLogoIcon },
  vcard: { label: 'vCard', Icon: IdentificationCardIcon },
  event: { label: 'Event', Icon: CalendarBlankIcon },
  geo: { label: 'Location', Icon: MapPinIcon },
  otp: { label: '2FA (OTP)', Icon: KeyIcon },
};

/** 11 types: a Select on narrow containers (no cut-off scrolling strip), a wrapping tab grid from @xl up. */
export function ContentTypeTabs({ value, onChange }: { value: ContentType; onChange: (type: ContentType) => void }) {
  return (
    <div className="@container">
      <div className="@xl:hidden">
        <Select value={value} onValueChange={(v) => onChange(v as ContentType)}>
          <SelectTrigger aria-label="Content type" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CONTENT_TYPES.map((id) => {
              const { label, Icon } = CONTENT_TYPE_INFO[id];
              return (
                <SelectItem key={id} value={id}>
                  <Icon aria-hidden="true" />
                  {label}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
      <Tabs value={value} onValueChange={(v) => onChange(v as ContentType)} className="hidden @xl:flex">
        <TabsList aria-label="Content type" className="grid w-full grid-cols-4 gap-1 group-data-horizontal/tabs:h-auto @2xl:grid-cols-6">
          {CONTENT_TYPES.map((id) => {
            const { label, Icon } = CONTENT_TYPE_INFO[id];
            return (
              <TabsTrigger key={id} value={id} className="min-w-0 gap-1.5 px-1 py-2">
                <Icon aria-hidden="true" />
                <span className="truncate">{label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
    </div>
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
  error?: string;
  hint?: string;
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode'];
}

function FieldMessage({ id, error, hint }: { id: string; error?: string; hint?: string }) {
  if (error)
    return (
      <p id={`${id}-msg`} className="text-xs text-destructive">
        {error}
      </p>
    );
  if (hint)
    return (
      <p id={`${id}-msg`} className="text-xs text-muted-foreground">
        {hint}
      </p>
    );
  return null;
}

function Field({ id, label, value, onChange, placeholder, type = 'text', className, error, hint, inputMode }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        type={type}
        id={id}
        placeholder={placeholder}
        value={value}
        inputMode={inputMode}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${id}-msg` : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
      <FieldMessage id={id} error={error} hint={hint} />
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

function SelectField<T extends string>({ id, label, value, options, onChange }: { id: string; label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={(v) => onChange(v as T)}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface InputsProps {
  type: ContentType;
  values: FormValues;
  errors: FieldErrors;
  onChange: <K extends keyof FormValues>(key: K, value: FormValues[K]) => void;
}

/** Converts a value between the date and datetime-local input formats when "All day" flips. */
function convertEventValue(value: string, allDay: boolean, fallbackTime: string): string {
  if (!value) return value;
  return allDay ? value.slice(0, 10) : value.length === 10 ? `${value}T${fallbackTime}` : value;
}

function OtpInputs({ values: v, errors, onChange }: Omit<InputsProps, 'type'>) {
  const [showSecret, setShowSecret] = useState(false);
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field id="input-otp-issuer" label="Issuer (service)" placeholder="ACME" value={v.otpIssuer} error={errors.otpIssuer} onChange={(x) => onChange('otpIssuer', x)} />
      <Field id="input-otp-account" label="Account" placeholder="jane@example.com" value={v.otpAccount} error={errors.otpAccount} onChange={(x) => onChange('otpAccount', x)} />
      <div className="flex flex-col gap-2 sm:col-span-2">
        <Label htmlFor="input-otp-secret">Secret (Base32)</Label>
        <div className="flex gap-2">
          <Input
            id="input-otp-secret"
            type={showSecret ? 'text' : 'password'}
            autoComplete="off"
            spellCheck={false}
            placeholder="JBSW Y3DP EHPK 3PXP"
            className="font-mono"
            value={v.otpSecret}
            aria-invalid={errors.otpSecret ? true : undefined}
            aria-describedby="input-otp-secret-msg"
            onChange={(e) => onChange('otpSecret', e.target.value)}
          />
          <Button variant="outline" size="icon" aria-label={showSecret ? 'Hide secret' : 'Show secret'} aria-pressed={showSecret} onClick={() => setShowSecret((s) => !s)}>
            {showSecret ? <EyeSlashIcon /> : <EyeIcon />}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              onChange('otpSecret', randomSecret());
              setShowSecret(true);
            }}
          >
            <ArrowsClockwiseIcon data-icon="inline-start" />
            Generate
          </Button>
        </div>
        <FieldMessage id="input-otp-secret" error={errors.otpSecret} hint="Generated on this device with a secure random source; never sent anywhere." />
      </div>
      <SelectField id="input-otp-algorithm" label="Algorithm" value={v.otpAlgorithm} options={OTP_ALGORITHMS.map((a) => ({ value: a, label: a === 'SHA1' ? 'SHA-1 (most compatible)' : a.replace('SHA', 'SHA-') }))} onChange={(x) => onChange('otpAlgorithm', x as OtpAlgorithm)} />
      <SelectField id="input-otp-digits" label="Digits" value={v.otpDigits} options={OTP_DIGITS.map((d) => ({ value: String(d), label: `${d} digits` }))} onChange={(x) => onChange('otpDigits', x)} />
      <Field id="input-otp-period" label="Period (seconds)" type="number" inputMode="numeric" value={v.otpPeriod} error={errors.otpPeriod} hint="Some apps support only SHA-1, 6 digits and 30 seconds." onChange={(x) => onChange('otpPeriod', x)} />
    </div>
  );
}

function GeoInputs({ values: v, errors, onChange }: Omit<InputsProps, 'type'>) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field id="input-geo-lat" label="Latitude" placeholder="38.7223" inputMode="decimal" value={v.geoLat} error={errors.geoLat} onChange={(x) => onChange('geoLat', x)} />
      <Field id="input-geo-lng" label="Longitude" placeholder="-9.1393" inputMode="decimal" value={v.geoLng} error={errors.geoLng} onChange={(x) => onChange('geoLng', x)} />
      <Field
        id="input-geo-query"
        label="Label or search (optional)"
        placeholder="Praça do Comércio"
        className="sm:col-span-2"
        value={v.geoQuery}
        hint="Without coordinates, map apps search for this text."
        onChange={(x) => onChange('geoQuery', x)}
      />
    </div>
  );
}

export function ContentInputs({ type, values: v, errors, onChange }: InputsProps) {
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
          <SelectField<WifiSecurity>
            id="input-wifi-type"
            label="Security"
            value={v.wifiType}
            options={[
              { value: 'WPA', label: 'WPA/WPA2' },
              { value: 'WEP', label: 'WEP' },
              { value: 'nopass', label: 'Open (no password)' },
            ]}
            onChange={(x) => onChange('wifiType', x)}
          />
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
    case 'phone':
      return (
        <div className="grid gap-4">
          <Field id="input-phone" label="Phone number" type="tel" placeholder="+351 912 345 678" value={v.phoneNumber} error={errors.phoneNumber} hint="Include the country code so it dials from anywhere." onChange={(x) => onChange('phoneNumber', x)} />
        </div>
      );
    case 'whatsapp':
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="input-wa-phone" label="WhatsApp number" type="tel" placeholder="+351 912 345 678" className="sm:col-span-2" value={v.waPhone} error={errors.waPhone} hint="Country code and number. Leave empty to let the person pick a chat." onChange={(x) => onChange('waPhone', x)} />
          <AreaField id="input-wa-text" label="Prefilled message (optional)" rows={3} placeholder="Hi! I saw your sign." value={v.waText} onChange={(x) => onChange('waText', x)} />
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
    case 'event': {
      const inputType = v.eventAllDay ? 'date' : 'datetime-local';
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="input-event-title" label="Title" placeholder="Launch party" className="sm:col-span-2" value={v.eventTitle} onChange={(x) => onChange('eventTitle', x)} />
          <div className="flex items-center gap-3 sm:col-span-2">
            <Switch
              id="input-event-allday"
              checked={v.eventAllDay}
              onCheckedChange={(allDay) => {
                onChange('eventAllDay', allDay);
                onChange('eventStart', convertEventValue(v.eventStart, allDay, '09:00'));
                onChange('eventEnd', convertEventValue(v.eventEnd, allDay, '10:00'));
              }}
            />
            <Label htmlFor="input-event-allday">All day</Label>
          </div>
          <Field id="input-event-start" label="Starts" type={inputType} value={v.eventStart} onChange={(x) => onChange('eventStart', x)} />
          <Field id="input-event-end" label="Ends" type={inputType} value={v.eventEnd} error={errors.eventEnd} onChange={(x) => onChange('eventEnd', x)} />
          <Field id="input-event-location" label="Location (optional)" placeholder="Room 1, Main St 10" className="sm:col-span-2" value={v.eventLocation} onChange={(x) => onChange('eventLocation', x)} />
          <AreaField id="input-event-description" label="Description (optional)" rows={3} placeholder="Bring a friend." value={v.eventDescription} onChange={(x) => onChange('eventDescription', x)} />
          <p className="text-xs text-muted-foreground sm:col-span-2">Times are local: the scanning phone adds the event in its own time zone.</p>
        </div>
      );
    }
    case 'geo':
      return <GeoInputs values={v} errors={errors} onChange={onChange} />;
    case 'otp':
      return <OtpInputs values={v} errors={errors} onChange={onChange} />;
  }
}
