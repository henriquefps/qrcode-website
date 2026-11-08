import { describe, expect, it } from 'vitest';
import { base32Decode, formatOtp, hotp, parseOtpParams, totp, totpCounter, totpRemaining } from './otp';

const ascii = (s: string) => new TextEncoder().encode(s);
const SEED1 = ascii('12345678901234567890');
const SEED256 = ascii('12345678901234567890123456789012');
const SEED512 = ascii('1234567890123456789012345678901234567890123456789012345678901234');

describe('base32Decode', () => {
  it('decodes RFC 4648 vectors', () => {
    expect(new TextDecoder().decode(base32Decode('MZXW6YTBOI======')!)).toBe('foobar');
    expect(new TextDecoder().decode(base32Decode('mzxw 6ytb oi')!)).toBe('foobar');
    expect(new TextDecoder().decode(base32Decode('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ')!)).toBe('12345678901234567890');
  });
  it('rejects invalid characters and empty input', () => {
    expect(base32Decode('ABC1')).toBeNull();
    expect(base32Decode('')).toBeNull();
  });
});

describe('hotp (RFC 4226 appendix D)', () => {
  const expected = ['755224', '287082', '359152', '969429', '338314', '254676', '287922', '162583', '399871', '520489'];
  it.each(expected.map((code, i) => [i, code]))('counter %i -> %s', async (counter, code) => {
    expect(await hotp(SEED1, counter as number)).toBe(code);
  });
});

describe('totp (RFC 6238 appendix B)', () => {
  const vectors: [number, string, string, string][] = [
    [59, '94287082', '46119246', '90693936'],
    [1111111109, '07081804', '68084774', '25091201'],
    [1111111111, '14050471', '67062674', '99943326'],
    [1234567890, '89005924', '91819424', '93441116'],
    [2000000000, '69279037', '90698825', '38618901'],
    [20000000000, '65353130', '77737706', '47863826'],
  ];
  it.each(vectors)('t=%i', async (t, sha1, sha256, sha512) => {
    expect(await totp(SEED1, t * 1000, 'SHA1', 8)).toBe(sha1);
    expect(await totp(SEED256, t * 1000, 'SHA256', 8)).toBe(sha256);
    expect(await totp(SEED512, t * 1000, 'SHA512', 8)).toBe(sha512);
  });
  it('computes counter and remaining seconds', () => {
    expect(totpCounter(59_000)).toBe(1);
    expect(totpRemaining(59_000)).toBe(1);
    expect(totpRemaining(60_000)).toBe(30);
    expect(totpRemaining(61_500, 60)).toBe(59);
  });
});

describe('parseOtpParams', () => {
  it('reads defaults', () => {
    const p = parseOtpParams('otpauth://totp/Example:alice?secret=JBSWY3DPEHPK3PXP&issuer=Example');
    expect(p).toMatchObject({ type: 'totp', algorithm: 'SHA1', digits: 6, period: 30, counter: undefined });
    expect(p?.secret.length).toBe(10);
  });
  it('reads algorithm, digits, period and counter', () => {
    expect(parseOtpParams('otpauth://totp/a?secret=GEZDGNBV&algorithm=sha256&digits=8&period=60')).toMatchObject({ algorithm: 'SHA256', digits: 8, period: 60 });
    expect(parseOtpParams('otpauth://hotp/a?secret=GEZDGNBV&counter=7')).toMatchObject({ type: 'hotp', counter: 7 });
  });
  it('rejects bad input', () => {
    expect(parseOtpParams('otpauth://totp/a')).toBeNull();
    expect(parseOtpParams('otpauth://totp/a?secret=!!')).toBeNull();
    expect(parseOtpParams('otpauth://totp/a?secret=GEZDGNBV&algorithm=MD5')).toBeNull();
    expect(parseOtpParams('otpauth://totp/a?secret=GEZDGNBV&digits=3')).toBeNull();
    expect(parseOtpParams('otpauth://totp/a?secret=GEZDGNBV&period=0')).toBeNull();
    expect(parseOtpParams('https://example.com')).toBeNull();
  });
  it('end to end: URI -> code', async () => {
    const p = parseOtpParams('otpauth://totp/x?secret=GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ&digits=8')!;
    expect(await totp(p.secret, 59_000, p.algorithm, p.digits, p.period)).toBe('94287082');
  });
});

describe('formatOtp', () => {
  it('groups digits', () => {
    expect(formatOtp('123456')).toBe('123 456');
    expect(formatOtp('12345678')).toBe('1234 5678');
    expect(formatOtp('1234567')).toBe('1234567');
  });
});
