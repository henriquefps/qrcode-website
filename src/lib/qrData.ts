// Pure builders: form values -> the string that goes inside the QR code.
import { buildEvent } from './ical';
import { buildOtpAuth, normalizeSecret, OTP_DEFAULTS, type OtpAlgorithm } from './otpauth';

export const CONTENT_TYPES = ['url', 'text', 'wifi', 'email', 'sms', 'phone', 'whatsapp', 'vcard', 'event', 'geo', 'otp'] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];
export type WifiSecurity = 'WPA' | 'WEP' | 'nopass';
export type { OtpAlgorithm };

export interface FormValues {
  url: string;
  text: string;
  wifiSsid: string;
  wifiPass: string;
  wifiType: WifiSecurity;
  wifiHidden: boolean;
  emailTo: string;
  emailSub: string;
  emailBody: string;
  smsPhone: string;
  smsBody: string;
  vcardFirst: string;
  vcardLast: string;
  vcardCompany: string;
  vcardTitle: string;
  vcardPhone: string;
  vcardEmail: string;
  vcardUrl: string;
  phoneNumber: string;
  waPhone: string;
  waText: string;
  geoLat: string;
  geoLng: string;
  geoQuery: string;
  eventTitle: string;
  /** `YYYY-MM-DDTHH:mm` (timed) or `YYYY-MM-DD` (all day), as the browser date inputs give them. */
  eventStart: string;
  eventEnd: string;
  eventAllDay: boolean;
  eventLocation: string;
  eventDescription: string;
  otpIssuer: string;
  otpAccount: string;
  otpSecret: string;
  otpDigits: string;
  otpPeriod: string;
  otpAlgorithm: OtpAlgorithm;
}

export const EMPTY_FORM: FormValues = {
  url: '',
  text: '',
  wifiSsid: '',
  wifiPass: '',
  wifiType: 'WPA',
  wifiHidden: false,
  emailTo: '',
  emailSub: '',
  emailBody: '',
  smsPhone: '',
  smsBody: '',
  vcardFirst: '',
  vcardLast: '',
  vcardCompany: '',
  vcardTitle: '',
  vcardPhone: '',
  vcardEmail: '',
  vcardUrl: '',
  phoneNumber: '',
  waPhone: '',
  waText: '',
  geoLat: '',
  geoLng: '',
  geoQuery: '',
  eventTitle: '',
  eventStart: '',
  eventEnd: '',
  eventAllDay: false,
  eventLocation: '',
  eventDescription: '',
  otpIssuer: '',
  otpAccount: '',
  otpSecret: '',
  otpDigits: String(OTP_DEFAULTS.digits),
  otpPeriod: String(OTP_DEFAULTS.period),
  otpAlgorithm: OTP_DEFAULTS.algorithm,
};

