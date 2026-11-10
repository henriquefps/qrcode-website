// Style configuration of a code and its JSON preset file (export / import).
import { LEGACY_LOGO_IDS } from './logoIcons';
import { DEFAULT_ICON_COLOR, isIconId } from './iconify';

export const DOT_TYPES = ['rounded', 'dots', 'classy', 'classy-rounded', 'extra-rounded', 'square'] as const;
export const CORNER_SQUARE_TYPES = ['extra-rounded', 'rounded', 'dot', 'square'] as const;
export const CORNER_DOT_TYPES = ['rounded', 'dot', 'square'] as const;
export const EC_LEVELS = ['L', 'M', 'Q', 'H'] as const;
export const GRADIENT_TYPES = ['linear', 'radial'] as const;
export const FG_TYPES = ['single', 'gradient'] as const;
/** 'icon' is an Iconify icon (`logoIcon`), 'custom' an uploaded image. */
export const LOGO_PRESET_IDS = ['none', 'icon', 'custom'] as const;

export type DotType = (typeof DOT_TYPES)[number];
export type CornerSquareType = (typeof CORNER_SQUARE_TYPES)[number];
export type CornerDotType = (typeof CORNER_DOT_TYPES)[number];
export type EcLevel = (typeof EC_LEVELS)[number];
export type GradientType = (typeof GRADIENT_TYPES)[number];
export type FgType = (typeof FG_TYPES)[number];
export type LogoPresetId = (typeof LOGO_PRESET_IDS)[number];

export interface StyleConfig {
  dotsType: DotType;
  cornersSquareType: CornerSquareType;
  cornersDotType: CornerDotType;
  ecLevel: EcLevel;
  margin: number;
  fgType: FgType;
  dotsColor: string;
  dotsColorSecondary: string;
  gradientType: GradientType;
  gradientRotation: number;
  customCorners: boolean;
  cornersSquareColor: string;
  cornersDotColor: string;
  bgColor: string;
  bgTransparent: boolean;
  logoPreset: LogoPresetId;
  /** Iconify id ("lucide:wifi") of the logo when logoPreset is 'icon'. */
  logoIcon: string;
  logoIconColor: string;
  /** Data URI or URL of the logo image ('' = none). */
  logoFile: string;
  logoFilename: string;
  /** 0.05 to 0.45 of the code size. */
  logoScale: number;
  logoMargin: boolean;
}

export const DEFAULT_STYLE: StyleConfig = {
  dotsType: 'rounded',
  cornersSquareType: 'extra-rounded',
  cornersDotType: 'rounded',
  ecLevel: 'H',
  margin: 15,
  fgType: 'single',
  dotsColor: '#172e37',
  dotsColorSecondary: '#505f76',
  gradientType: 'linear',
  gradientRotation: 45,
  customCorners: false,
  cornersSquareColor: '#172e37',
  cornersDotColor: '#505f76',
  bgColor: '#ffffff',
  bgTransparent: false,
  logoPreset: 'none',
  logoIcon: '',
  logoIconColor: DEFAULT_ICON_COLOR,
  logoFile: '',
  logoFilename: '',
  logoScale: 0.2,
  logoMargin: true,
};

/** Shape of the preset JSON file (same keys as the QRGo files, so old presets still import). */
export interface StylePreset {
  dotStyle: DotType;
  ecLevel: EcLevel;
  cornerOuter: CornerSquareType;
  cornerInner: CornerDotType;
  margin: number;
  fgType: FgType;
  primaryColor: string;
  secondaryColor: string;
  gradientType: GradientType;
  gradientRotation: number;
  hasCustomCorners: boolean;
  cornerOuterColor: string;
  cornerInnerColor: string;
  isTransparent: boolean;
  bgColor: string;
  activePreset: LogoPresetId;
  /** Iconify id when activePreset is "icon" (older files use wifi, web, whatsapp, email, github or instagram as activePreset). */
  logoIcon?: string | null;
  logoIconColor?: string;
  /** The icon as a data URI, so the file imports offline. */
  iconLogoDataUrl?: string | null;
  /** Percent, 5 to 45. */
  logoScale: number;
  hasLogoBg: boolean;
  uploadedLogoDataUrl: string | null;
  uploadedLogoName: string;
}

export const MAX_PRESET_BYTES = 4 * 1024 * 1024;
const HEX = /^#[0-9a-f]{6}$/i;
const LOGO_DATA_URL = /^data:image\/(png|jpe?g|svg\+xml|gif|webp)[;,]/i;

export function toPreset(c: StyleConfig): StylePreset {
  const custom = c.logoPreset === 'custom';
  const icon = c.logoPreset === 'icon' && !!c.logoIcon;
  return {
    dotStyle: c.dotsType,
    ecLevel: c.ecLevel,
    cornerOuter: c.cornersSquareType,
    cornerInner: c.cornersDotType,
    margin: c.margin,
    fgType: c.fgType,
    primaryColor: c.dotsColor,
    secondaryColor: c.dotsColorSecondary,
    gradientType: c.gradientType,
    gradientRotation: c.gradientRotation,
    hasCustomCorners: c.customCorners,
    cornerOuterColor: c.cornersSquareColor,
    cornerInnerColor: c.cornersDotColor,
    isTransparent: c.bgTransparent,
    bgColor: c.bgColor,
    activePreset: icon ? 'icon' : custom ? 'custom' : 'none',
    logoIcon: icon ? c.logoIcon : null,
    logoIconColor: c.logoIconColor,
    iconLogoDataUrl: icon && c.logoFile ? c.logoFile : null,
    logoScale: Math.round(c.logoScale * 100),
    hasLogoBg: c.logoMargin,
    uploadedLogoDataUrl: custom ? c.logoFile : null,
    uploadedLogoName: custom ? c.logoFilename : '',
  };
}

