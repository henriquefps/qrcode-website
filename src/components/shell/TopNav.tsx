import { PencilSimpleLineIcon, ScanIcon } from '@phosphor-icons/react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ROUTES, type Route } from '@/hooks/useHashRoute';

const ITEMS: Record<Route, { label: string; Icon: typeof ScanIcon }> = {
  create: { label: 'Create', Icon: PencilSimpleLineIcon },
  read: { label: 'Read', Icon: ScanIcon },
};

/** Top-level segmented navigation, shown on desktop and mobile alike. */
export function TopNav({ route, onNavigate }: { route: Route; onNavigate: (route: Route) => void }) {
  return (
    <Tabs value={route} onValueChange={(v) => onNavigate(v as Route)}>
      <TabsList aria-label="Section">
        {ROUTES.map((id) => {
          const { label, Icon } = ITEMS[id];
          return (
            <TabsTrigger key={id} value={id} className="gap-1.5 px-2.5 sm:px-3">
              <Icon aria-hidden="true" />
              {label}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
