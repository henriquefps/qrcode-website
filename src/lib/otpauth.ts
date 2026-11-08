// Building otpauth:// URIs (Key Uri Format used by authenticator apps) and new Base32 secrets.
// Computing codes and parsing URIs lives in ./otp (used by Read).
import type { OtpAlgorithm } from './otp';

export type { OtpAlgorithm };
export const OTP_ALGORITHMS: readonly OtpAlgorithm[] = ['SHA1', 'SHA256', 'SHA512'];
export const OTP_DIGITS = [6, 8] as const;
export const OTP_DEFAULTS = { digits: 6, period: 30, algorithm: 'SHA1' as OtpAlgorithm };

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/** RFC 4648 Base32 without padding (authenticator apps ignore or reject `=`). */
export function base32Encode(bytes: Uint8Array): string {
  let out = '';
  let buffer = 0;
  let bits = 0;
  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(buffer >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHABET[(buffer << (5 - bits)) & 31];
  return out;
}

/** Uppercases and drops spaces, dashes and `=` padding, as people paste secrets in groups. */
export function normalizeSecret(raw: string): string {
  return raw.replace(/[\s=-]/g, '').toUpperCase();
}

export function isValidBase32(secret: string): boolean {
  return /^[A-Z2-7]+$/.test(normalizeSecret(secret));
}

/** A new random secret: 20 bytes (160 bits, the RFC 4226 recommendation) from the platform CSPRNG. */
export function randomSecret(getRandomValues: (a: Uint8Array<ArrayBuffer>) => Uint8Array = (a) => crypto.getRandomValues(a)): string {
  return base32Encode(getRandomValues(new Uint8Array(20)));
}

export interface OtpInput {
  issuer: string;
  account: string;
  secret: string;
  digits: number;
  period: number;
  algorithm: OtpAlgorithm;
}

/**
 * `otpauth://totp/Issuer:account?secret=...&issuer=Issuer`. Default parameters (SHA1, 6 digits, 30 s)
 * are left out: some apps ignore them anyway and the code stays smaller.
 */
export function buildOtpAuth(o: OtpInput): string {
  const issuer = o.issuer.trim();
  const account = o.account.trim() || 'account';
  const secret = isValidBase32(o.secret) ? normalizeSecret(o.secret) : 'JBSWY3DPEHPK3PXP';
  const label = issuer ? `${encodeURIComponent(issuer)}:${encodeURIComponent(account)}` : encodeURIComponent(account);
  const params = [`secret=${secret}`];
  if (issuer) params.push(`issuer=${encodeURIComponent(issuer)}`);
  if (o.algorithm !== OTP_DEFAULTS.algorithm) params.push(`algorithm=${o.algorithm}`);
  if (Number.isInteger(o.digits) && o.digits !== OTP_DEFAULTS.digits) params.push(`digits=${o.digits}`);
  if (Number.isInteger(o.period) && o.period > 0 && o.period !== OTP_DEFAULTS.period) params.push(`period=${o.period}`);
  return `otpauth://totp/${label}?${params.join('&')}`;
}
