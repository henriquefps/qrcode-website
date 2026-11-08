import { useEffect, useRef, useState } from 'react';
import QRCodeStyling from 'qr-code-styling';
import { CopySimpleIcon, DeviceMobileCameraIcon, DownloadSimpleIcon, FileSvgIcon } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { buildQrOptions } from '@/lib/qrOptions';
import type { StyleConfig } from '@/lib/preset';

const PNG_SIZES = [256, 512, 1024] as const;
const PREVIEW_SIZE = 280;
const FILE_NAME = 'qrcode';

/** Checkerboard so a transparent background is visibly transparent. */
const CHECKERBOARD = {
  backgroundImage:
    'linear-gradient(45deg, rgba(128,128,128,0.15) 25%, transparent 25%, transparent 75%, rgba(128,128,128,0.15) 75%), linear-gradient(45deg, rgba(128,128,128,0.15) 25%, transparent 25%, transparent 75%, rgba(128,128,128,0.15) 75%)',
  backgroundSize: '16px 16px',
  backgroundPosition: '0 0, 8px 8px',
};

interface LivePreviewProps {
  data: string;
  style: StyleConfig;
}

export function LivePreview({ data, style }: LivePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<QRCodeStyling | null>(null);
  const [pngSize, setPngSize] = useState<(typeof PNG_SIZES)[number]>(512);

  useEffect(() => {
    const options = buildQrOptions(data, style, PREVIEW_SIZE);
    if (!qrRef.current && containerRef.current) {
      const qr = new QRCodeStyling(options);
      containerRef.current.replaceChildren();
      qr.append(containerRef.current);
      qrRef.current = qr;
    } else {
      qrRef.current?.update(options);
    }
  }, [data, style]);

  const downloadPng = async () => {
    const qr = qrRef.current;
    if (!qr) return;
    // Re-render at export resolution, then restore the preview size.
    qr.update({ width: pngSize, height: pngSize });
    await new Promise((resolve) => setTimeout(resolve, 50));
    try {
      await qr.download({ name: FILE_NAME, extension: 'png' });
    } catch {
      toast.error('Could not create the PNG.');
    } finally {
      qr.update({ width: PREVIEW_SIZE, height: PREVIEW_SIZE });
    }
  };

  const downloadSvg = async () => {
    try {
      await qrRef.current?.download({ name: FILE_NAME, extension: 'svg' });
    } catch {
      toast.error('Could not create the SVG.');
    }
  };

  const copyContent = () => {
    navigator.clipboard.writeText(data).then(
      () => toast.success('Content copied to clipboard.'),
      () => toast.error('Could not copy to the clipboard.'),
    );
  };

  return (
    <section aria-labelledby="preview-heading" className="flex flex-col items-center gap-5">
      <div className="flex w-full items-center justify-between">
        <h2 id="preview-heading" className="text-lg font-semibold">
          Preview
        </h2>
        <Badge variant="outline" className="gap-1.5">
          <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
          Live
        </Badge>
      </div>

      <div
        className="flex aspect-square w-full max-w-[300px] items-center justify-center rounded-lg border bg-card p-3"
        style={style.bgTransparent ? CHECKERBOARD : undefined}
      >
        <div ref={containerRef} role="img" aria-label="QR code preview" className="flex items-center justify-center [&_canvas]:h-auto [&_canvas]:max-w-full" />
      </div>

      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <DeviceMobileCameraIcon className="size-4 shrink-0" aria-hidden="true" />
        Point a phone camera at the preview to test the scan.
      </p>

      <div className="flex w-full flex-col gap-2">
        <Label id="png-size-label">PNG size</Label>
        <ToggleGroup
          type="single"
          variant="outline"
          value={String(pngSize)}
          onValueChange={(v) => v && setPngSize(Number(v) as (typeof PNG_SIZES)[number])}
          aria-labelledby="png-size-label"
          className="w-full"
        >
          {PNG_SIZES.map((size) => (
            <ToggleGroupItem key={size} value={String(size)} className="flex-1">
              {size} px
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
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
        <Button variant="ghost" onClick={copyContent}>
          <CopySimpleIcon data-icon="inline-start" />
          Copy content
        </Button>
      </div>
    </section>
  );
}
