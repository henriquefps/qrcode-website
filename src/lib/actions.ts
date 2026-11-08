/** Per-type actions for a scanned code. Pure: hrefs and file contents only, the UI renders them. Nothing opens by itself. */
import { safeHttp, type Parsed } from './parse';
import { buildVcf } from './vcard';

export type ActionIcon = 'open' | 'call' | 'map' | 'email' | 'sms' | 'contact' | 'password';

export type Action =
  /** A link the user clicks. `external` opens in a new tab (http(s) only). */
  | { kind: 'link'; id: string; label: string; href: string; icon: ActionIcon; external?: boolean }
  | { kind: 'download'; id: string; label: string; filename: string; mime: string; content: string; icon: ActionIcon }
  | { kind: 'copy'; id: string; label: string; value: string; secret: boolean; icon: ActionIcon };

const fieldValue = (parsed: Parsed, label: string) => parsed.fields.find((f) => f.label === label)?.value;

/** Characters a dialer understands. */
const dialable = (s: string) => s.replace(/[^\d+*#,;]/g, '');

export function osmUrl(lat: number, lon: number): string {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`;
}

export function actionsFor(text: string, parsed: Parsed): Action[] {
  switch (parsed.kind) {
    case 'url': {
      const href = safeHttp(text);
      return href ? [{ kind: 'link', id: 'open', label: 'Open link', href, icon: 'open', external: true }] : [];
    }
    case 'tel': {
      const number = dialable(fieldValue(parsed, 'Number') ?? '');
      return number ? [{ kind: 'link', id: 'call', label: 'Call', href: `tel:${number}`, icon: 'call' }] : [];
    }
    case 'geo': {
      const lat = Number(fieldValue(parsed, 'Latitude'));
      const lon = Number(fieldValue(parsed, 'Longitude'));
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return [];
      return [
        { kind: 'link', id: 'maps', label: 'Open in maps', href: `geo:${lat},${lon}`, icon: 'map' },
        { kind: 'link', id: 'osm', label: 'OpenStreetMap', href: osmUrl(lat, lon), icon: 'open', external: true },
      ];
    }
    case 'email': {
      const to = fieldValue(parsed, 'To') ?? '';
      const params = new URLSearchParams();
      for (const [label, key] of [['Cc', 'cc'], ['Bcc', 'bcc'], ['Subject', 'subject'], ['Message', 'body']] as const) {
        const v = fieldValue(parsed, label);
        if (v) params.set(key, v);
      }
      const query = params.toString().replace(/\+/g, '%20');
      return [{ kind: 'link', id: 'compose', label: 'Compose email', href: `mailto:${encodeURI(to)}${query ? `?${query}` : ''}`, icon: 'email' }];
    }
    case 'sms': {
      const to = dialable(fieldValue(parsed, 'To') ?? '');
      const body = fieldValue(parsed, 'Message');
      if (!to && !body) return [];
      return [{ kind: 'link', id: 'sms', label: 'Send SMS', href: `sms:${to}${body ? `?body=${encodeURIComponent(body)}` : ''}`, icon: 'sms' }];
    }
    case 'vcard':
    case 'mecard': {
      const vcf = buildVcf(text);
      return vcf ? [{ kind: 'download', id: 'save', label: 'Save contact', filename: vcf.filename, mime: 'text/vcard', content: vcf.content, icon: 'contact' }] : [];
    }
    case 'wifi': {
      const password = parsed.fields.find((f) => f.label === 'Password');
      return password ? [{ kind: 'copy', id: 'password', label: 'Copy password', value: password.value, secret: true, icon: 'password' }] : [];
    }
    default:
      return [];
  }
}
