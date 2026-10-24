import { useEffect, useRef, useState } from 'react';
import { Bookmark, X } from 'lucide-react';

type Props = {
  open: boolean;
  initialName: string;
  onClose: () => void;
  onSave: (name: string) => void;
};

export function SaveFilterDialog({ open, initialName, onClose, onSave }: Props) {
  const [name, setName] = useState(initialName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setName(initialName);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(timer);
  }, [open, initialName]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed);
  };

  return (
    <div
      className="fixed inset-0 z-[65] flex items-center justify-center bg-ink/35 p-4 backdrop-blur-[3px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-label="Filtreyi kaydet"
        onSubmit={submit}
        className="w-full max-w-sm animate-pop rounded-2xl bg-surface p-4 shadow-pop"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="flex items-center gap-1.5 text-[11px] font-extrabold text-coral">
              <Bookmark size={12} /> Filtre
            </p>
            <h2 className="font-display text-[19px] font-bold">Filtreyi kaydet</h2>
          </div>
          <button
            type="button"
            aria-label="Kapat"
            onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded-lg text-muted hover:bg-paper-2 hover:text-ink"
          >
            <X size={15} />
          </button>
        </div>
        <input
          ref={inputRef}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="ör. Geciken backend işleri"
          aria-label="Filtre adı"
          maxLength={60}
          className="field mt-3"
        />
        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost border border-line-2 bg-surface-2"
          >
            Vazgeç
          </button>
          <button type="submit" className="btn btn-coral">
            Kaydet
          </button>
        </div>
      </form>
    </div>
  );
}
