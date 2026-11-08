/** Builds a downloadable .vcf from a scanned vCard or MeCard. Pure; the caller turns it into a Blob. */

const escapeVcf = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');

export interface Vcf {
  content: string;
  filename: string;
}

function filenameFor(name: string): string {
  const base = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w.-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `${base || 'contact'}.vcf`;
}

function vcardName(text: string): string {
  const lines = text.replace(/\r\n?/g, '\n').replace(/\n[ \t]/g, '').split('\n');
  const fn = lines.find((l) => /^(?:[\w-]+\.)?FN[;:]/i.test(l));
  if (fn) return fn.slice(fn.indexOf(':') + 1).replace(/\\(.)/g, '$1');
  const n = lines.find((l) => /^(?:[\w-]+\.)?N[;:]/i.test(l));
  if (n) return n.slice(n.indexOf(':') + 1).split(';').filter(Boolean).reverse().join(' ');
  return '';
}

function fromVcard(text: string): Vcf | null {
  const lines = text.trim().replace(/\r\n?/g, '\n').split('\n');
  if (!/^BEGIN:VCARD$/i.test(lines[0]?.trim() ?? '')) return null;
  if (!lines.some((l) => /^END:VCARD$/i.test(l.trim()))) lines.push('END:VCARD');
  return { content: `${lines.join('\r\n')}\r\n`, filename: filenameFor(vcardName(text)) };
}

function fromMecard(text: string): Vcf | null {
  if (!/^MECARD:/i.test(text.trim())) return null;
  const out = ['BEGIN:VCARD', 'VERSION:3.0'];
  let display = '';
  for (const part of splitRaw(text.trim().slice(7))) {
    const idx = part.indexOf(':');
    if (idx < 1) continue;
    const key = part.slice(0, idx).toUpperCase();
    const value = part.slice(idx + 1).replace(/\\(.)/gs, '$1');
    if (!value) continue;
    switch (key) {
      case 'N': {
        const [last = '', first = ''] = value.split(',').map((s) => s.trim());
        display = [first, last].filter(Boolean).join(' ');
        out.push(`N:${escapeVcf(last)};${escapeVcf(first)};;;`, `FN:${escapeVcf(display)}`);
        break;
      }
      case 'TEL':
        out.push(`TEL:${escapeVcf(value)}`);
        break;
      case 'EMAIL':
        out.push(`EMAIL:${escapeVcf(value)}`);
        break;
      case 'URL':
        out.push(`URL:${value.replace(/\n/g, '')}`);
        break;
      case 'ADR':
        out.push(`ADR:;;${escapeVcf(value)};;;;`);
        break;
      case 'NOTE':
        out.push(`NOTE:${escapeVcf(value)}`);
        break;
      case 'ORG':
        out.push(`ORG:${escapeVcf(value)}`);
        break;
      case 'NICKNAME':
        out.push(`NICKNAME:${escapeVcf(value)}`);
        break;
      case 'BDAY':
        if (/^\d{8}$/.test(value)) out.push(`BDAY:${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6)}`);
        break;
    }
  }
  if (!display) out.push('FN:');
  out.push('END:VCARD');
  return { content: `${out.join('\r\n')}\r\n`, filename: filenameFor(display) };
}

/** Splits a MeCard body on unescaped ';', keeping escapes for the value pass. */
function splitRaw(s: string): string[] {
  const out: string[] = [];
  let cur = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '\\' && i + 1 < s.length) {
      cur += c + s[i + 1];
      i++;
    } else if (c === ';') {
      out.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

/** Returns a .vcf for vCard or MeCard text, or null for anything else. */
export function buildVcf(text: string): Vcf | null {
  return fromVcard(text) ?? fromMecard(text);
}
