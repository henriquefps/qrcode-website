/** Byte-mode capacity of QR versions 1-40 at error correction L and M (ISO/IEC 18004, table 7). */
const CAPACITY = {
  L: [17, 32, 53, 78, 106, 134, 154, 192, 230, 271, 321, 367, 425, 458, 520, 586, 644, 718, 792, 858, 929, 1003, 1091, 1171, 1273, 1367, 1465, 1528, 1628, 1732, 1840, 1952, 2068, 2188, 2303, 2431, 2563, 2699, 2809, 2953],
  M: [14, 26, 42, 62, 84, 106, 122, 152, 180, 213, 251, 287, 331, 362, 412, 450, 504, 560, 624, 666, 711, 779, 857, 911, 997, 1059, 1125, 1190, 1264, 1370, 1452, 1538, 1628, 1722, 1809, 1911, 1989, 2099, 2213, 2331],
} as const;

export type QuickShowLevel = keyof typeof CAPACITY;

/**
 * Above this version at level M (57x57 modules, about 213 bytes) a code gets hard to read from across a desk,
 * so Quick show drops to level L (fewer modules for the same text) and warns.
 */
export const DENSE_VERSION = 10;

export interface Density {
  bytes: number;
  /** Error correction used for the code. */
  level: QuickShowLevel;
  /** QR version (1-40) the text needs at `level`; 0 for empty or too long text. */
  version: number;
  /** Modules per side (without quiet zone); 0 when there is no code. */
  modules: number;
  /** Long text: the code is dense, level L was chosen. */
  dense: boolean;
  /** Does not fit in any QR code. */
  tooLong: boolean;
}

/** Smallest version that holds `bytes` at `level`, or 0 when none does. */
export function versionFor(bytes: number, level: QuickShowLevel): number {
  const index = CAPACITY[level].findIndex((max) => bytes <= max);
  return index + 1;
}

/** Picks error correction for Quick show: M for normal text, L (and a warning) for long text. */
export function densityFor(text: string): Density {
  const bytes = new TextEncoder().encode(text).length;
  if (bytes === 0) return { bytes, level: 'M', version: 0, modules: 0, dense: false, tooLong: false };
  const atM = versionFor(bytes, 'M');
  if (atM > 0 && atM <= DENSE_VERSION) return { bytes, level: 'M', version: atM, modules: 17 + 4 * atM, dense: false, tooLong: false };
  const atL = versionFor(bytes, 'L');
  if (atL === 0) return { bytes, level: 'L', version: 0, modules: 0, dense: true, tooLong: true };
  return { bytes, level: 'L', version: atL, modules: 17 + 4 * atL, dense: true, tooLong: false };
}
