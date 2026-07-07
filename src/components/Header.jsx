import React from 'react';
import { MoonIcon, QrCodeIcon, SunIcon } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function Header({ theme, onToggleTheme }) {
  return (
    <header className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <QrCodeIcon className="size-8" weight="duotone" aria-hidden="true" />
          <h1 className="text-3xl font-extrabold tracking-tighter md:text-4xl">QRGo</h1>
          <Badge variant="secondary">Free · No login</Badge>
        </div>
        <p className="max-w-xl text-base font-light text-muted-foreground md:text-lg">
          Design custom QR codes with gradients, shapes, and logos — 100% in your browser.
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleTheme}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
      </Button>
    </header>
  );
}
