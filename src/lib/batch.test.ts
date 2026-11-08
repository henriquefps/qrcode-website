import { describe, expect, it } from 'vitest';
import { autoMap, detectDelimiter, looksLikeHeader, MAX_BATCH_ROWS, parseCsv, parseLines, planBatch, rowToValues, sanitizeFileName } from './batch';
import { EMPTY_FORM } from './qrData';

describe('parseCsv', () => {
  it('handles quotes, escaped quotes, embedded newlines and CRLF', () => {
    expect(parseCsv('a,"b,c","d ""q"""\r\n"multi\nline",2,3\n')).toEqual([
      ['a', 'b,c', 'd "q"'],
      ['multi\nline', '2', '3'],
    ]);
  });
  it('drops blank lines and a BOM', () => {
    expect(parseCsv('\uFEFFx\n\n\ny\n')).toEqual([['x'], ['y']]);
  });
  it('detects semicolons and tabs', () => {
    expect(detectDelimiter('a;b;c\n1;2;3')).toBe(';');
    expect(detectDelimiter('a\tb\n')).toBe('\t');
    expect(detectDelimiter('"x;y",b')).toBe(',');
    expect(parseCsv('a;b\n1;2')).toEqual([['a', 'b'], ['1', '2']]);
  });
  it('stops one row past the cap', () => {
    const text = Array.from({ length: MAX_BATCH_ROWS + 50 }, (_, i) => `r${i}`).join('\n');
    expect(parseCsv(text)).toHaveLength(MAX_BATCH_ROWS + 1);
  });
});

describe('parseLines', () => {
  it('keeps commas inside values', () => {
    expect(parseLines('https://a.io/x,y\r\n\nhello, world')).toEqual([['https://a.io/x,y'], ['hello, world']]);
  });
});

describe('mapping', () => {
  it('maps headers by key, label and alias', () => {
    expect(autoMap('wifi', ['Name', 'SSID', 'Password', 'hidden'])).toEqual({ wifiSsid: 1, wifiPass: 2, wifiHidden: 3 });
    expect(autoMap('vcard', ['first_name', 'Last Name', 'email'])).toEqual({ vcardFirst: 0, vcardLast: 1, vcardEmail: 2 });
  });
  it('puts the primary field on column 0 without a header', () => {
    expect(autoMap('url', null)).toEqual({ url: 0 });
    expect(autoMap('geo', ['foo', 'bar'])).toEqual({ geoLat: 0 });
  });
  it('detects header rows', () => {
    expect(looksLikeHeader('url', ['url', 'name'])).toBe(true);
    expect(looksLikeHeader('url', ['https://a.io', 'A'])).toBe(false);
  });
  it('fills form values over the base and parses booleans', () => {
    const v = rowToValues('wifi', ['Cafe', 'pw', 'yes'], { wifiSsid: 0, wifiPass: 1, wifiHidden: 2 }, { ...EMPTY_FORM, wifiType: 'WEP' });
    expect(v).toMatchObject({ wifiSsid: 'Cafe', wifiPass: 'pw', wifiHidden: true, wifiType: 'WEP' });
  });
});

describe('sanitizeFileName', () => {
  it('removes separators, reserved and control characters', () => {
    expect(sanitizeFileName('../etc/pass:wd?\u0001')).toBe('-etc-pass-wd-');
    expect(sanitizeFileName('  Table 4.  ')).toBe('Table 4');
    expect(sanitizeFileName('a'.repeat(200))).toHaveLength(80);
  });
});

describe('planBatch', () => {
  it('builds payloads, skips empty and invalid rows, and dedupes names', () => {
    const rows = [
      ['https://a.io', 'Shop'],
      ['', 'Empty'],
      ['b.io', 'shop'],
      ['c.io', 'Shop-2'],
      ['d.io', ''],
    ];
    const plan = planBatch('url', rows, { url: 0 }, 1, EMPTY_FORM);
    expect(plan.empty).toBe(1);
    expect(plan.items.map((i) => [i.name, i.data])).toEqual([
      ['Shop', 'https://a.io'],
      ['shop-2', 'https://b.io'],
      ['Shop-2-2', 'https://c.io'],
      ['qrcode-5', 'https://d.io'],
    ]);
  });
  it('reports invalid rows', () => {
    const plan = planBatch('geo', [['91', '0'], ['38.7', '-9.1']], { geoLat: 0, geoLng: 1 }, -1, EMPTY_FORM);
    expect(plan.invalid).toEqual([{ row: 1, message: expect.stringContaining('Latitude') }]);
    expect(plan.items[0]).toEqual({ row: 2, name: 'qrcode-2', data: 'geo:38.7,-9.1' });
  });
  it('pads index names and flags truncation', () => {
    const rows = Array.from({ length: MAX_BATCH_ROWS + 1 }, (_, i) => [`t${i}`]);
    const plan = planBatch('text', rows, { text: 0 }, -1, EMPTY_FORM);
    expect(plan.truncated).toBe(true);
    expect(plan.items).toHaveLength(MAX_BATCH_ROWS);
    expect(plan.items[0].name).toBe('qrcode-0001');
  });
});
