import React from 'react';
import { QrCodeIcon, ScanIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';

export default function MobileFABs({ onScanClick }) {
  const handleScrollToQR = () => {
    document.getElementById('live-preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="fixed right-4 bottom-4 z-40 flex flex-col gap-2 pb-[env(safe-area-inset-bottom)] lg:hidden">
      <Button
        variant="outline"
        size="icon-lg"
        onClick={onScanClick}
        aria-label="Scan QR code"
        className="bg-card shadow-lg"
      >
        <ScanIcon className="size-5" />
      </Button>
      <Button
        size="icon-lg"
        onClick={handleScrollToQR}
        aria-label="Scroll to QR code preview"
        className="shadow-lg"
      >
        <QrCodeIcon className="size-5" />
      </Button>
    </div>
  );
}
