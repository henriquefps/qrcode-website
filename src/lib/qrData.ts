// Pure builders: form values -> the string that goes inside the QR code.

export const CONTENT_TYPES = ['url', 'text', 'wifi', 'email', 'sms', 'vcard'] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];
export type WifiSecurity = 'WPA' | 'WEP' | 'nopass';

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
  }
}
