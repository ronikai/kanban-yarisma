import { Check, Palette, X } from 'lucide-react';
import { THEMES, type Theme, type ThemeId } from '../themes';

type Props = {
  open: boolean;
  activeId: ThemeId;
  onSelect: (theme: Theme) => void;
  onClose: () => void;
};

export function SettingsDialog({ open, activeId, onSelect, onClose }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/35 p-4 backdrop-blur-[3px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Görünüm ayarları"
        className="w-full max-w-2xl animate-pop rounded-2xl bg-surface p-5 shadow-pop"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-[11px] font-extrabold text-coral">
              <Palette size={13} /> Görünüm
            </p>
            <h2 className="font-display text-[22px] font-bold leading-tight">
              Renk paleti
            </h2>
            <p className="mt-1 text-[12.5px] text-muted">
              Pano görünümünü değiştir. Seçim bu tarayıcıda saklanır, veriler etkilenmez.
            </p>
          </div>
          <button
            type="button"
            aria-label="Kapat"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-paper-2 hover:text-ink"
          >
            <X size={17} />
          </button>
        </div>

        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
          {THEMES.map((theme) => {
            const selected = theme.id === activeId;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => onSelect(theme)}
                aria-pressed={selected}
                className={`group rounded-xl border-2 p-2.5 text-left transition ${
                  selected
                    ? 'border-ink bg-surface-2 shadow-lift'
                    : 'border-line-2/70 bg-surface-2/60 hover:border-ink/25 hover:bg-surface-2'
                }`}
              >
                <span
                  className="flex h-[72px] items-end gap-1.5 rounded-lg p-2"
                  style={{ background: theme.tokens.paper }}
                >
                  {theme.columns.slice(0, 3).map((column) => (
                    <span
                      key={column.accent}
                      className="flex h-full w-1/3 flex-col gap-1 rounded-md p-1"
                      style={{ background: column.wash, border: `2px solid ${column.line}` }}
                    >
                      <span
                        className="h-1.5 w-full rounded-full"
                        style={{ background: column.accent }}
                      />
                      <span className="h-1 w-3/4 rounded-full bg-ink/15" />
                      <span className="h-1 w-1/2 rounded-full bg-ink/10" />
                    </span>
                  ))}
                </span>
                <span className="mt-2 flex items-center gap-1">
                  <span className="font-display text-[14px] font-semibold">
                    {theme.name}
                  </span>
                  {selected && <Check size={14} className="text-mint" />}
                </span>
                <span className="block text-[11px] leading-snug text-muted">
                  {theme.note}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex justify-end">
          <button type="button" onClick={onClose} className="btn btn-primary">
            Bitti
          </button>
        </div>
      </div>
    </div>
  );
}
