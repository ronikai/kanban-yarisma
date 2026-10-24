import { useEffect, useRef, useState } from 'react';
import { CalendarDays, Tag, Trash2, X } from 'lucide-react';
import { dueToIso, formatDueForInput, labelSwatch } from '../design';
import type { Card, Column } from '../types';

export type Draft = {
  title: string;
  description: string;
  label: string;
  dueDate: string;
};

type Props = {
  open: boolean;
  column: Column | null;
  card: Card | null;
  labels: string[];
  onClose: () => void;
  onSave: (draft: Draft, columnId: string) => void;
  onDelete?: () => void;
};

export function CardDialog({
  open,
  column,
  card,
  labels,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [label, setLabel] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setTitle(card?.title ?? '');
    setDescription(card?.description ?? '');
    setLabel(card?.label ?? '');
    setDueDate(formatDueForInput(card?.dueDate ?? null));
    setError('');
    const timer = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(timer);
  }, [open, card]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !column) return null;

  const suggestions = labels
    .filter((item) => item.toLowerCase() !== label.toLowerCase())
    .slice(0, 5);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      setError('Başlık boş olamaz.');
      inputRef.current?.focus();
      return;
    }
    onSave(
      {
        title: title.trim(),
        description: description.trim(),
        label: label.trim(),
        dueDate,
      },
      column.id,
    );
  };

  const previewSwatch = label.trim() ? labelSwatch(label.trim()) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/35 backdrop-blur-[3px] sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={card ? 'Kart detayı' : 'Yeni kart'}
        className="max-h-[92vh] w-full max-w-lg animate-pop overflow-y-auto rounded-t-2xl bg-[#fffdf8] shadow-pop sm:rounded-2xl"
      >
        <div className="h-1.5 w-full bg-coral" />
        <div className="flex items-start justify-between gap-4 px-5 pt-4">
          <div className="min-w-0">
            <p className="text-[11px] font-extrabold text-coral">
              {card ? 'Kart detayı' : 'Yeni kart'}
            </p>
            <h2 className="truncate font-display text-[22px] font-extrabold leading-tight tracking-tight">
              {column.title}
            </h2>
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

        <form onSubmit={submit} className="space-y-4 px-5 pb-5 pt-4">
          <div>
            <label
              htmlFor="card-title"
              className="mb-1.5 block text-[12px] font-bold text-ink-2"
            >
              Başlık
            </label>
            <input
              id="card-title"
              ref={inputRef}
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                if (error) setError('');
              }}
              placeholder="Ne yapılacak?"
              maxLength={500}
              className="field font-semibold"
            />
            {error && <p className="mt-1.5 text-[12px] font-semibold text-coral">{error}</p>}
          </div>

          <div>
            <label
              htmlFor="card-desc"
              className="mb-1.5 block text-[12px] font-bold text-ink-2"
            >
              Açıklama
            </label>
            <textarea
              id="card-desc"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              placeholder="Kısa bir not ekle…"
              className="field resize-none leading-relaxed"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="card-label"
                className="mb-1.5 flex items-center gap-1.5 text-[12px] font-bold text-ink-2"
              >
                <Tag size={11} /> Etiket
              </label>
              <div className="relative">
                <input
                  id="card-label"
                  value={label}
                  onChange={(event) => setLabel(event.target.value)}
                  placeholder="ör. backend"
                  className="field pr-8"
                />
                {previewSwatch && (
                  <span
                    className="pointer-events-none absolute right-3 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full"
                    style={{ background: previewSwatch.dot }}
                  />
                )}
              </div>
              {suggestions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {suggestions.map((item) => {
                    const swatch = labelSwatch(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setLabel(item)}
                        className="rounded-md px-1.5 py-1 text-[11px] font-semibold transition hover:brightness-95"
                        style={{ background: swatch.bg, color: swatch.fg }}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="card-due"
                className="mb-1.5 flex items-center gap-1.5 text-[12px] font-bold text-ink-2"
              >
                <CalendarDays size={11} /> Son tarih
              </label>
              <input
                id="card-due"
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className="field"
              />
              {dueDate && (
                <p className="mt-1.5 text-[11px] text-muted">
                  {dueToIso(dueDate)
                    ? new Date(dueToIso(dueDate)!).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : 'Geçersiz tarih'}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            {card && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="btn btn-ghost text-coral hover:bg-coral-soft"
              >
                <Trash2 size={15} /> Sil
              </button>
            )}
            <div className="ml-auto flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="btn border border-line-2 bg-white text-ink-2 hover:bg-paper-2"
              >
                Vazgeç
              </button>
              <button type="submit" className="btn btn-coral">
                {card ? 'Kaydet' : 'Kart ekle'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
