// iCalendar (RFC 5545) VEVENT payload for calendar QR codes.

export interface EventInput {
  title: string;
  /** `YYYY-MM-DDTHH:mm[:ss]` or `YYYY-MM-DD`. Timed values are floating local time (the scanner's own time zone). */
  start: string;
  end: string;
  allDay: boolean;
  location: string;
  description: string;
}

/** TEXT value escaping (RFC 5545 §3.3.11): backslash, semicolon, comma and line breaks. */
export function escapeIcalText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r\n|\r|\n/g, '\\n');
}

const encoder = new TextEncoder();

/**
 * Folds a content line at 75 octets (RFC 5545 §3.1): continuation lines start with one space.
 * Splits between code points, never inside a UTF-8 sequence.
 */
export function foldIcalLine(line: string): string {
  if (encoder.encode(line).length <= 75) return line;
  const parts: string[] = [];
  let current = '';
  let bytes = 0;
  let limit = 75;
  for (const ch of line) {
    const size = encoder.encode(ch).length;
    if (bytes + size > limit) {
      parts.push(current);
      current = '';
      bytes = 0;
      limit = 74; // the leading space counts toward the 75 octets
    }
    current += ch;
    bytes += size;
  }
  parts.push(current);
  return parts.join('\r\n ');
}

const DATE = /^(\d{4})-(\d{2})-(\d{2})/;
const TIME = /[T ](\d{2}):(\d{2})(?::(\d{2}))?/;

/** `2026-11-08` -> `20261108`; null when not a date. */
export function icalDate(value: string): string | null {
  const m = DATE.exec(value);
  return m ? `${m[1]}${m[2]}${m[3]}` : null;
}

/** `2026-11-08T14:30` -> `20261108T143000` (floating); a date alone becomes midnight. */
export function icalDateTime(value: string): string | null {
  const date = icalDate(value);
  if (!date) return null;
  const t = TIME.exec(value);
  return `${date}T${t ? `${t[1]}${t[2]}${t[3] ?? '00'}` : '000000'}`;
}

/** Day after a `YYYY-MM-DD` date, as an iCalendar date (all-day DTEND is exclusive). */
export function nextDay(value: string): string | null {
  const m = DATE.exec(value);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + 1));
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
}

export function buildEvent(e: EventInput): string {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Qrcode//qrcode.hfps.dev//EN', 'BEGIN:VEVENT'];
  lines.push(`SUMMARY:${escapeIcalText(e.title.trim() || 'Event')}`);
  if (e.allDay) {
    const start = icalDate(e.start);
    if (start) {
      lines.push(`DTSTART;VALUE=DATE:${start}`);
      const endBase = icalDate(e.end) && e.end.slice(0, 10) >= e.start.slice(0, 10) ? e.end : e.start;
      lines.push(`DTEND;VALUE=DATE:${nextDay(endBase)}`);
    }
  } else {
    const start = icalDateTime(e.start);
    if (start) {
      lines.push(`DTSTART:${start}`);
      const end = icalDateTime(e.end);
      if (end && end >= start) lines.push(`DTEND:${end}`);
    }
  }
  const location = e.location.trim();
  const description = e.description.trim();
  if (location) lines.push(`LOCATION:${escapeIcalText(location)}`);
  if (description) lines.push(`DESCRIPTION:${escapeIcalText(description)}`);
  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.map(foldIcalLine).join('\r\n');
}
