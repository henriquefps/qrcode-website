import { describe, expect, it } from 'vitest';
import { buildEmail, buildGeo, buildPhone, buildSms, buildUrl, buildVcard, buildWhatsapp, buildWifi, EMPTY_FORM, escapeVcard, escapeWifi, getQRDataString, parseCoordinate, validateForm, whatsappDigits } from './qrData';

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

describe('new content types', () => {
  it('builds tel: with dialer characters only', () => {
    expect(buildPhone(' +351 (912) 345-678 ')).toBe('tel:+351912345678');
    expect(buildPhone('555 1234,,22#')).toBe('tel:5551234,,22#');
    expect(buildPhone('')).toBe('tel:+1234567890');
  });
  it('builds wa.me links with digits and an encoded message', () => {
    expect(buildWhatsapp('+351 912 345 678', 'Olá & bem-vindo?')).toBe('https://wa.me/351912345678?text=Ol%C3%A1%20%26%20bem-vindo%3F');
    expect(buildWhatsapp('0044 20 7946 0958', '')).toBe('https://wa.me/442079460958');
    expect(whatsappDigits('(00) 1-2')).toBe('12');
  });
  it('builds geo: with validation and an optional query', () => {
    expect(buildGeo('38.7223', '-9.1393', '')).toBe('geo:38.7223,-9.1393');
    expect(buildGeo('38,7223', '-9,1393', 'Praça do Comércio')).toBe('geo:38.7223,-9.1393?q=Pra%C3%A7a%20do%20Com%C3%A9rcio');
    expect(buildGeo('', '', 'Eiffel Tower')).toBe('geo:0,0?q=Eiffel%20Tower');
    expect(parseCoordinate('90.5', 'lat')).toBeNull();
    expect(parseCoordinate('-180', 'lng')).toBe(-180);
    expect(parseCoordinate('1e3', 'lat')).toBeNull();
  });
  it('dispatches event and otp', () => {
    expect(getQRDataString('event', { ...EMPTY_FORM, eventTitle: 'Party', eventStart: '2026-12-31T22:00' })).toContain('DTSTART:20261231T220000');
    expect(getQRDataString('otp', { ...EMPTY_FORM, otpAccount: 'me', otpSecret: 'JBSWY3DPEHPK3PXP' })).toBe('otpauth://totp/me?secret=JBSWY3DPEHPK3PXP');
  });
});

describe('validateForm', () => {
  it('flags bad coordinates and a missing pair', () => {
    expect(validateForm('geo', { ...EMPTY_FORM, geoLat: '100', geoLng: '0' })).toHaveProperty('geoLat');
    expect(validateForm('geo', { ...EMPTY_FORM, geoLat: '10' })).toHaveProperty('geoLng');
    expect(validateForm('geo', { ...EMPTY_FORM, geoLat: '10', geoLng: '20' })).toEqual({});
  });
  it('flags OTP secrets that are not Base32 or too short', () => {
    expect(validateForm('otp', { ...EMPTY_FORM, otpSecret: 'abc1' }).otpSecret).toMatch(/Base32/);
    expect(validateForm('otp', { ...EMPTY_FORM, otpSecret: 'JBSWY3DP' }).otpSecret).toMatch(/16/);
    expect(validateForm('otp', { ...EMPTY_FORM, otpSecret: 'jbsw y3dp ehpk 3pxp' })).toEqual({});
    expect(validateForm('otp', { ...EMPTY_FORM, otpPeriod: '0' })).toHaveProperty('otpPeriod');
    expect(validateForm('otp', { ...EMPTY_FORM, otpIssuer: 'a:b' })).toHaveProperty('otpIssuer');
  });
  it('flags short WhatsApp numbers and events that end first', () => {
    expect(validateForm('whatsapp', { ...EMPTY_FORM, waPhone: '123' })).toHaveProperty('waPhone');
    expect(validateForm('event', { ...EMPTY_FORM, eventStart: '2026-01-02T10:00', eventEnd: '2026-01-02T09:00' })).toHaveProperty('eventEnd');
    expect(validateForm('event', { ...EMPTY_FORM, eventAllDay: true, eventStart: '2026-01-02', eventEnd: '2026-01-02' })).toEqual({});
  });
});
