import type { Options } from 'qr-code-styling';
import type { StyleConfig } from './preset';

/** Maps the style config and the payload to qr-code-styling options. */
export function buildQrOptions(data: string, style: StyleConfig, size: number): Options {
  const dotsOptions: NonNullable<Options['dotsOptions']> = { type: style.dotsType };
  if (style.fgType === 'gradient') {
    dotsOptions.gradient = {
      type: style.gradientType,
      rotation: (style.gradientRotation * Math.PI) / 180,
      colorStops: [
        { offset: 0, color: style.dotsColor },
        { offset: 1, color: style.dotsColorSecondary },
      ],
    };
  } else {
    dotsOptions.color = style.dotsColor;
    dotsOptions.gradient = undefined;
  }
  return {
    width: size,
    height: size,
    type: 'canvas',
    data,
    margin: style.margin,
    qrOptions: { typeNumber: 0, mode: 'Byte', errorCorrectionLevel: style.ecLevel },
    backgroundOptions: { color: style.bgTransparent ? 'transparent' : style.bgColor },
    dotsOptions,
    cornersSquareOptions: {
      type: style.cornersSquareType,
      color: style.customCorners ? style.cornersSquareColor : style.dotsColor,
    },
    cornersDotOptions: {
      type: style.cornersDotType,
      color: style.customCorners ? style.cornersDotColor : style.dotsColor,
    },
    image: style.logoFile || undefined,
    imageOptions: { hideBackgroundDots: true, imageSize: style.logoScale, margin: style.logoMargin ? 6 : 0 },
  };
}
