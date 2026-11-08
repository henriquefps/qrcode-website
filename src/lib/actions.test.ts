import { describe, expect, it } from 'vitest';
import { actionsFor } from './actions';
import { parseContent } from './parse';

const actions = (text: string) => actionsFor(text, parseContent(text));

describe('actionsFor', () => {
  it('url -> external open link', () => {
    expect(actions('https://example.com/a')).toEqual([{ kind: 'link', id: 'open', label: 'Open link', href: 'https://example.com/a', icon: 'open', external: true }]);
  });
  it('tel -> call', () => {
    expect(actions('tel:+55 (11) 9999-0000')).toMatchObject([{ id: 'call', href: 'tel:+551199990000' }]);
  });
  it('geo -> geo: link and OpenStreetMap', () => {
    const a = actions('geo:-23.55,-46.63,760');
    expect(a).toMatchObject([
      { id: 'maps', href: 'geo:-23.55,-46.63' },
      { id: 'osm', href: 'https://www.openstreetmap.org/?mlat=-23.55&mlon=-46.63#map=16/-23.55/-46.63', external: true },
    ]);
  });
  it('mailto -> compose with encoded params', () => {
    expect(actions('mailto:a@b.c?subject=Hi%20there&body=x%26y')).toMatchObject([{ id: 'compose', href: 'mailto:a@b.c?subject=Hi%20there&body=x%26y' }]);
  });
  it('sms -> send sms', () => {
    expect(actions('smsto:+1 555:hello you')).toMatchObject([{ id: 'sms', href: 'sms:+1555?body=hello%20you' }]);
    expect(actions('sms:123')).toMatchObject([{ href: 'sms:123' }]);
  });
  it('vcard and mecard -> save contact', () => {
    expect(actions('BEGIN:VCARD\nFN:A\nEND:VCARD')).toMatchObject([{ kind: 'download', id: 'save', filename: 'A.vcf', mime: 'text/vcard' }]);
    expect(actions('MECARD:N:B,A;;')).toMatchObject([{ kind: 'download', filename: 'A-B.vcf' }]);
  });
  it('wifi -> copy password (secret) only when there is one', () => {
    expect(actions('WIFI:T:WPA;S:home;P:pa\\;ss;;')).toEqual([{ kind: 'copy', id: 'password', label: 'Copy password', value: 'pa;ss', secret: true, icon: 'password' }]);
    expect(actions('WIFI:T:nopass;S:open;;')).toEqual([]);
  });
  it('plain text and unsafe links -> nothing', () => {
    expect(actions('hello')).toEqual([]);
    expect(actions('javascript:alert(1)')).toEqual([]);
  });
});
