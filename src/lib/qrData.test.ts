import { describe, expect, it } from 'vitest';
import { buildEmail, buildSms, buildUrl, buildVcard, buildWifi, EMPTY_FORM, escapeVcard, escapeWifi, getQRDataString } from './qrData';

describe('escapeWifi', () => {
  it('escapes the reserved characters', () => {
    expect(escapeWifi(String.raw`a;b,c:d"e\f`)).toBe(String.raw`a\;b\,c\:d\"e\\f`);
  });
  it('leaves plain text alone', () => {
    expect(escapeWifi('Home Network 5G')).toBe('Home Network 5G');
  });
});

describe('buildWifi', () => {
  it('builds a WPA payload with escaping', () => {
    expect(buildWifi('My;Net', 'p:a,ss', 'WPA', true)).toBe(String.raw`WIFI:T:WPA;S:My\;Net;P:p\:a\,ss;H:true;;`);
  });
  it('drops the password for open networks', () => {
    expect(buildWifi('Cafe', 'ignored', 'nopass', false)).toBe('WIFI:T:nopass;S:Cafe;P:;H:false;;');
  });
  it('falls back to a sample payload without SSID', () => {
    expect(buildWifi('', '', 'WPA', false)).toMatch(/^WIFI:/);
  });
});

describe('escapeVcard', () => {
  it('escapes backslash, semicolon, comma and newline', () => {
    expect(escapeVcard('a\\b;c,d\ne')).toBe(String.raw`a\\b\;c\,d\ne`);
  });
});

describe('buildVcard', () => {
  it('builds a card and escapes values', () => {
    const card = buildVcard({ ...EMPTY_FORM, vcardFirst: 'Jane', vcardLast: 'Doe', vcardCompany: 'Acme; Inc, Ltd', vcardEmail: 'j@x.io' });
    expect(card.split('\n')).toEqual([
      'BEGIN:VCARD',
      'VERSION:3.0',
      'N:Doe;Jane;;;',
      'FN:Jane Doe',
      String.raw`ORG:Acme\; Inc\, Ltd`,
      'EMAIL;TYPE=WORK,INTERNET:j@x.io',
      'END:VCARD',
    ]);
  });
  it('uses a placeholder without a name', () => {
    expect(buildVcard(EMPTY_FORM)).toContain('FN:Qrcode User');
  });
});

describe('other builders', () => {
  it('adds https to bare URLs and keeps explicit schemes', () => {
    expect(buildUrl(' example.com ')).toBe('https://example.com');
    expect(buildUrl('http://a.io')).toBe('http://a.io');
    expect(buildUrl('')).toBe('https://example.com');
  });
  it('builds mailto with encoded subject and body', () => {
    expect(buildEmail('a@b.co', 'Hi there', 'x&y')).toBe('mailto:a@b.co?subject=Hi%20there&body=x%26y');
  });
  it('builds SMSTO', () => {
    expect(buildSms('+351 912', 'Hello')).toBe('SMSTO:+351 912:Hello');
  });
  it('dispatches by type', () => {
    expect(getQRDataString('text', { ...EMPTY_FORM, text: 'hey' })).toBe('hey');
    expect(getQRDataString('url', { ...EMPTY_FORM, url: 'a.io' })).toBe('https://a.io');
  });
});
