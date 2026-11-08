/** Texts encoded in the image fixtures (e2e/.fixtures/<name>.png). */
export const CODES = {
  url: 'https://example.com/e2e?from=image',
  wifi: 'WIFI:T:WPA;S:E2E Network;P:hunter2-secret;;',
  totp: 'otpauth://totp/ACME:jane@example.com?secret=JBSWY3DPEHPK3PXP&issuer=ACME&algorithm=SHA1&digits=6&period=30',
  text: 'Plain text pasted from a screenshot',
} as const;

export const TOTP_SECRET = 'JBSWY3DPEHPK3PXP';
export const WIFI_PASSWORD = 'hunter2-secret';
