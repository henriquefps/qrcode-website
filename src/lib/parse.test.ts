import { describe, expect, it } from 'vitest';
import { parseContent, parseGeo, parseMailto, parseMecard, parseOtpauth, parseSms, parseTel, parseUrl, parseVcard, parseWifi, safeHttp } from './parse';

const get = (p: { fields: { label: string; value: string }[] } | null, label: string) => p?.fields.find((f) => f.label === label)?.value;

describe('parseWifi', () => {
  it('parses a standard payload', () => {
    const p = parseWifi('WIFI:T:WPA;S:Home;P:secret123;H:true;;');
    expect(get(p, 'Network')).toBe('Home');
    expect(get(p, 'Security')).toBe('WPA');
    expect(get(p, 'Password')).toBe('secret123');
    expect(get(p, 'Hidden network')).toBe('Yes');
    expect(p?.fields.find((f) => f.label === 'Password')?.secret).toBe(true);
  });
  it('handles escaped separators in ssid and password', () => {
    const p = parseWifi(String.raw`WIFI:T:WPA;S:a\;b\:c;P:p\\w\;d;;`);
    expect(get(p, 'Network')).toBe('a;b:c');
    expect(get(p, 'Password')).toBe('p\\w;d');
  });
  it('treats nopass as open without password', () => {
    const p = parseWifi('WIFI:T:nopass;S:Cafe;;');
    expect(get(p, 'Security')).toBe('None');
    expect(get(p, 'Password')).toBeUndefined();
  });
  it('is case insensitive on keys and prefix, order independent', () => {
    expect(get(parseWifi('wifi:s:X;p:Y;t:WEP;;'), 'Password')).toBe('Y');
  });
  it('rejects payloads without ssid or other schemes', () => {
    expect(parseWifi('WIFI:T:WPA;P:x;;')).toBeNull();
    expect(parseWifi('hello')).toBeNull();
  });
});

describe('parseVcard', () => {
  const card = ['BEGIN:VCARD', 'VERSION:3.0', 'N:Silva;Ana;;;', 'FN:Ana Silva', 'ORG:Acme\\, Inc.', 'TEL;TYPE=CELL:+55 11 91234-5678', 'EMAIL:ana@example.com', 'URL:https://example.com', 'NOTE:line1\\nline2', 'END:VCARD'].join('\r\n');
  it('extracts fields and unescapes', () => {
    const p = parseVcard(card);
    expect(get(p, 'Name')).toBe('Ana Silva');
    expect(get(p, 'Organization')).toBe('Acme, Inc.');
    expect(get(p, 'Phone')).toBe('+55 11 91234-5678');
    expect(p?.fields.find((f) => f.label === 'Phone')?.href).toBe('tel:+5511912345678');
    expect(get(p, 'Email')).toBe('ana@example.com');
    expect(get(p, 'Note')).toBe('line1\nline2');
  });
  it('builds the name from N when FN is missing', () => {
    expect(get(parseVcard('BEGIN:VCARD\nN:Silva;Ana\nEND:VCARD'), 'Name')).toBe('Ana Silva');
  });
  it('unfolds folded lines', () => {
    expect(get(parseVcard('BEGIN:VCARD\nNOTE:abc\n def\nEND:VCARD'), 'Note')).toBe('abcdef');
  });
  it('rejects non-vcard', () => expect(parseVcard('hi')).toBeNull());
});

describe('parseMecard', () => {
  it('parses MECARD', () => {
    const p = parseMecard(String.raw`MECARD:N:Silva,Ana;TEL:12345;EMAIL:a@b.co;NOTE:a\;b;;`);
    expect(get(p, 'Name')).toBe('Ana Silva');
    expect(get(p, 'Phone')).toBe('12345');
    expect(get(p, 'Note')).toBe('a;b');
  });
  it('rejects other text', () => expect(parseMecard('x')).toBeNull());
});

describe('parseMailto', () => {
  it('parses recipient and params', () => {
    const p = parseMailto('mailto:a@b.com?subject=Hi%20there&body=Line%201');
    expect(get(p, 'To')).toBe('a@b.com');
    expect(get(p, 'Subject')).toBe('Hi there');
    expect(get(p, 'Message')).toBe('Line 1');
  });
  it('works without params', () => expect(get(parseMailto('mailto:a@b.com'), 'To')).toBe('a@b.com'));
});

describe('parseSms', () => {
  it('parses smsto with message containing colons', () => {
    const p = parseSms('smsto:+5511999:hello: world');
    expect(get(p, 'To')).toBe('+5511999');
    expect(get(p, 'Message')).toBe('hello: world');
  });
  it('parses sms with body param', () => {
    expect(get(parseSms('sms:123?body=yo'), 'Message')).toBe('yo');
  });
  it('number only', () => expect(get(parseSms('sms:123'), 'To')).toBe('123'));
});

describe('parseTel', () => {
  it('parses a number', () => {
    const p = parseTel('tel:+55 11 9999');
    expect(get(p, 'Number')).toBe('+55 11 9999');
    expect(p?.fields[0].href).toBe('tel:+5511 9999'.replace(' ', ''));
  });
});

describe('parseGeo', () => {
  it('parses lat/lon/alt', () => {
    const p = parseGeo('geo:-23.55,-46.63,760?q=x');
    expect(get(p, 'Latitude')).toBe('-23.55');
    expect(get(p, 'Altitude')).toBe('760 m');
  });
  it('rejects out of range', () => expect(parseGeo('geo:91,0')).toBeNull());
});

describe('parseOtpauth', () => {
  it('parses issuer, account and masks the secret', () => {
    const p = parseOtpauth('otpauth://totp/Example:alice%40x.com?secret=JBSWY3DPEHPK3PXP&issuer=Example&period=30&digits=6');
    expect(get(p, 'Issuer')).toBe('Example');
    expect(get(p, 'Account')).toBe('alice@x.com');
    expect(get(p, 'Secret')).toBe('JBSWY3DPEHPK3PXP');
    expect(p?.fields.find((f) => f.label === 'Secret')?.secret).toBe(true);
    expect(get(p, 'Period (s)')).toBe('30');
  });
  it('takes issuer from the label when absent in params', () => {
    expect(get(parseOtpauth('otpauth://hotp/Acme:bob?secret=AA&counter=1'), 'Issuer')).toBe('Acme');
  });
});

describe('urls', () => {
  it('accepts http(s) only', () => {
    expect(safeHttp('https://example.com/a?b=1')).toBe('https://example.com/a?b=1');
    expect(safeHttp('javascript:alert(1)')).toBeUndefined();
    expect(safeHttp('https://exa mple.com')).toBeUndefined();
    expect(parseUrl('ftp://x.com')).toBeNull();
  });
});

describe('parseContent', () => {
  it.each([
    ['WIFI:S:a;;', 'wifi'],
    ['otpauth://totp/a?secret=A', 'otpauth'],
    ['BEGIN:VCARD\nFN:A\nEND:VCARD', 'vcard'],
    ['MECARD:N:A;;', 'mecard'],
    ['mailto:a@b.c', 'email'],
    ['smsto:1:hi', 'sms'],
    ['tel:123', 'tel'],
    ['geo:1,2', 'geo'],
    ['https://example.com', 'url'],
    ['just some text', 'text'],
    ['javascript:alert(1)', 'text'],
    ['', 'text'],
  ])('%s -> %s', (input, kind) => expect(parseContent(input).kind).toBe(kind));
});
