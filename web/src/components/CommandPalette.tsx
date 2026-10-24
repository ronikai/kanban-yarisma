import { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { fold } from '../useKanban';

export type PaletteItem = {
  id: string;
  label: string;
  hint?: string;
  group: string;
  icon: React.ReactNode;
  keywords?: string;
  run: () => void;
};

type Props = {
  open: boolean;
  items: PaletteItem[];
  onClose: () => void;
};

export function CommandPalette({ open, items, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActive(0);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(timer);
  }, [open]);

  const filtered = useMemo(() => {
    const needle = fold(query.trim());
    if (!needle) return items.slice(0, 24);

    return items
      .map((item) => {
        const label = fold(item.label);
        const hint = fold(item.hint ?? '');
        const keywords = fold(item.keywords ?? '');
        const score = label.startsWith(needle)
          ? 0
          : label.includes(needle)
            ? 1
            : hint.includes(needle)
              ? 2
              : keywords.includes(needle)
                ? 3
                : -1;
        return { item, score };
      })
      .filter((entry) => entry.score >= 0)
      .sort((a, b) => a.score - b.score)
      .map((entry) => entry.item)
      .slice(0, 24);
  }, [items, query]);

  useEffect(() => {
    if (active >= filtered.length) setActive(0);
  }, [filtered.length, active]);

  if (!open) return null;

  const groups = Array.from(new Set(filtered.map((item) => item.group)));

  const choose = (index: number) => {
    const item = filtered[index];
    if (!item) return;
    onClose();
    window.setTimeout(() => item.run(), 0);
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center bg-ink/35 px-4 pt-[12vh] backdrop-blur-[3px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Komut paleti"
        className="w-full max-w-xl animate-pop overflow-hidden rounded-2xl border border-line/80 bg-surface shadow-pop"
      >
        <div className="flex items-center gap-2 border-b border-line/80 px-3.5 py-3">
          <Search size={17} className="shrink-0 text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                setActive((current) => Math.min(current + 1, filtered.length - 1));
              } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                setActive((current) => Math.max(current - 1, 0));
              } else if (event.key === 'Enter') {
                event.preventDefault();
                choose(active);
              } else if (event.key === 'Escape') {
                event.preventDefault();
                onClose();
              }
            }}
            placeholder="Komut veya kart ara…"
            aria-label="Komut ara"
            className="w-full bg-transparent text-[14px] font-semibold text-ink outline-none placeholder:text-faint"
          />
          <kbd className="kbd hidden sm:block">Esc</kbd>
        </div>

        <div className="max-h-[52vh] overflow-y-auto p-1.5">
          {filtered.length === 0 && (
            <p className="px-3 py-8 text-center text-[13px] text-muted">
              “{query}” için sonuç yok.
            </p>
          )}
          {groups.map((group) => (
            <div key={group} className="mb-1">
              <p className="px-2.5 pb-1 pt-2 text-[10.5px] font-extrabold text-faint">
                {group}
              </p>
              {filtered
                .map((item, index) => ({ item, index }))
                .filter(({ item }) => item.group === group)
                .map(({ item, index }) => (
                  <button
                    key={item.id}
                    type="button"
                    onMouseEnter={() => setActive(index)}
                    onClick={() => choose(index)}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition ${
                      index === active ? 'bg-paper-2' : 'hover:bg-paper-2/60'
                    }`}
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-surface-2 text-ink-2">
                      {item.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-ink">
                        {item.label}
                      </span>
                      {item.hint && (
                        <span className="block truncate text-[11px] text-muted">
                          {item.hint}
                        </span>
                      )}
                    </span>
                    {index === active && (
                      <kbd className="kbd shrink-0">Enter</kbd>
                    )}
                  </button>
                ))}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 border-t border-line/80 px-3.5 py-2 text-[10.5px] font-semibold text-faint">
          <span className="flex items-center gap-1">
            <kbd className="kbd">↑</kbd>
            <kbd className="kbd">↓</kbd> gez
          </span>
          <span className="flex items-center gap-1">
            <kbd className="kbd">↵</kbd> seç
          </span>
          <span className="ml-auto">{filtered.length} sonuç</span>
        </div>
      </div>
    </div>
  );
}
