import { useAsync } from '@/hooks/useAsync';
import { licenseNeedsAttribution, loadCollections, splitId } from '@/lib/iconify';
import { CURATED_CREDITS } from '@/lib/logoIcons';

/** Author and license of the collection an icon comes from (required attribution). */
export function IconCredit({ id }: { id: string }) {
  const prefix = splitId(id)[0];
  const known = CURATED_CREDITS[prefix];
  const remote = useAsync(known ? null : `credit:${prefix}`, loadCollections);
  const c = remote.data?.find((x) => x.prefix === prefix);
  const name = known?.name ?? c?.name;
  const author = known?.author ?? c?.author;
  const license = known?.license ?? c?.license.title;
  const licenseUrl = known?.licenseUrl ?? c?.license.url;
  if (!name || !license) return <p className="text-xs text-muted-foreground">{remote.error ? `Icon from the ${prefix} collection.` : ''}</p>;
  return (
    <p className="text-xs text-muted-foreground">
      Icon from {name}
      {author ? ` by ${author}` : ''} ·{' '}
      {licenseUrl ? (
        <a className="underline underline-offset-2 hover:text-foreground" href={licenseUrl} target="_blank" rel="noreferrer">
          {license}
        </a>
      ) : (
        license
      )}
      {licenseNeedsAttribution(c?.license.spdx) ? ' · credit the author when you publish the code' : ''}
    </p>
  );
}
