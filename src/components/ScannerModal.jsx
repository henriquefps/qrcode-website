import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { CheckCircleIcon, WarningCircleIcon } from '@phosphor-icons/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

function stopScanner(scanner) {
  // html5-qrcode's stop() throws synchronously if the camera never started
  try {
    scanner.stop().catch(() => {});
  } catch {
    // scanner was not running — nothing to stop
  }
}

export default function ScannerModal({ isOpen, onClose, onScanSuccess }) {
  const [resultText, setResultText] = useState('');
  const [isError, setIsError] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    setResultText('');
    setIsError(false);

    let isSubscribed = true;

    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode('qr-scanner-viewport');
        scannerRef.current = scanner;

        const handleSuccess = (decodedText) => {
          if (!isSubscribed) return;
          setResultText(`QR code detected → ${decodedText}`);

          if (scannerRef.current) {
            stopScanner(scannerRef.current);
          }

          onScanSuccess(decodedText);

          setTimeout(() => {
            if (isSubscribed) onClose();
          }, 2200);
        };

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 12, qrbox: { width: 220, height: 220 } },
          handleSuccess,
          () => {} // ignore per-frame decode errors
        );
      } catch {
        if (isSubscribed) {
          setIsError(true);
          setResultText('Camera not available. Please allow camera access.');
        }
      }
    };

    // Wait a tick so the dialog portal has committed the viewport element
    const timer = setTimeout(startScanner, 50);

    return () => {
      isSubscribed = false;
      clearTimeout(timer);
      if (scannerRef.current) {
        stopScanner(scannerRef.current);
        scannerRef.current = null;
      }
    };
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan QR Code</DialogTitle>
          <DialogDescription>
            Point your camera at a QR code to import its content.
          </DialogDescription>
        </DialogHeader>

        <div
          id="qr-scanner-viewport"
          className="relative aspect-square w-full overflow-hidden bg-black"
        />

        {resultText && (
          <div
            className={cn(
              'flex items-start gap-2 border p-3 text-sm font-medium break-all',
              isError
                ? 'border-destructive/30 bg-destructive/10 text-destructive'
                : 'border-border bg-muted text-foreground'
            )}
          >
            {isError ? (
              <WarningCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            ) : (
              <CheckCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            )}
            <span>{resultText}</span>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Content will be loaded into the URL or Text field automatically.
        </p>
      </DialogContent>
    </Dialog>
  );
}
