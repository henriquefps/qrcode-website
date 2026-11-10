import { useState } from 'react';
import { ArrowClockwiseIcon, MagnifyingGlassIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAsync, useDebounced } from '@/hooks/useAsync';
import { licenseNeedsAttribution, listCollection, loadCollections, searchIcons } from '@/lib/iconify';
import { IconGrid } from './IconGrid';

const ALL = '__all__';

/** Search over every open-licensed Iconify collection, with an optional collection filter. Nothing is requested until it is mounted. */
export function IconSearch({ selected, onPick }: { selected: string; onPick: (id: string) => void }) {
  const [query, setQuery] = useState('');
  const [collection, setCollection] = useState<string>(ALL);
  const [retry, setRetry] = useState(0);
  const debounced = useDebounced(query.trim(), 300);

  const collections = useAsync(`collections:${retry}`, loadCollections);
  const prefix = collection === ALL ? null : collection;
  const info = collections.data?.find((c) => c.prefix === prefix) ?? null;

  const key = collections.data && (debounced || prefix) ? `${prefix ?? ALL}|${debounced}|${retry}` : null;
  const results = useAsync<string[]>(key, () => (debounced ? searchIcons(debounced, prefix) : listCollection(prefix as string)));

  const error = collections.error ?? results.error;
  const loading = collections.loading || results.loading;
  const empty = error
    ? 'Could not reach the Iconify API. Check your connection and retry.'
    : loading && key
      ? 'Searching…'
      : collections.loading
        ? 'Loading collections…'
        : debounced
          ? 'No icons match your search.'
          : 'Type to search every open-license icon collection, or pick a collection.';

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search icons, e.g. heart, coffee, pizza" aria-label="Search icons" className="pl-8" />
      </div>
      <Select value={collection} onValueChange={setCollection} disabled={!collections.data}>
        <SelectTrigger className="w-full" aria-label="Icon collection">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          <SelectItem value={ALL}>All open collections</SelectItem>
          {(collections.data ?? []).map((c) => (
            <SelectItem key={c.prefix} value={c.prefix}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {info && (
        <p className="text-xs text-muted-foreground">
          {info.name} · {info.license.title}
          {info.author ? ` · ${info.author}` : ''}
          {licenseNeedsAttribution(info.license.spdx) ? ' · attribution required' : ''}
        </p>
      )}
      <IconGrid ids={results.data ?? []} selected={selected} onPick={onPick} empty={empty} label="Icon search results" />
      {error && (
        <Button variant="outline" size="sm" onClick={() => setRetry((n) => n + 1)}>
          <ArrowClockwiseIcon data-icon="inline-start" />
          Retry
        </Button>
      )}
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {!error && !loading && key ? `${(results.data ?? []).length.toLocaleString()} icons` : ''}
      </p>
    </div>
  );
}
