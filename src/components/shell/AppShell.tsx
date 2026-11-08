import { lazy, Suspense, useState, type ReactNode } from 'react';
import { InfoIcon, QrCodeIcon, PresentationIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ThemeMenu } from '@/theme/ThemeMenu';
import type { Route } from '@/hooks/useHashRoute';
import { TopNav } from './TopNav';
const AboutDialog = lazy(() => import('./AboutDialog').then((m) => ({ default: m.AboutDialog })));

interface AppShellProps {
  route: Route;
  onNavigate: (route: Route) => void;
  onQuickShow: () => void;
  children: ReactNode;
}

/** Header (brand, Create | Read, Quick show, theme, About) around one raised content surface. */
export function AppShell({ route, onNavigate, onQuickShow, children }: AppShellProps) {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [aboutLoaded, setAboutLoaded] = useState(false);
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="mx-auto flex h-14 w-full max-w-6xl items-center gap-1 px-3 sm:gap-2 sm:px-4 md:px-6">
        <a href="#/create" className="flex items-center gap-2 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50" aria-label="Qrcode home">
          <QrCodeIcon className="size-6 text-primary max-sm:hidden" weight="duotone" aria-hidden="true" />
          <span className="text-lg font-semibold max-[359px]:sr-only">Qrcode</span>
        </a>
        <div className="ml-1 mr-auto sm:mx-4">
          <TopNav route={route} onNavigate={onNavigate} />
        </div>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={onQuickShow} aria-label="Quick show" className="sm:hidden">
                <PresentationIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Quick show (Q)</TooltipContent>
          </Tooltip>
          <Button variant="outline" onClick={onQuickShow} aria-keyshortcuts="Q" className="max-sm:hidden">
            <PresentationIcon data-icon="inline-start" />
            Quick show
          </Button>
          <ThemeMenu />
          <Button variant="ghost" size="icon" onClick={() => {
              setAboutLoaded(true);
              setAboutOpen(true);
            }} aria-label="About">
            <InfoIcon />
          </Button>
        </div>
      </header>
      <main className="mx-auto mb-2 flex w-full max-w-6xl flex-1 flex-col px-2 md:mb-4 md:px-4">
        <div className="flex-1 rounded-xl border bg-card shadow-xs">{children}</div>
      </main>
      {aboutLoaded && (
        <Suspense fallback={null}>
          <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />
        </Suspense>
      )}
    </div>
  );
}
