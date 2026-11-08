import { lazy, Suspense, useEffect, useState } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppShell } from '@/components/shell/AppShell';
import { useHashRoute } from '@/hooks/useHashRoute';
import { CreateView } from '@/features/create/CreateView';
import { useTheme } from '@/theme/theme';

// Read and Quick show are loaded on first use; the scanner stack is not needed to create a code.
const ReadView = lazy(() => import('@/features/read/ReadView').then((m) => ({ default: m.ReadView })));
const QuickShow = lazy(() => import('@/features/show/QuickShow').then((m) => ({ default: m.QuickShow })));

export function App() {
  const [route, navigate] = useHashRoute();
  const [quickShowOpen, setQuickShowOpen] = useState(false);
  const [quickShowLoaded, setQuickShowLoaded] = useState(false);
  const openQuickShow = () => {
    setQuickShowLoaded(true);
    setQuickShowOpen(true);
  };
  const theme = useTheme();

  // `Q` opens Quick show unless the user is typing or a dialog is already open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'q' || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey || e.repeat) return;
      const el = e.target instanceof HTMLElement ? e.target : null;
      if (el?.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"], [role="dialog"], [role="menu"]')) return;
      e.preventDefault();
      setQuickShowLoaded(true);
      setQuickShowOpen(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return (
    <TooltipProvider delayDuration={300}>
      <AppShell route={route} onNavigate={navigate} onQuickShow={openQuickShow}>
        {/* Create stays mounted so a half-made code survives a trip to Read. */}
        <div hidden={route !== 'create'}>
          <CreateView />
        </div>
        {route === 'read' && (
          <Suspense fallback={null}>
            <ReadView />
          </Suspense>
        )}
      </AppShell>
      {quickShowLoaded && (
        <Suspense fallback={null}>
          <QuickShow open={quickShowOpen} onOpenChange={setQuickShowOpen} />
        </Suspense>
      )}
      <Toaster position="bottom-center" theme={theme} />
    </TooltipProvider>
  );
}
