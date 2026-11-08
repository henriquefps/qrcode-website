import { describe, expect, it } from 'vitest';
import { base32Decode, parseOtpParams } from './otp';
import { base32Encode, buildOtpAuth, isValidBase32, normalizeSecret, randomSecret } from './otpauth';

const enc = (s: string) => new TextEncoder().encode(s);
const base = { issuer: '', account: '', secret: '', digits: 6, period: 30, algorithm: 'SHA1' as const };

describe('base32Encode', () => {
  it('matches the RFC 4648 vectors (without padding)', () => {
    expect(base32Encode(enc(''))).toBe('');
    expect(base32Encode(enc('f'))).toBe('MY');
    expect(base32Encode(enc('fo'))).toBe('MZXQ');
    expect(base32Encode(enc('foo'))).toBe('MZXW6');
    expect(base32Encode(enc('foob'))).toBe('MZXW6YQ');
    expect(base32Encode(enc('fooba'))).toBe('MZXW6YTB');
    expect(base32Encode(enc('foobar'))).toBe('MZXW6YTBOI');
  });
});

describe('secrets', () => {
  it('normalizes grouped, lowercase and padded input', () => {
    expect(normalizeSecret('jbsw y3dp-ehpk 3pxp==')).toBe('JBSWY3DPEHPK3PXP');
    expect(isValidBase32('jbsw y3dp')).toBe(true);
    expect(isValidBase32('JBSW1890')).toBe(false);
  });
  it('generates 32-character secrets from the given random source', () => {
    const s = randomSecret((a) => a.fill(0xff));
    expect(s).toBe('7'.repeat(32));
    expect(randomSecret()).toMatch(/^[A-Z2-7]{32}$/);
    expect(randomSecret()).not.toBe(randomSecret());
  });
});

describe('buildOtpAuth', () => {
  it('builds a minimal URI and omits defaults', () => {
    expect(buildOtpAuth({ ...base, issuer: 'ACME Co', account: 'jane@acme.io', secret: 'jbsw y3dp ehpk 3pxp' })).toBe(
      'otpauth://totp/ACME%20Co:jane%40acme.io?secret=JBSWY3DPEHPK3PXP&issuer=ACME%20Co',
    );
  });
  it('adds non-default parameters', () => {
    expect(buildOtpAuth({ ...base, account: 'a', secret: 'JBSWY3DPEHPK3PXP', digits: 8, period: 60, algorithm: 'SHA256' })).toBe(
      'otpauth://totp/a?secret=JBSWY3DPEHPK3PXP&algorithm=SHA256&digits=8&period=60',
    );
  });
  it('encodes reserved characters in the label and issuer', () => {
    const uri = buildOtpAuth({ ...base, issuer: 'A&B', account: 'x y/z?', secret: 'JBSWY3DPEHPK3PXP' });
    expect(uri).toBe('otpauth://totp/A%26B:x%20y%2Fz%3F?secret=JBSWY3DPEHPK3PXP&issuer=A%26B');
  });
  it('falls back to a sample secret when invalid', () => {
    expect(buildOtpAuth({ ...base, secret: '!!' })).toContain('secret=JBSWY3DPEHPK3PXP');
  });
});

describe('round trip with the reader', () => {
  it('parses back to the same parameters and secret', () => {
    const secret = randomSecret();
    const p = parseOtpParams(buildOtpAuth({ ...base, issuer: 'A', account: 'b', secret, digits: 8, period: 60, algorithm: 'SHA512' }));
    expect(p).toMatchObject({ type: 'totp', algorithm: 'SHA512', digits: 8, period: 60 });
    expect(p?.secret).toEqual(base32Decode(secret));
  });
});