/** Wi-Fi payload fields: `\`, `;`, `,`, `:` and `"` are backslash-escaped (ZXing / Android spec). */
export function escapeWifi(value: string): string {
  return value.replace(/([\\;,:"])/g, '\\$1');
}

/** vCard 3.0 text values: backslash, semicolon, comma and line breaks are escaped. */
export function escapeVcard(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
}

export function buildUrl(raw: string): string {
  const url = raw.trim();
  if (url === '') return 'https://example.com';
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

export function buildWifi(ssid: string, pass: string, type: WifiSecurity, hidden: boolean): string {
  if (!ssid) return 'WIFI:T:WPA;S:Qrcode_Guest;P:;;';
  const password = type === 'nopass' ? '' : escapeWifi(pass);
  return `WIFI:T:${type};S:${escapeWifi(ssid)};P:${password};H:${hidden ? 'true' : 'false'};;`;
}

export function buildEmail(to: string, subject: string, body: string): string {
  const address = to.trim();
  if (!address) return 'mailto:hello@company.com';
  return `mailto:${address}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function buildSms(phone: string, body: string): string {
  const number = phone.trim();
  if (!number) return 'SMSTO:';
  return `SMSTO:${number}:${body}`;
}

export function buildVcard(v: Pick<FormValues, 'vcardFirst' | 'vcardLast' | 'vcardCompany' | 'vcardTitle' | 'vcardPhone' | 'vcardEmail' | 'vcardUrl'>): string {
  const first = v.vcardFirst.trim();
  const last = v.vcardLast.trim();
  if (!first && !last) return 'BEGIN:VCARD\nVERSION:3.0\nFN:Qrcode User\nEND:VCARD';
  const lines = ['BEGIN:VCARD', 'VERSION:3.0', `N:${escapeVcard(last)};${escapeVcard(first)};;;`, `FN:${escapeVcard(`${first} ${last}`.trim())}`];
  const company = v.vcardCompany.trim();
  const title = v.vcardTitle.trim();
  const cell = v.vcardPhone.trim();
  const mail = v.vcardEmail.trim();
  const website = v.vcardUrl.trim();
  if (company) lines.push(`ORG:${escapeVcard(company)}`);
  if (title) lines.push(`TITLE:${escapeVcard(title)}`);
  if (cell) lines.push(`TEL;TYPE=CELL:${escapeVcard(cell)}`);
  if (mail) lines.push(`EMAIL;TYPE=WORK,INTERNET:${escapeVcard(mail)}`);
  if (website) lines.push(`URL:${website}`);
  lines.push('END:VCARD');
  return lines.join('\n');
}

/** Keeps the characters a dialer understands: digits, a leading +, and * # , ; (pause / extension). */
export function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  const plus = trimmed.startsWith('+') ? '+' : '';
  return plus + trimmed.replace(/[^\d*#,;]/g, '');
}

export function buildPhone(raw: string): string {
  const number = normalizePhone(raw);
  return `tel:${number || '+1234567890'}`;
}

/** wa.me wants the full international number as digits only (no +, no leading 00, no spaces). */
export function whatsappDigits(raw: string): string {
  return raw.replace(/\D/g, '').replace(/^00/, '');
}

export function buildWhatsapp(phone: string, text: string): string {
  const digits = whatsappDigits(phone);
  const query = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${digits}${query}`;
}

const COORD = /^[-+]?\d{1,3}(?:\.\d+)?$/;

/** Parses a latitude or longitude; accepts a decimal comma. Returns null when invalid or out of range. */
export function parseCoordinate(raw: string, kind: 'lat' | 'lng'): number | null {
  const text = raw.trim().replace(',', '.');
  if (!COORD.test(text)) return null;
  const value = Number(text);
  const max = kind === 'lat' ? 90 : 180;
  return Math.abs(value) <= max ? value : null;
}

/** `geo:lat,lng` (RFC 5870) with an optional `?q=` search/label that Android and most map apps read. */
export function buildGeo(lat: string, lng: string, query: string): string {
  const la = parseCoordinate(lat, 'lat');
  const lo = parseCoordinate(lng, 'lng');
  const q = query.trim();
  const suffix = q ? `?q=${encodeURIComponent(q)}` : '';
  if (la === null || lo === null) return `geo:0,0${suffix || '?q=Lisbon'}`;
  return `geo:${la},${lo}${suffix}`;
}

export type FieldErrors = Partial<Record<keyof FormValues, string>>;

/** Field-level problems for the current type. The code is still drawn (with a placeholder) while there are errors. */
export function validateForm(type: ContentType, v: FormValues): FieldErrors {
  const errors: FieldErrors = {};
  switch (type) {
    case 'whatsapp': {
      const digits = whatsappDigits(v.waPhone);
      if (v.waPhone.trim() && (digits.length < 7 || digits.length > 15)) errors.waPhone = 'Use the full international number: country code and number, 7 to 15 digits.';
      break;
    }
    case 'phone':
      if (v.phoneNumber.trim() && !/\d/.test(normalizePhone(v.phoneNumber))) errors.phoneNumber = 'Enter a phone number.';
      break;
    case 'geo':
      if (v.geoLat.trim() && parseCoordinate(v.geoLat, 'lat') === null) errors.geoLat = 'Latitude is a number from -90 to 90.';
      if (v.geoLng.trim() && parseCoordinate(v.geoLng, 'lng') === null) errors.geoLng = 'Longitude is a number from -180 to 180.';
      if (!errors.geoLat && !errors.geoLng && !!v.geoLat.trim() !== !!v.geoLng.trim()) errors[v.geoLat.trim() ? 'geoLng' : 'geoLat'] = 'Enter both latitude and longitude.';
      break;
    case 'event':
      Object.assign(errors, validateEventFields(v));
      break;
    case 'otp':
      Object.assign(errors, validateOtpFields(v));
      break;
  }
  return errors;
}

function validateEventFields(v: FormValues): FieldErrors {
  const errors: FieldErrors = {};
  if (v.eventStart && v.eventEnd && v.eventEnd.slice(0, v.eventAllDay ? 10 : 16) < v.eventStart.slice(0, v.eventAllDay ? 10 : 16)) errors.eventEnd = 'The end is before the start.';
  return errors;
}

function validateOtpFields(v: FormValues): FieldErrors {
  const errors: FieldErrors = {};
  const secret = normalizeSecret(v.otpSecret);
  if (v.otpSecret.trim()) {
    if (!/^[A-Z2-7]+$/.test(secret)) errors.otpSecret = 'The secret is Base32: letters A to Z and digits 2 to 7.';
    else if (secret.length < 16) errors.otpSecret = 'Use at least 16 characters (80 bits).';
  }
  const period = Number(v.otpPeriod);
  if (!Number.isInteger(period) || period < 1 || period > 3600) errors.otpPeriod = 'The period is whole seconds, 1 to 3600.';
  if (v.otpIssuer.includes(':')) errors.otpIssuer = 'The issuer cannot contain a colon.';
  if (v.otpAccount.includes(':')) errors.otpAccount = 'The account cannot contain a colon.';
  return errors;
}

export function getQRDataString(type: ContentType, values: FormValues): string {
  switch (type) {
    case 'url':
      return buildUrl(values.url);
    case 'text':
      return values.text || 'Qrcode custom styled QR code!';
    case 'wifi':
      return buildWifi(values.wifiSsid, values.wifiPass, values.wifiType, values.wifiHidden);
    case 'email':
      return buildEmail(values.emailTo, values.emailSub, values.emailBody);
    case 'sms':
      return buildSms(values.smsPhone, values.smsBody);
    case 'vcard':
      return buildVcard(values);
    case 'phone':
      return buildPhone(values.phoneNumber);
    case 'whatsapp':
      return buildWhatsapp(values.waPhone, values.waText);
    case 'geo':
      return buildGeo(values.geoLat, values.geoLng, values.geoQuery);
    case 'event':
      return buildEvent({
        title: values.eventTitle,
        start: values.eventStart,
        end: values.eventEnd,
        allDay: values.eventAllDay,
        location: values.eventLocation,
        description: values.eventDescription,
      });
    case 'otp':
      return buildOtpAuth({
        issuer: values.otpIssuer,
        account: values.otpAccount,
        secret: values.otpSecret,
        digits: Number(values.otpDigits),
        period: Number(values.otpPeriod),
        algorithm: values.otpAlgorithm,
      });
  }
}
