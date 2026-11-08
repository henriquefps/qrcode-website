// Batch creation: CSV parsing, column mapping to a content type's fields, and file names.
import { getQRDataString, validateForm, type ContentType, type FormValues } from './qrData';

export const MAX_BATCH_ROWS = 1000;
export const MAX_BATCH_FILE_BYTES = 2 * 1024 * 1024;

type TextKey = { [K in keyof FormValues]: FormValues[K] extends string ? K : never }[keyof FormValues];
type BoolKey = { [K in keyof FormValues]: FormValues[K] extends boolean ? K : never }[keyof FormValues];

export interface BatchField {
  key: TextKey | BoolKey;
  label: string;
  /** Extra header names recognized when mapping columns automatically. */
  aliases?: string[];
}

/** Fields a CSV column can fill, per content type. The first one is the primary (required) field. */
export const BATCH_FIELDS: Record<ContentType, BatchField[]> = {
  url: [{ key: 'url', label: 'URL', aliases: ['link', 'website', 'address'] }],
  text: [{ key: 'text', label: 'Text', aliases: ['value', 'message', 'content'] }],
  wifi: [
    { key: 'wifiSsid', label: 'Network name', aliases: ['ssid', 'network', 'wifi'] },
    { key: 'wifiPass', label: 'Password', aliases: ['password', 'pass', 'key'] },
    { key: 'wifiHidden', label: 'Hidden', aliases: ['hidden'] },
  ],
  email: [
    { key: 'emailTo', label: 'To', aliases: ['email', 'to', 'address', 'mail'] },
    { key: 'emailSub', label: 'Subject', aliases: ['subject'] },
    { key: 'emailBody', label: 'Message', aliases: ['body', 'message'] },
  ],
  sms: [
    { key: 'smsPhone', label: 'Phone number', aliases: ['phone', 'number', 'tel', 'mobile'] },
    { key: 'smsBody', label: 'Message', aliases: ['message', 'body', 'text'] },
  ],
  phone: [{ key: 'phoneNumber', label: 'Phone number', aliases: ['phone', 'number', 'tel', 'mobile'] }],
  whatsapp: [
    { key: 'waPhone', label: 'Phone number', aliases: ['phone', 'number', 'whatsapp', 'mobile'] },
    { key: 'waText', label: 'Message', aliases: ['message', 'text', 'body'] },
  ],
  vcard: [
    { key: 'vcardFirst', label: 'First name', aliases: ['first', 'firstname', 'first name', 'given name'] },
    { key: 'vcardLast', label: 'Last name', aliases: ['last', 'lastname', 'last name', 'surname', 'family name'] },
    { key: 'vcardCompany', label: 'Company', aliases: ['company', 'organization', 'org'] },
    { key: 'vcardTitle', label: 'Job title', aliases: ['title', 'job title', 'role'] },
    { key: 'vcardPhone', label: 'Mobile phone', aliases: ['phone', 'mobile', 'tel'] },
    { key: 'vcardEmail', label: 'Work email', aliases: ['email', 'mail'] },
    { key: 'vcardUrl', label: 'Website', aliases: ['website', 'url', 'site'] },
  ],
  event: [
    { key: 'eventTitle', label: 'Title', aliases: ['title', 'name', 'summary', 'event'] },
    { key: 'eventStart', label: 'Start', aliases: ['start', 'begin', 'from', 'date'] },
    { key: 'eventEnd', label: 'End', aliases: ['end', 'until', 'to'] },
    { key: 'eventLocation', label: 'Location', aliases: ['location', 'place', 'venue'] },
    { key: 'eventDescription', label: 'Description', aliases: ['description', 'notes', 'details'] },
  ],
  geo: [
    { key: 'geoLat', label: 'Latitude', aliases: ['lat', 'latitude'] },
    { key: 'geoLng', label: 'Longitude', aliases: ['lng', 'lon', 'long', 'longitude'] },
    { key: 'geoQuery', label: 'Label or search', aliases: ['query', 'label', 'name', 'place'] },
  ],
  otp: [
    { key: 'otpAccount', label: 'Account', aliases: ['account', 'user', 'username', 'email'] },
    { key: 'otpSecret', label: 'Secret', aliases: ['secret', 'key'] },
    { key: 'otpIssuer', label: 'Issuer', aliases: ['issuer', 'service'] },
  ],
};

/** Detects the delimiter from the first line: tab, semicolon or comma (the most frequent outside quotes). */
export function detectDelimiter(text: string): ',' | ';' | '\t' {
  const first = text.split(/\r?\n/, 1)[0] ?? '';
  const unquoted = first.replace(/"[^"]*"/g, '');
  const counts = { '\t': unquoted.split('\t').length, ';': unquoted.split(';').length, ',': unquoted.split(',').length };
  const best = (Object.keys(counts) as (keyof typeof counts)[]).reduce((a, b) => (counts[b] > counts[a] ? b : a), ',');
  return counts[best] > 1 ? best : ',';
}

/**
 * RFC 4180 CSV: quoted fields with `""` escapes and embedded newlines, CRLF or LF rows.
 * Blank lines are dropped. Stops after `maxRows` rows (+1 so callers can tell it was cut).
 */
