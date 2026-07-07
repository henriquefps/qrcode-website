import React, { useEffect, useRef, useState } from 'react';
import QRCodeStyling from 'qr-code-styling';
import {
  CopySimpleIcon,
  DeviceMobileCameraIcon,
  DownloadSimpleIcon,
  FileSvgIcon,
  ScanIcon
} from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const RESOLUTIONS = [
  { id: 'small', label: '256 px' },
  { id: 'medium', label: '512 px' },
  { id: 'large', label: '1024 px' }
];

const PREVIEW_SIZE = 280;

/* Checkerboard so a transparent QR background is visibly transparent */
const CHECKERBOARD = {
  backgroundImage:
    'linear-gradient(45deg, rgba(128,128,128,0.15) 25%, transparent 25%, transparent 75%, rgba(128,128,128,0.15) 75%), linear-gradient(45deg, rgba(128,128,128,0.15) 25%, transparent 25%, transparent 75%, rgba(128,128,128,0.15) 75%)',
  backgroundSize: '16px 16px',
  backgroundPosition: '0 0, 8px 8px'
};

export default function LivePreview({ qrData, styleConfig, onScanClick, onCopyClick }) {
  const containerRef = useRef(null);
  const qrCodeRef = useRef(null);
  const [pngResolution, setPngResolution] = useState('medium');

  const getQRStylingOptions = () => {
    const dotsOptions = { type: styleConfig.dotsType };

    if (styleConfig.fgType === 'gradient') {
      dotsOptions.gradient = {
        type: styleConfig.gradientType,
        rotation: (styleConfig.gradientRotation * Math.PI) / 180,
        colorStops: [
          { offset: 0, color: styleConfig.dotsColor },
          { offset: 1, color: styleConfig.dotsColorSecondary }
        ]
      };
    } else {
      dotsOptions.color = styleConfig.dotsColor;
      dotsOptions.gradient = null;
    }

    return {
      width: PREVIEW_SIZE,
      height: PREVIEW_SIZE,
      type: 'canvas',
      data: qrData || 'https://example.com',
      margin: styleConfig.margin,
      qrOptions: {
        typeNumber: 0,
        mode: 'Byte',
        errorCorrectionLevel: styleConfig.ecLevel
      },
      backgroundOptions: {
        color: styleConfig.bgTransparent ? 'transparent' : styleConfig.bgColor
      },
      dotsOptions,
      cornersSquareOptions: {
        type: styleConfig.cornersSquareType,
        color: styleConfig.customCorners ? styleConfig.cornersSquareColor : styleConfig.dotsColor
      },
      cornersDotOptions: {
        type: styleConfig.cornersDotType,
        color: styleConfig.customCorners ? styleConfig.cornersDotColor : styleConfig.dotsColor
      },
      image: styleConfig.logoFile || undefined,
      imageOptions: {
        hideBackgroundDots: true,
        imageSize: styleConfig.logoScale,
        margin: styleConfig.logoMargin ? 6 : 0
      }
    };
  };

  useEffect(() => {
    if (containerRef.current && !qrCodeRef.current) {
      const qrCode = new QRCodeStyling(getQRStylingOptions());
      containerRef.current.innerHTML = '';
      qrCode.append(containerRef.current);
      qrCodeRef.current = qrCode;
    }
  }, []);

  useEffect(() => {
    if (qrCodeRef.current) {
      qrCodeRef.current.update(getQRStylingOptions());
    }
  }, [qrData, styleConfig]);

  const downloadPng = async () => {
    if (!qrCodeRef.current) return;

    let size = 512;
    if (pngResolution === 'small') size = 256;
    else if (pngResolution === 'large') size = 1024;

    // Temporarily re-render at export resolution, then restore the preview size
    qrCodeRef.current.update({ width: size, height: size });
    await new Promise((resolve) => setTimeout(resolve, 50));

    try {
      await qrCodeRef.current.download({ name: 'qrgo-custom-qrcode', extension: 'png' });
    } catch (err) {
      console.error('Failed to download PNG:', err);
    } finally {
      qrCodeRef.current.update({ width: PREVIEW_SIZE, height: PREVIEW_SIZE });
    }
  };

  const downloadSvg = () => {
    if (qrCodeRef.current) {
      qrCodeRef.current.download({ name: 'qrgo-custom-qrcode', extension: 'svg' });
    }
  };

  return (
    <Card id="live-preview" className="lg:sticky lg:top-6">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle>Live Preview</CardTitle>
          <Badge variant="outline" className="gap-1.5">
            <span className="size-1.5 animate-pulse rounded-full bg-primary" aria-hidden="true" />
            Live
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col items-center gap-5">
        <div
          className="flex aspect-square w-full max-w-[300px] items-center justify-center border bg-card p-3"
          style={styleConfig.bgTransparent ? CHECKERBOARD : undefined}
        >
          <div
            ref={containerRef}
            className="flex items-center justify-center [&_canvas]:h-auto [&_canvas]:max-w-full"
          />
        </div>

        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <DeviceMobileCameraIcon className="size-4 shrink-0" aria-hidden="true" />
          Point your phone camera at the preview to test the scan.
        </p>

        <div className="flex w-full flex-col gap-2">
          <Label>PNG Resolution</Label>
          <div className="grid grid-cols-3 gap-1.5">
            {RESOLUTIONS.map(({ id, label }) => (
              <Button
                key={id}
                variant={pngResolution === id ? 'secondary' : 'outline'}
                size="xs"
                onClick={() => setPngResolution(id)}
                className={cn(pngResolution === id && 'border-primary')}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex w-full flex-col gap-2">
          <Button onClick={downloadPng}>
            <DownloadSimpleIcon data-icon="inline-start" />
            Download PNG
          </Button>
          <Button variant="outline" onClick={downloadSvg}>
            <FileSvgIcon data-icon="inline-start" />
            Download SVG
          </Button>
          <Button variant="outline" onClick={onScanClick}>
            <ScanIcon data-icon="inline-start" />
            Scan &amp; Import QR
          </Button>
          <Button variant="ghost" size="sm" onClick={onCopyClick}>
            <CopySimpleIcon data-icon="inline-start" />
            Copy content
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
