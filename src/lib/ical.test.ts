import { describe, expect, it } from 'vitest';
import { buildEvent, escapeIcalText, foldIcalLine, icalDateTime, nextDay } from './ical';

const base = { title: '', start: '', end: '', allDay: false, location: '', description: '' };
const unfold = (s: string) => s.replace(/\r\n /g, '');

describe('escapeIcalText', () => {
  it('escapes backslash, semicolon, comma and line breaks', () => {
    expect(escapeIcalText('a\\b;c,d\ne\r\nf')).toBe(String.raw`a\\b\;c\,d\ne\nf`);
  });
});

describe('foldIcalLine', () => {
  it('leaves short lines alone', () => {
    expect(foldIcalLine('SUMMARY:Hi')).toBe('SUMMARY:Hi');
  });
  it('folds at 75 octets with a leading space', () => {
    const line = `DESCRIPTION:${'x'.repeat(200)}`;
    const folded = foldIcalLine(line);
    const parts = folded.split('\r\n');
    expect(parts[0]).toHaveLength(75);
    for (const p of parts.slice(1)) {
      expect(p.startsWith(' ')).toBe(true);
      expect(new TextEncoder().encode(p).length).toBeLessThanOrEqual(75);
    }
    expect(unfold(folded)).toBe(line);
  });
  it('never splits a multi-byte character', () => {
    const line = `SUMMARY:${'é😀'.repeat(40)}`;
    const folded = foldIcalLine(line);
    for (const p of folded.split('\r\n')) expect(new TextEncoder().encode(p).length).toBeLessThanOrEqual(75);
    expect(unfold(folded)).toBe(line);
    expect(folded).not.toContain('�');
  });
});

describe('dates', () => {
  it('formats floating date-times', () => {
    expect(icalDateTime('2026-11-08T14:30')).toBe('20261108T143000');
    expect(icalDateTime('2026-11-08')).toBe('20261108T000000');
    expect(icalDateTime('2026-11-08 09:05')).toBe('20261108T090500');
    expect(icalDateTime('nope')).toBeNull();
  });
  it('rolls over months and leap years', () => {
    expect(nextDay('2026-12-31')).toBe('20270101');
    expect(nextDay('2028-02-28')).toBe('20280229');
  });
});

describe('buildEvent', () => {
  it('builds a timed event with CRLF and escaping', () => {
    const out = buildEvent({ ...base, title: 'Launch; v2, final', start: '2026-11-08T14:30', end: '2026-11-08T16:00', location: 'Room 1', description: 'Line 1\nLine 2' });
    expect(out.split('\r\n')).toEqual([
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Qrcode//qrcode.hfps.dev//EN',
      'BEGIN:VEVENT',
      String.raw`SUMMARY:Launch\; v2\, final`,
      'DTSTART:20261108T143000',
      'DTEND:20261108T160000',
      'LOCATION:Room 1',
      String.raw`DESCRIPTION:Line 1\nLine 2`,
      'END:VEVENT',
      'END:VCALENDAR',
    ]);
  });
  it('uses exclusive DATE end for all-day events', () => {
    const out = buildEvent({ ...base, title: 'Trip', start: '2026-11-08', end: '2026-11-10', allDay: true });
    expect(out).toContain('DTSTART;VALUE=DATE:20261108');
    expect(out).toContain('DTEND;VALUE=DATE:20261111');
  });
  it('defaults a missing all-day end to one day', () => {
    expect(buildEvent({ ...base, start: '2026-11-08', allDay: true })).toContain('DTEND;VALUE=DATE:20261109');
  });
  it('drops an end before the start', () => {
    expect(buildEvent({ ...base, start: '2026-11-08T14:00', end: '2026-11-08T13:00' })).not.toContain('DTEND');
  });
  it('folds long descriptions', () => {
    const out = buildEvent({ ...base, description: 'word '.repeat(40) });
    expect(out).toMatch(/\r\n /);
    for (const line of out.split('\r\n')) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
  });
});
