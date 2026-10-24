import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CirclePlus, Pencil, Trash2 } from 'lucide-react';
import { columnSwatch } from '../design';
import type { Card, Column } from '../types';
import { CardTile } from './CardTile';

type Props = {
  column: Column;
  index: number;
  isFiltering: boolean;
  onAddCard: (columnId: string) => void;
  onOpenCard: (card: Card, columnId: string) => void;
  onDeleteCard: (card: Card, columnId: string, index: number) => void;
  onDeleteColumn: (column: Column) => void;
  onRenameColumn: (columnId: string, title: string) => void;
};

export function ColumnView({
  column,
  index,
  isFiltering,
  onAddCard,
  onOpenCard,
  onDeleteCard,
  onDeleteColumn,
  onRenameColumn,
}: Props) {
  const palette = columnSwatch(index);
  const { setNodeRef, isOver } = useDroppable({
    id: `column:${column.id}`,
    data: { type: 'column', columnId: column.id },
  });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(column.title);

  const startEditing = () => {
    setDraft(column.title);
    setEditing(true);
  };

  const commit = () => {
    const title = draft.trim();
    setEditing(false);
    if (title && title !== column.title) onRenameColumn(column.id, title);
  };

  return (
    <section
      className="flex w-[300px] shrink-0 flex-col overflow-hidden rounded-[18px] border-2 bg-white shadow-lift"
      style={{ borderColor: palette.line }}
    >
      <header
        className="group/head flex items-center gap-1.5 px-3 py-2.5"
        style={{ background: palette.accent }}
      >
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commit();
              if (event.key === 'Escape') {
                setDraft(column.title);
                setEditing(false);
              }
            }}
            maxLength={500}
            aria-label="Kolon adı"
            className="min-w-0 flex-1 rounded-md bg-white/95 px-2 py-1 font-display text-[15px] font-semibold text-ink outline-none ring-2 ring-white/60"
          />
        ) : (
          <h2
            onDoubleClick={startEditing}
            title="Adı düzenlemek için çift tıkla"
            className="truncate font-display text-[16px] font-semibold tracking-[0.01em] text-white"
          >
            {column.title}
          </h2>
        )}
        <span className="rounded-full bg-white/25 px-2 py-0.5 text-[11px] font-extrabold text-white">
          {column.cards.length}
        </span>
        <span className="ml-auto flex items-center gap-0.5">
          <button
            type="button"
            aria-label={`${column.title} kolonunu yeniden adlandır`}
            onClick={startEditing}
            className="grid h-7 w-7 place-items-center rounded-lg text-white/70 transition hover:bg-white/20 hover:text-white"
          >
            <Pencil size={13} />
          </button>
          <button
            type="button"
            aria-label={`${column.title} kolonunu sil`}
            onClick={() => onDeleteColumn(column)}
            className="grid h-7 w-7 place-items-center rounded-lg text-white/70 transition hover:bg-white/20 hover:text-white"
          >
            <Trash2 size={14} />
          </button>
        </span>
      </header>

      <div
        ref={setNodeRef}
        className={`flex min-h-[150px] flex-1 flex-col gap-2 px-2.5 py-2.5 transition-colors ${
          isOver ? 'bg-white/70' : ''
        }`}
        style={{ background: palette.wash }}
      >
        <SortableContext
          items={column.cards.map((card) => card.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.cards.map((card, cardIndex) => (
            <CardTile
              key={card.id}
              card={card}
              columnId={column.id}
              index={cardIndex}
              onOpen={onOpenCard}
              onDelete={onDeleteCard}
            />
          ))}
        </SortableContext>

        {column.cards.length === 0 && (
          <div
            className={`grid flex-1 place-items-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${
              isOver ? 'border-ink/25 bg-white/70' : 'border-ink/10 bg-white/40'
            }`}
          >
            <p className="text-[12.5px] font-semibold leading-relaxed text-muted">
              {isFiltering ? (
                <>Bu filtrede eşleşen kart yok.</>
              ) : isOver ? (
                <>Bırak, buraya gelsin.</>
              ) : (
                <>
                  Henüz kart yok.
                  <br />
                  Aşağıdan ekle ya da kart sürükle.
                </>
              )}
            </p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => onAddCard(column.id)}
        className="mx-2.5 mb-2.5 flex items-center justify-center gap-1.5 rounded-xl border-2 border-white bg-white px-3 py-2 text-[12.5px] font-extrabold transition hover:border-current focus-visible:outline-2 focus-visible:outline-coral"
        style={{ color: palette.accent }}
      >
        <CirclePlus size={15} strokeWidth={2.6} />
        Kart ekle
      </button>
    </section>
  );
}
