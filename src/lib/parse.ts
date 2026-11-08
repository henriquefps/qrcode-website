/** Pure parsers that turn decoded QR text into a structured, displayable value. */

export interface Field {
  label: string;
  value: string;
  /** Hidden behind a mask by default (passwords, secrets). */
  secret?: boolean;
  /** Offer a copy button for this field. */
  copy?: boolean;
  /** Render as a link with this href. */
  href?: string;
}

export type ParsedKind = 'wifi' | 'vcard' | 'mecard' | 'email' | 'sms' | 'tel' | 'geo' | 'otpauth' | 'url' | 'text';

export interface Parsed {
  kind: ParsedKind;
  title: string;
  fields: Field[];
}

/** Splits `s` on unescaped `sep`, keeping backslash escapes for later unescaping. */
function splitUnescaped(s: string, sep: string): string[] {
  const out: string[] = [];
  let cur = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '\\' && i + 1 < s.length) {
      cur += c + s[i + 1];
      i++;
    } else if (c === sep) {
      out.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

const unescapeBackslash = (s: string) => s.replace(/\\(.)/gs, '$1');

export function parseWifi(text: string): Parsed | null {
  if (!/^WIFI:/i.test(text)) return null;
  const body = text.slice(5);
  const map = new Map<string, string>();
  for (const part of splitUnescaped(body, ';')) {
    if (!part) continue;
    const idx = part.indexOf(':');
    if (idx < 1) continue;
    const key = part.slice(0, idx).toUpperCase();
    if (!map.has(key)) map.set(key, unescapeBackslash(part.slice(idx + 1)));
  }
  const ssid = map.get('S');
  if (ssid === undefined) return null;
  const security = map.get('T') || 'nopass';
  const open = /^nopass$/i.test(security);
  const fields: Field[] = [
    { label: 'Network', value: ssid, copy: true },
    { label: 'Security', value: open ? 'None' : security.toUpperCase() },
  ];
  const password = map.get('P');
  if (password && !open) fields.push({ label: 'Password', value: password, secret: true, copy: true });
  if (map.get('H')?.toLowerCase() === 'true') fields.push({ label: 'Hidden network', value: 'Yes' });
  return { kind: 'wifi', title: 'Wi-Fi network', fields };
}

function unfoldVcard(text: string): string[] {
  return text.replace(/\r\n?/g, '\n').replace(/\n[ \t]/g, '').split('\n');
}

const unescapeVcard = (s: string) => s.replace(/\\([nN,;\\])/g, (_m, c: string) => (c === 'n' || c === 'N' ? '\n' : c));

export function parseVcard(text: string): Parsed | null {
  if (!/^BEGIN:VCARD/i.test(text.trim())) return null;
  const fields: Field[] = [];
  let name = '';
  for (const line of unfoldVcard(text)) {
    const idx = line.indexOf(':');
    if (idx < 1) continue;
    const head = line.slice(0, idx).split(';');
    const prop = head[0].replace(/^.*\./, '').toUpperCase();
    const value = line.slice(idx + 1);
    switch (prop) {
      case 'FN':
        name = unescapeVcard(value);
        break;
      case 'N':
        if (!name) name = splitUnescaped(value, ';').map(unescapeVcard).filter(Boolean).reverse().join(' ');
        break;
      case 'ORG':
        fields.push({ label: 'Organization', value: splitUnescaped(value, ';').map(unescapeVcard).filter(Boolean).join(', ') });
        break;
      case 'TITLE':
        fields.push({ label: 'Title', value: unescapeVcard(value) });
        break;
      case 'TEL':
        fields.push({ label: 'Phone', value: unescapeVcard(value), copy: true, href: `tel:${value.replace(/[^\d+]/g, '')}` });
        break;
      case 'EMAIL':
        fields.push({ label: 'Email', value: unescapeVcard(value), copy: true, href: `mailto:${value}` });
        break;
      case 'URL':
        fields.push({ label: 'Website', value: unescapeVcard(value), copy: true, href: safeHttp(value) });
        break;
      case 'ADR':
        fields.push({ label: 'Address', value: splitUnescaped(value, ';').map(unescapeVcard).filter(Boolean).join(', ') });
        break;
      case 'NOTE':
        fields.push({ label: 'Note', value: unescapeVcard(value) });
        break;
    }
  }
  if (name) fields.unshift({ label: 'Name', value: name, copy: true });
  return { kind: 'vcard', title: 'Contact card', fields };
}

export function parseMecard(text: string): Parsed | null {
  if (!/^MECARD:/i.test(text)) return null;
  const fields: Field[] = [];
  for (const part of splitUnescaped(text.slice(7), ';')) {
    const idx = part.indexOf(':');
    if (idx < 1) continue;
    const key = part.slice(0, idx).toUpperCase();
    const value = unescapeBackslash(part.slice(idx + 1));
    if (!value) continue;
    switch (key) {
      case 'N':
        fields.push({ label: 'Name', value: value.split(',').map((s) => s.trim()).filter(Boolean).reverse().join(' '), copy: true });
        break;
      case 'TEL':
        fields.push({ label: 'Phone', value, copy: true, href: `tel:${value.replace(/[^\d+]/g, '')}` });
        break;
      case 'EMAIL':
        fields.push({ label: 'Email', value, copy: true, href: `mailto:${value}` });
        break;
      case 'URL':
        fields.push({ label: 'Website', value, copy: true, href: safeHttp(value) });
        break;
      case 'ADR':
        fields.push({ label: 'Address', value });
        break;
      case 'NOTE':
        fields.push({ label: 'Note', value });
        break;
      case 'ORG':
        fields.push({ label: 'Organization', value });
        break;
    }
  }
  return { kind: 'mecard', title: 'Contact card', fields };
}

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

export function parseMailto(text: string): Parsed | null {
  const m = /^mailto:([^?]*)(?:\?(.*))?$/is.exec(text.trim());
  if (!m) return null;
  const params = new URLSearchParams(m[2] ?? '');
  const to = safeDecode(m[1]);
  const fields: Field[] = [];
  if (to) fields.push({ label: 'To', value: to, copy: true });
  for (const [key, label] of [['cc', 'Cc'], ['bcc', 'Bcc'], ['subject', 'Subject'], ['body', 'Message']] as const) {
    const v = params.get(key);
    if (v) fields.push({ label, value: v, copy: key === 'body' });
  }
  return { kind: 'email', title: 'Email', fields };
}

export function parseSms(text: string): Parsed | null {
  const m = /^(sms|smsto):([^?:]*)(?::(.*))?(?:\?(.*))?$/is.exec(text.trim());
  if (!m) return null;
  const fields: Field[] = [];
  const number = safeDecode(m[2]);
  if (number) fields.push({ label: 'To', value: number, copy: true });
  // smsto:NUMBER:MESSAGE, or sms:NUMBER?body=MESSAGE
  let body: string | undefined = m[3];
  if (body === undefined && m[4]) body = new URLSearchParams(m[4]).get('body') ?? undefined;
  if (body) fields.push({ label: 'Message', value: body, copy: true });
  return { kind: 'sms', title: 'SMS', fields };
}

export function parseTel(text: string): Parsed | null {
  const m = /^tel:(.+)$/is.exec(text.trim());
  if (!m) return null;
  const value = safeDecode(m[1]);
  return { kind: 'tel', title: 'Phone number', fields: [{ label: 'Number', value, copy: true, href: `tel:${value.replace(/[^\d+*#,;]/g, '')}` }] };
}

export function parseGeo(text: string): Parsed | null {
  const m = /^geo:(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)(?:,(-?\d+(?:\.\d+)?))?(?:[;?].*)?$/i.exec(text.trim());
  if (!m) return null;
  const lat = Number(m[1]);
  const lon = Number(m[2]);
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  const fields: Field[] = [
    { label: 'Latitude', value: m[1], copy: true },
    { label: 'Longitude', value: m[2], copy: true },
  ];
  if (m[3]) fields.push({ label: 'Altitude', value: `${m[3]} m` });
  // Map links are offered as actions (see lib/actions).
  return { kind: 'geo', title: 'Location', fields };
}

export function parseOtpauth(text: string): Parsed | null {
  const m = /^otpauth:\/\/(totp|hotp)\/([^?]*)(?:\?(.*))?$/i.exec(text.trim());
  if (!m) return null;
  const label = safeDecode(m[2]);
  const params = new URLSearchParams(m[3] ?? '');
  const colon = label.indexOf(':');
  const labelIssuer = colon >= 0 ? label.slice(0, colon).trim() : '';
  const account = (colon >= 0 ? label.slice(colon + 1) : label).trim();
  const issuer = params.get('issuer') || labelIssuer;
  const fields: Field[] = [];
  if (issuer) fields.push({ label: 'Issuer', value: issuer });
  if (account) fields.push({ label: 'Account', value: account, copy: true });
  const secret = params.get('secret');
  if (secret) fields.push({ label: 'Secret', value: secret, secret: true, copy: true });
  fields.push({ label: 'Type', value: m[1].toUpperCase() });
  for (const [key, label2] of [['algorithm', 'Algorithm'], ['digits', 'Digits'], ['period', 'Period (s)'], ['counter', 'Counter']] as const) {
    const v = params.get(key);
    if (v) fields.push({ label: label2, value: v });
  }
  return { kind: 'otpauth', title: 'One-time password', fields };
}

/** Returns the URL when it is http(s), otherwise undefined. */
export function safeHttp(text: string): string | undefined {
  const t = text.trim();
  if (!/^https?:\/\//i.test(t) || /\s/.test(t)) return undefined;
  try {
    const u = new URL(t);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : undefined;
  } catch {
    return undefined;
  }
}

export function parseUrl(text: string): Parsed | null {
  const href = safeHttp(text);
  if (!href) return null;
  const u = new URL(href);
  return {
    kind: 'url',
    title: 'Link',
    fields: [
      { label: 'Address', value: text.trim(), copy: true, href },
      { label: 'Site', value: u.host },
    ],
  };
}

const PARSERS = [parseWifi, parseOtpauth, parseVcard, parseMecard, parseMailto, parseSms, parseTel, parseGeo, parseUrl];

/** Detects the content type of decoded text. Never throws; falls back to plain text. */
export function parseContent(text: string): Parsed {
  for (const parser of PARSERS) {
    try {
      const parsed = parser(text);
      if (parsed) return parsed;
    } catch {
      // fall through to plain text
    }
  }
  return { kind: 'text', title: 'Text', fields: [] };
}
