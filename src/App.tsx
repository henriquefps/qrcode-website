import { useState } from 'react';
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
