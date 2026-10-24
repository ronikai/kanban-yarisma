import { LayoutTemplate, X } from 'lucide-react';
import { TEMPLATES, type BoardTemplate } from '../templates';

type Props = {
  open: boolean;
  onClose: () => void;
  onUse: (template: BoardTemplate) => void;
};

export function TemplatesDialog({ open, onClose, onUse }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/35 p-4 backdrop-blur-[3px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Pano şablonları"
        className="w-full max-w-2xl animate-pop rounded-2xl bg-surface p-5 shadow-pop"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-[11px] font-extrabold text-coral">
              <LayoutTemplate size={13} /> Şablonlar
            </p>
            <h2 className="font-display text-[22px] font-bold leading-tight">
              Hazır panoyla başla
            </h2>
            <p className="mt-1 text-[12.5px] text-muted">
              Seçtiğin şablon mevcut panonun yerine yüklenir. Bu işlem geri alınamaz.
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

        <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
          {TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => onUse(template)}
              className="group rounded-xl border-2 border-line-2/70 bg-surface-2/60 p-3 text-left transition hover:border-ink/30 hover:bg-surface-2"
            >
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-paper-2 text-[20px]">
                {template.emoji}
              </span>
              <span className="mt-2 block font-display text-[14.5px] font-semibold text-ink">
                {template.name}
              </span>
              <span className="mt-0.5 block text-[11.5px] leading-snug text-muted">
                {template.note}
              </span>
              <span className="mt-2 block font-mono text-[10px] font-bold text-faint">
                {template.columns}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-[11px] text-faint">
            İpucu: yüklemeden önce yedek almak için üstteki indirme düğmesini kullan.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost border border-line-2 bg-surface-2"
          >
            Vazgeç
          </button>
        </div>
      </div>
    </div>
  );
}