export function parseCsv(text: string, delimiter: string = detectDelimiter(text), maxRows = MAX_BATCH_ROWS + 1): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  let i = 0;
  const src = text.replace(/^\uFEFF/, '');
  const pushRow = () => {
    row.push(field);
    field = '';
    if (row.length > 1 || row[0].trim() !== '') rows.push(row);
    row = [];
  };
  while (i < src.length && rows.length < maxRows) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += ch;
    } else if (ch === '"' && field === '') quoted = true;
    else if (ch === delimiter) {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      pushRow();
    } else field += ch;
    i++;
  }
  if (rows.length < maxRows && (field !== '' || row.length > 0)) pushRow();
  return rows;
}

/** One value per line (no column splitting, so URLs and text may contain commas). */
export function parseLines(text: string, maxRows = MAX_BATCH_ROWS + 1): string[][] {
  return text
    .replace(/^\uFEFF/, '')
    .split(/\r\n|\r|\n/)
    .filter((line) => line.trim() !== '')
    .slice(0, maxRows)
    .map((line) => [line]);
}

/** column index per field key; -1 = not used. */
export type ColumnMapping = Partial<Record<BatchField['key'], number>>;

const norm = (s: string) => s.trim().toLowerCase().replace(/[_-]+/g, ' ');

/** Maps header names to fields (by key, label or alias). Without a header, the primary field takes column 0. */
export function autoMap(type: ContentType, headers: string[] | null): ColumnMapping {
  const fields = BATCH_FIELDS[type];
  const mapping: ColumnMapping = {};
  if (!headers) {
    mapping[fields[0].key] = 0;
    return mapping;
  }
  const names = headers.map(norm);
  const used = new Set<number>();
  for (const f of fields) {
    const candidates = [f.key.toLowerCase(), norm(f.label), ...(f.aliases ?? []).map(norm)];
    const idx = names.findIndex((n, i) => !used.has(i) && candidates.includes(n));
    if (idx >= 0) {
      mapping[f.key] = idx;
      used.add(idx);
    }
  }
  if (mapping[fields[0].key] === undefined && headers.length > 0 && !used.has(0)) mapping[fields[0].key] = 0;
  return mapping;
}

/** Guesses whether the first row is a header: some cell matches a field name of this type. */
export function looksLikeHeader(type: ContentType, firstRow: string[]): boolean {
  const names = new Set(BATCH_FIELDS[type].flatMap((f) => [f.key.toLowerCase(), norm(f.label), ...(f.aliases ?? []).map(norm)]));
  names.add('name');
  names.add('file');
  names.add('filename');
  return firstRow.some((c) => names.has(norm(c)));
}

const TRUE = /^(true|yes|y|1|x)$/i;

/** Form values for one row: mapped columns override `base` (the current form). */
export function rowToValues(type: ContentType, row: string[], mapping: ColumnMapping, base: FormValues): FormValues {
  const out: FormValues = { ...base };
  for (const f of BATCH_FIELDS[type]) {
    const idx = mapping[f.key];
    if (idx === undefined || idx < 0) continue;
    const cell = (row[idx] ?? '').trim();
    if (typeof base[f.key] === 'boolean') (out as unknown as Record<string, boolean>)[f.key] = TRUE.test(cell);
    else (out as unknown as Record<string, string>)[f.key] = cell;
  }
  return out;
}

/** Safe, short file name stem: no path separators, reserved or control characters. */
export function sanitizeFileName(raw: string): string {
  return raw
    .normalize('NFKC')
    // eslint-disable-next-line no-control-regex -- stripping control characters is the point
    .replace(/[\\/:*?"<>|\u0000-\u001f\u007f]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\.+/, '')
    .replace(/[. ]+$/, '')
    .slice(0, 80);
}

export interface BatchItem {
  /** 1-based row number in the source (after the header). */
  row: number;
  name: string;
  data: string;
}

export interface BatchPlan {
  items: BatchItem[];
  /** Rows without a value in the primary field. */
  empty: number;
  /** Rows with a value that fails validation, with the first message. */
  invalid: { row: number; message: string }[];
  /** True when the source had more than MAX_BATCH_ROWS rows. */
  truncated: boolean;
}

/** Turns rows into payloads and unique file names (from `nameColumn`, else the row number). */
export function planBatch(type: ContentType, rows: string[][], mapping: ColumnMapping, nameColumn: number, base: FormValues): BatchPlan {
  const truncated = rows.length > MAX_BATCH_ROWS;
  const primary = BATCH_FIELDS[type][0].key;
  const pad = String(Math.min(rows.length, MAX_BATCH_ROWS)).length;
  const used = new Set<string>();
  const plan: BatchPlan = { items: [], empty: 0, invalid: [], truncated };
  rows.slice(0, MAX_BATCH_ROWS).forEach((row, i) => {
    const n = i + 1;
    const values = rowToValues(type, row, mapping, base);
    if (String(values[primary]).trim() === '') {
      plan.empty++;
      return;
    }
    const errors = Object.values(validateForm(type, values));
    if (errors.length > 0) {
      plan.invalid.push({ row: n, message: errors[0] });
      return;
    }
    const stem = (nameColumn >= 0 && sanitizeFileName(row[nameColumn] ?? '')) || `qrcode-${String(n).padStart(pad, '0')}`;
    let name = stem;
    for (let k = 2; used.has(name.toLowerCase()); k++) name = `${stem}-${k}`;
    used.add(name.toLowerCase());
    plan.items.push({ row: n, name, data: getQRDataString(type, values) });
  });
  return plan;
}
