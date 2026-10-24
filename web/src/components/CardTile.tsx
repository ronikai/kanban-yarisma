import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import { CalendarDays, GripVertical, Trash2 } from 'lucide-react';
import { dueInfo, labelSwatch } from '../design';
import type { Card } from '../types';

type Props = {
  card: Card;
  columnId: string;
  onOpen?: (card: Card, columnId: string) => void;
  onDelete?: (card: Card, columnId: string, index: number) => void;
  index?: number;
};

function CardBody({
  card,
  onDelete,
  grip = true,
}: {
  card: Card;
  onDelete?: () => void;
  grip?: boolean;
}) {
  const swatch = card.label ? labelSwatch(card.label) : null;
  const due = dueInfo(card.dueDate);

  return (
    <>
      <div className="flex items-start gap-2">
        {swatch ? (
          <span
            className="inline-flex max-w-[150px] items-center gap-1.5 truncate rounded-md px-2 py-[3px] text-[11px] font-bold tracking-wide"
            style={{ background: swatch.bg, color: swatch.fg }}
          >
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: swatch.dot }}
            />
            <span className="truncate">{card.label}</span>
          </span>
        ) : (
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
            etiketsiz
          </span>
        )}

        <span className="ml-auto flex items-center gap-0.5">
          {onDelete && (
            <button
              type="button"
              aria-label={`${card.title} kartını sil`}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                onDelete();
              }}
              className="grid h-6 w-6 place-items-center rounded-md text-faint opacity-0 transition hover:bg-coral-soft hover:text-coral focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-coral group-hover:opacity-100"
            >
              <Trash2 size={13} strokeWidth={2.2} />
            </button>
          )}
          {grip && (
            <span
              aria-hidden="true"
              className="grid h-6 w-5 cursor-grab place-items-center rounded text-faint/70 transition group-hover:text-muted active:cursor-grabbing"
            >
              <GripVertical size={14} strokeWidth={2.2} />
            </span>
          )}
        </span>
      </div>

      <h3 className="card-clamp mt-2 font-display text-[15px] font-bold leading-snug tracking-[-0.01em] text-ink">
        {card.title}
      </h3>

      {card.description && (
        <p className="card-clamp-2 mt-1 text-[12.5px] leading-relaxed text-muted">
          {card.description}
        </p>
      )}

      <div className="mt-2.5 flex items-center justify-end gap-1.5">
        {due && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 font-mono text-[10px] font-bold ${
              due.overdue
                ? 'bg-coral-soft text-coral'
                : due.soon
                  ? 'bg-amber-soft text-amber'
                  : 'bg-paper-2 text-muted'
            }`}
            title={`Son tarih: ${due.title}`}
          >
            <CalendarDays size={11} strokeWidth={2.6} />
            {due.label}
            {due.overdue && <span className="font-sans">gecikti</span>}
          </span>
        )}
        <span className="font-mono text-[10px] font-bold text-faint/70">
          {String((card.order ?? 0) + 1).padStart(2, '0')}
        </span>
      </div>
    </>
  );
}

export function CardTile({ card, columnId, onOpen, onDelete, index = 0 }: Props) {
  const sortable = useSortable({
    id: card.id,
    data: { type: 'card', columnId, card },
  });

  const style = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
    opacity: sortable.isDragging ? 0.3 : 1,
    zIndex: sortable.isDragging ? 10 : undefined,
  };

  return (
    <article
      ref={sortable.setNodeRef}
      style={style}
      {...sortable.attributes}
      {...sortable.listeners}
      role="button"
      tabIndex={0}
      aria-label={`${card.title} kartını aç`}
      onClick={() => onOpen?.(card, columnId)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen?.(card, columnId);
        }
      }}
      className="group relative cursor-grab select-none rounded-[14px] border-[1.5px] border-line bg-surface p-3 shadow-[0_1px_0_rgba(31,42,68,0.04)] transition-[box-shadow,border-color] duration-200 hover:border-ink/20 hover:shadow-lift focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral active:cursor-grabbing"
    >
      <CardBody
        card={card}
        onDelete={onDelete ? () => onDelete(card, columnId, index) : undefined}
      />
    </article>
  );
}

export function CardPreview({ card }: { card: Card }) {
  return (
    <div className="w-[280px] rotate-[2.5deg] rounded-[14px] border-2 border-ink/20 bg-surface p-3 shadow-float">
      <CardBody card={card} grip={false} />
    </div>
  );
}
