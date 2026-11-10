import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import { requestIcon } from '@/lib/iconify';
import { useAsync } from '@/hooks/useAsync';
import { useVirtualGrid } from '@/hooks/useVirtualGrid';

const ITEM = 40;
const GAP = 6;

/** One icon drawn from Iconify data (currentColor). Empty while loading or when it cannot be fetched. */
export function IconThumb({ id, size = 20 }: { id: string; size?: number }) {
  const { data } = useAsync(id, () => requestIcon(id));
  if (!data) return <span aria-hidden className="block rounded-sm bg-muted" style={{ width: size, height: size, opacity: 0.4 }} />;
  return <svg aria-hidden width={size} height={size} viewBox={`0 0 ${data.width} ${data.height}`} fill="currentColor" dangerouslySetInnerHTML={{ __html: data.body }} />;
}

interface IconGridProps {
  ids: string[];
  selected: string;
  onPick: (id: string) => void;
  empty: string;
  label: string;
}

/** Windowed grid of icon buttons. Arrow keys, Home and End move between icons; only one button is a tab stop. */
export function IconGrid({ ids, selected, onPick, empty, label }: IconGridProps) {
  const { containerRef, columns, rowHeight, totalHeight, startIndex, endIndex, offsetTop } = useVirtualGrid(ids.length, { itemSize: ITEM, gap: GAP });
  const nodeRef = useRef<HTMLElement | null>(null);
  const [active, setActive] = useState(0);
  const focusNext = useRef(false);
  const setRef = useCallback(
    (el: HTMLElement | null) => {
      nodeRef.current = el;
      containerRef(el);
    },
    [containerRef],
  );

  const current = Math.min(active, Math.max(0, ids.length - 1));
  const tabStop = current >= startIndex && current < endIndex ? current : startIndex;

  useEffect(() => {
    if (!focusNext.current) return;
    focusNext.current = false;
    nodeRef.current?.querySelector<HTMLElement>(`[data-index="${current}"]`)?.focus();
  });

  const move = (e: KeyboardEvent) => {
    const step: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -columns, ArrowDown: columns };
    let next: number;
    if (e.key in step) next = Math.min(ids.length - 1, Math.max(0, current + step[e.key]));
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = ids.length - 1;
    else return;
    e.preventDefault();
    const el = nodeRef.current;
    if (el) {
      const top = Math.floor(next / columns) * rowHeight;
      if (top < el.scrollTop) el.scrollTop = top;
      else if (top + ITEM > el.scrollTop + el.clientHeight) el.scrollTop = top + ITEM - el.clientHeight + GAP;
    }
    focusNext.current = true;
    setActive(next);
  };

  return (
    <div ref={setRef} className="h-56 overflow-y-auto rounded-md border bg-muted/30 p-2" data-testid="icon-grid">
      {ids.length === 0 ? (
        <p className="p-4 text-center text-sm text-muted-foreground" role="status">
          {empty}
        </p>
      ) : (
        <div role="group" aria-label={label} onKeyDown={move} style={{ height: totalHeight, position: 'relative' }}>
          <div style={{ position: 'absolute', top: offsetTop, left: 0, right: 0, display: 'grid', gridTemplateColumns: `repeat(${columns}, ${ITEM}px)`, gap: GAP, justifyContent: 'space-between' }}>
            {ids.slice(startIndex, endIndex).map((id, i) => {
              const index = startIndex + i;
              return (
                <button
                  key={id}
                  type="button"
                  data-index={index}
                  title={id}
                  aria-label={`Use icon ${id}`}
                  aria-pressed={selected === id}
                  tabIndex={index === tabStop ? 0 : -1}
                  onClick={() => {
                    setActive(index);
                    onPick(id);
                  }}
                  onFocus={() => setActive(index)}
                  className={cn(
                    'flex items-center justify-center rounded-md border bg-background text-foreground transition-colors hover:border-primary hover:bg-accent focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                    selected === id ? 'border-primary bg-muted' : 'border-transparent',
                  )}
                  style={{ width: ITEM, height: ITEM }}
                >
                  <IconThumb id={id} />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
