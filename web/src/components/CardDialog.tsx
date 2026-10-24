import { useEffect, useRef, useState } from 'react';
import {
  CalendarDays,
  Check,
  ListChecks,
  Palette,
  Plus,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { dueToIso, formatDueForInput, labelSwatch } from '../design';
import type { Card, CardExtra, Column } from '../types';

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
  extra?: CardExtra;
  labels: string[];
  onClose: () => void;
  onSave: (draft: Draft, columnId: string) => void;
  onDelete?: () => void;
  onMeta: (patch: { color?: string | null; emoji?: string | null }) => void;
  onAddChecklist: (text: string) => void;
  onToggleChecklist: (itemId: string, done: boolean) => void;
  onDeleteChecklist: (itemId: string) => void;
};

const COVER_COLORS = [
  '#e8365d',
  '#e8590c',
  '#f0a52a',
  '#2dd4a7',
  '#3b5bdb',
  '#a78bfa',
  '#d6336c',
  '#64748b',
];

const EMOJIS = ['🚀', '✅', '🔥', '🐞', '📌', '🎨', '📝', '💡', '⏰', '🧩', '🎯', '❤️'];

export function CardDialog({
  open,
  column,
  card,
  extra,
  labels,
  onClose,
  onSave,
  onDelete,
  onMeta,
  onAddChecklist,
  onToggleChecklist,
  onDeleteChecklist,
}: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [label, setLabel] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [newItem, setNewItem] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setTitle(card?.title ?? '');
    setDescription(card?.description ?? '');
    setLabel(card?.label ?? '');
    setDueDate(formatDueForInput(card?.dueDate ?? null));
    setNewItem('');
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
  const checklist = extra?.checklist ?? [];
  const doneCount = checklist.filter((item) => item.done).length;
  const progress = checklist.length
    ? Math.round((doneCount / checklist.length) * 100)
    : 0;

  const addItem = () => {
    const text = newItem.trim();
    if (!text) return;
    onAddChecklist(text);
    setNewItem('');
  };

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
        className="max-h-[92vh] w-full max-w-lg animate-pop overflow-y-auto rounded-t-2xl bg-surface shadow-pop sm:rounded-2xl"
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

          {card && (
            <div className="space-y-4 rounded-xl border border-line/80 bg-paper/40 p-3">
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-[12px] font-bold text-ink-2">
                  <Palette size={13} /> Kapak ve simge
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {COVER_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      aria-label={`Kapak rengi ${color}`}
                      aria-pressed={extra?.color === color}
                      onClick={() => onMeta({ color })}
                      className={`grid h-6 w-6 place-items-center rounded-full border-2 transition ${
                        extra?.color === color
                          ? 'scale-110 border-ink'
                          : 'border-white/70 hover:scale-105'
                      }`}
                      style={{ background: color }}
                    >
                      {extra?.color === color && (
                        <Check size={12} className="text-white" strokeWidth={3} />
                      )}
                    </button>
                  ))}
                  {extra?.color && (
                    <button
                      type="button"
                      onClick={() => onMeta({ color: null })}
                      className="ml-1 text-[11px] font-semibold text-muted underline"
                    >
                      kaldır
                    </button>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      aria-label={`Simge ${emoji}`}
                      aria-pressed={extra?.emoji === emoji}
                      onClick={() =>
                        onMeta({ emoji: extra?.emoji === emoji ? null : emoji })
                      }
                      className={`grid h-7 w-7 place-items-center rounded-md border text-[14px] transition ${
                        extra?.emoji === emoji
                          ? 'border-ink bg-surface-2'
                          : 'border-transparent hover:bg-surface-2'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-[12px] font-bold text-ink-2">
                    <ListChecks size={13} /> Alt görevler
                  </p>
                  <span className="font-mono text-[11px] font-bold text-muted">
                    {doneCount}/{checklist.length}
                  </span>
                </div>
                {checklist.length > 0 && (
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full bg-mint transition-[width] duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
                <ul className="mt-2 space-y-0.5">
                  {checklist.map((item) => (
                    <li
                      key={item.id}
                      className="group flex items-center gap-2 rounded-lg px-1 py-1 transition hover:bg-surface-2/70"
                    >
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={item.done}
                        aria-label={`${item.text} tamamlandı mı`}
                        onClick={() => onToggleChecklist(item.id, !item.done)}
                        className={`grid h-4 w-4 shrink-0 place-items-center rounded border transition ${
                          item.done
                            ? 'border-mint bg-mint text-[var(--color-on-accent)]'
                            : 'border-line-2 bg-surface-2'
                        }`}
                      >
                        {item.done && <Check size={11} strokeWidth={3} />}
                      </button>
                      <span
                        className={`flex-1 text-[12.5px] leading-snug ${
                          item.done ? 'text-muted line-through' : 'text-ink'
                        }`}
                      >
                        {item.text}
                      </span>
                      <button
                        type="button"
                        aria-label="Alt görevi sil"
                        onClick={() => onDeleteChecklist(item.id)}
                        className="text-faint opacity-0 transition hover:text-coral group-hover:opacity-100"
                      >
                        <Trash2 size={12} />
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex gap-2">
                  <input
                    value={newItem}
                    onChange={(event) => setNewItem(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        addItem();
                      }
                    }}
                    placeholder="Alt görev ekle…"
                    aria-label="Yeni alt görev"
                    className="field flex-1"
                  />
                  <button
                    type="button"
                    onClick={addItem}
                    aria-label="Alt görev ekle"
                    className="grid h-9 w-9 place-items-center rounded-xl border border-line-2 bg-surface-2 text-muted transition hover:border-ink/25 hover:text-ink"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

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
                className="btn border border-line-2 bg-surface-2 text-ink-2 hover:bg-paper-2"
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
