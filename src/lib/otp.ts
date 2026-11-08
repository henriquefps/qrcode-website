/**
 * One-time passwords computed locally (RFC 4226 HOTP, RFC 6238 TOTP) with WebCrypto HMAC.
 * Nothing is stored; the secret only lives in memory while the result is on screen.
 */

export type OtpAlgorithm = 'SHA1' | 'SHA256' | 'SHA512';

export interface OtpParams {
  type: 'totp' | 'hotp';
  secret: Uint8Array;
  algorithm: OtpAlgorithm;
  digits: number;
  /** TOTP step in seconds. */
  period: number;
  /** HOTP counter (undefined when absent). */
  counter?: number;
}

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/** Decodes RFC 4648 Base32 (case-insensitive, spaces, dashes and padding ignored). Returns null on invalid input. */
export function base32Decode(input: string): Uint8Array | null {
  const clean = input.replace(/[\s-]/g, '').replace(/=+$/, '').toUpperCase();
  if (!clean) return null;
  const out: number[] = [];
  let bits = 0;
  let value = 0;
  for (const c of clean) {
    const idx = BASE32.indexOf(c);
    if (idx < 0) return null;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      out.push((value >>> bits) & 0xff);
    }
  }
  return new Uint8Array(out);
}

const HASH: Record<OtpAlgorithm, string> = { SHA1: 'SHA-1', SHA256: 'SHA-256', SHA512: 'SHA-512' };

/** RFC 4226 HOTP value for `counter`, zero-padded to `digits`. */
export async function hotp(secret: Uint8Array, counter: number, algorithm: OtpAlgorithm = 'SHA1', digits = 6): Promise<string> {
  const msg = new Uint8Array(8);
  let c = counter;
  for (let i = 7; i >= 0; i--) {
    msg[i] = c & 0xff;
    c = Math.floor(c / 256);
  }
  const key = await crypto.subtle.importKey('raw', secret as BufferSource, { name: 'HMAC', hash: HASH[algorithm] }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, msg));
  const offset = mac[mac.length - 1] & 0x0f;
  const bin = ((mac[offset] & 0x7f) << 24) | (mac[offset + 1] << 16) | (mac[offset + 2] << 8) | mac[offset + 3];
  return String(bin % 10 ** digits).padStart(digits, '0');
}

/** RFC 6238 time step for a Unix time in milliseconds. */
export function totpCounter(nowMs: number, period = 30): number {
  return Math.floor(nowMs / 1000 / period);
}

/** Seconds left in the current step (1..period). */
export function totpRemaining(nowMs: number, period = 30): number {
  return period - (Math.floor(nowMs / 1000) % period);
}

export function totp(secret: Uint8Array, nowMs: number, algorithm: OtpAlgorithm = 'SHA1', digits = 6, period = 30): Promise<string> {
  return hotp(secret, totpCounter(nowMs, period), algorithm, digits);
}

/** Reads the parameters of an `otpauth://` URI. Returns null when it is not one or the secret is not valid Base32. */
export function parseOtpParams(text: string): OtpParams | null {
  const m = /^otpauth:\/\/(totp|hotp)\/[^?]*(?:\?(.*))?$/i.exec(text.trim());
  if (!m) return null;
  const params = new URLSearchParams(m[2] ?? '');
  const secret = base32Decode(params.get('secret') ?? '');
  if (!secret || secret.length === 0) return null;
  const alg = (params.get('algorithm') ?? 'SHA1').toUpperCase().replace('-', '');
  if (alg !== 'SHA1' && alg !== 'SHA256' && alg !== 'SHA512') return null;
  const digits = Number(params.get('digits') ?? 6);
  const period = Number(params.get('period') ?? 30);
  const counterRaw = params.get('counter');
  const counter = counterRaw === null ? undefined : Number(counterRaw);
  if (!Number.isInteger(digits) || digits < 6 || digits > 10) return null;
  if (!Number.isInteger(period) || period < 1 || period > 3600) return null;
  if (counter !== undefined && (!Number.isSafeInteger(counter) || counter < 0)) return null;
  return { type: m[1].toLowerCase() as 'totp' | 'hotp', secret, algorithm: alg, digits, period, counter };
}

/** Groups a code for reading: 123456 → "123 456", 12345678 → "1234 5678". */
export function formatOtp(code: string): string {
  if (code.length === 6 || code.length === 9) return code.replace(/(\d{3})(?=\d)/g, '$1 ');
  if (code.length === 8 || code.length === 10) return code.length === 8 ? `${code.slice(0, 4)} ${code.slice(4)}` : `${code.slice(0, 5)} ${code.slice(5)}`;
  return code;
}