export type PresetResult = { ok: true; style: StyleConfig } | { ok: false; error: string };

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function oneOf<T extends string>(raw: unknown, options: readonly T[], fallback: T): T {
  return typeof raw === 'string' && (options as readonly string[]).includes(raw) ? (raw as T) : fallback;
}

function color(raw: unknown, fallback: string): string {
  return typeof raw === 'string' && HEX.test(raw) ? raw.toLowerCase() : fallback;
}

function num(raw: unknown, min: number, max: number, fallback: number): number {
  return typeof raw === 'number' && Number.isFinite(raw) ? Math.min(max, Math.max(min, raw)) : fallback;
}

/**
 * Validates untrusted preset JSON. Unknown or invalid fields fall back to defaults; the file is
 * rejected only when it is not an object or carries none of the known keys.
 * An icon logo comes back with its id and, when the file embeds it, its image; otherwise `logoFile` is '' and
 * the app fetches the icon (also for the ids older files used).
 */
export function parsePreset(raw: unknown): PresetResult {
  if (!isObject(raw)) return { ok: false, error: 'The file is not a style preset.' };
  const known = ['dotStyle', 'ecLevel', 'cornerOuter', 'cornerInner', 'margin', 'fgType', 'primaryColor', 'bgColor', 'activePreset'];
  if (!known.some((k) => k in raw)) return { ok: false, error: 'The file is not a style preset.' };

  const d = DEFAULT_STYLE;
  const fgRaw = raw.fgType === 'solid' ? 'single' : raw.fgType;
  const active = typeof raw.activePreset === 'string' ? raw.activePreset : 'none';
  let logoFile = '';
  let logoFilename = '';
  let logoPreset: LogoPresetId = 'none';
  let logoIcon = '';
  if (active === 'custom') {
    const url = raw.uploadedLogoDataUrl;
    if (typeof url === 'string' && LOGO_DATA_URL.test(url)) {
      logoPreset = 'custom';
      logoFile = url;
      logoFilename = typeof raw.uploadedLogoName === 'string' ? raw.uploadedLogoName.slice(0, 120) : 'logo';
    }
  } else if (active === 'icon' || Object.hasOwn(LEGACY_LOGO_IDS, active)) {
    const id = active === 'icon' ? raw.logoIcon : LEGACY_LOGO_IDS[active];
    if (isIconId(id)) {
      logoPreset = 'icon';
      logoIcon = id;
      logoFilename = id.replace(':', '-');
      const url = raw.iconLogoDataUrl;
      if (active === 'icon' && typeof url === 'string' && LOGO_DATA_URL.test(url)) logoFile = url;
    }
  }

  return {
    ok: true,
    style: {
      dotsType: oneOf(raw.dotStyle, DOT_TYPES, d.dotsType),
      ecLevel: oneOf(raw.ecLevel, EC_LEVELS, d.ecLevel),
      cornersSquareType: oneOf(raw.cornerOuter, CORNER_SQUARE_TYPES, d.cornersSquareType),
      cornersDotType: oneOf(raw.cornerInner, CORNER_DOT_TYPES, d.cornersDotType),
      margin: num(raw.margin, 0, 40, d.margin),
      fgType: oneOf(fgRaw, FG_TYPES, d.fgType),
      dotsColor: color(raw.primaryColor, d.dotsColor),
      dotsColorSecondary: color(raw.secondaryColor, d.dotsColorSecondary),
      gradientType: oneOf(raw.gradientType, GRADIENT_TYPES, d.gradientType),
      gradientRotation: num(raw.gradientRotation, 0, 360, d.gradientRotation),
      customCorners: raw.hasCustomCorners === true,
      cornersSquareColor: color(raw.cornerOuterColor, d.cornersSquareColor),
      cornersDotColor: color(raw.cornerInnerColor, d.cornersDotColor),
      bgColor: color(raw.bgColor, d.bgColor),
      bgTransparent: raw.isTransparent === true,
      logoPreset,
      logoIcon,
      logoIconColor: color(raw.logoIconColor, d.logoIconColor),
      logoFile,
      logoFilename,
      logoScale: num(raw.logoScale, 5, 45, d.logoScale * 100) / 100,
      logoMargin: typeof raw.hasLogoBg === 'boolean' ? raw.hasLogoBg : d.logoMargin,
    },
  };
}

/** Parses the text of a preset file. */
export function parsePresetText(text: string): PresetResult {
  if (text.length > MAX_PRESET_BYTES) return { ok: false, error: 'The file is too large.' };
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Invalid file. Choose a JSON style preset.' };
  }
  return parsePreset(raw);
}
