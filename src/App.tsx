import { useEffect, useState } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppShell } from '@/components/shell/AppShell';
import { useHashRoute } from '@/hooks/useHashRoute';
import { CreateView } from '@/features/create/CreateView';
import { ReadView } from '@/features/read/ReadView';
import { QuickShow } from '@/features/show/QuickShow';
import { useTheme } from '@/theme/theme';

export function App() {
  const [route, navigate] = useHashRoute();
  const [quickShowOpen, setQuickShowOpen] = useState(false);
  const theme = useTheme();

  // `Q` opens Quick show unless the user is typing or a dialog is already open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'q' || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey || e.repeat) return;
      const el = e.target instanceof HTMLElement ? e.target : null;
      if (el?.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"], [role="dialog"], [role="menu"]')) return;
      e.preventDefault();
      setQuickShowOpen(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return (
    <TooltipProvider delayDuration={300}>
      <AppShell route={route} onNavigate={navigate} onQuickShow={() => setQuickShowOpen(true)}>
        {/* Create stays mounted so a half-made code survives a trip to Read. */}
        <div hidden={route !== 'create'}>
          <CreateView />
        </div>
        {route === 'read' && <ReadView />}
      </AppShell>
      <QuickShow open={quickShowOpen} onOpenChange={setQuickShowOpen} />
      <Toaster position="bottom-center" theme={theme} />
    </TooltipProvider>
  );
}
