import { describe, expect, it } from 'vitest';
import { buildVcf } from './vcard';
import { parseVcard } from './parse';

describe('buildVcf', () => {
  it('passes a vCard through with CRLF line endings', () => {
    const v = buildVcf('BEGIN:VCARD\nVERSION:3.0\nFN:Ana Souza\nTEL:+55 11 9999\nEND:VCARD')!;
    expect(v.content).toBe('BEGIN:VCARD\r\nVERSION:3.0\r\nFN:Ana Souza\r\nTEL:+55 11 9999\r\nEND:VCARD\r\n');
    expect(v.filename).toBe('Ana-Souza.vcf');
  });
  it('adds a missing END and names from N', () => {
    const v = buildVcf('BEGIN:VCARD\nN:Souza;Ana;;;')!;
    expect(v.content.endsWith('END:VCARD\r\n')).toBe(true);
    expect(v.filename).toBe('Ana-Souza.vcf');
  });
  it('converts a MeCard to vCard 3.0 with escaping', () => {
    const v = buildVcf('MECARD:N:Doe,John;TEL:+1 555;EMAIL:j@x.com;NOTE:a\\;b, c;BDAY:19900131;;')!;
    expect(v.content).toBe(
      ['BEGIN:VCARD', 'VERSION:3.0', 'N:Doe;John;;;', 'FN:John Doe', 'TEL:+1 555', 'EMAIL:j@x.com', 'NOTE:a\\;b\\, c', 'BDAY:1990-01-31', 'END:VCARD', ''].join('\r\n'),
    );
    expect(v.filename).toBe('John-Doe.vcf');
    // The result round-trips through our own vCard parser.
    const back = parseVcard(v.content)!;
    expect(back.fields.find((f) => f.label === 'Name')?.value).toBe('John Doe');
    expect(back.fields.find((f) => f.label === 'Note')?.value).toBe('a;b, c');
  });
  it('falls back to contact.vcf and strips unsafe filename chars', () => {
    expect(buildVcf('MECARD:TEL:1;;')!.filename).toBe('contact.vcf');
    expect(buildVcf('BEGIN:VCARD\nFN:../../José?\nEND:VCARD')!.filename).toBe('..-..-Jose.vcf');
  });
  it('returns null for other content', () => {
    expect(buildVcf('hello')).toBeNull();
  });
});
