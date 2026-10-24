import { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3 } from 'lucide-react';
import { labelSwatch } from '../design';
import type { Board, Card } from '../types';

type Props = {
  board: Board;
  onOpenCard: (card: Card, columnId: string) => void;
};

type Placed = { card: Card; columnId: string; columnTitle: string };

const DAY = 86_400_000;
const startOfDay = (value: Date) =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate());

const keyOf = (value: Date) =>
  `${value.getFullYear()}-${value.getMonth()}-${value.getDate()}`;

export function CalendarView({ board, onOpenCard }: Props) {
  const [cursor, setCursor] = useState(() => new Date());
  const today = startOfDay(new Date());

  const placed = useMemo(() => {
    const map = new Map<string, Placed[]>();
    let undated = 0;
    for (const column of board.columns) {
      for (const card of column.cards) {
        if (!card.dueDate) {
          undated += 1;
          continue;
        }
        const date = new Date(card.dueDate);
        if (Number.isNaN(date.getTime())) {
          undated += 1;
          continue;
        }
        const key = keyOf(startOfDay(date));
        const list = map.get(key) ?? [];
        list.push({ card, columnId: column.id, columnTitle: column.title });
        map.set(key, list);
      }
    }
    for (const list of map.values()) {
      list.sort((a, b) => (a.card.title > b.card.title ? 1 : -1));
    }
    return { map, undated };
  }, [board]);

  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(first.getTime() - offset * DAY);
  const cells = Array.from({ length: 42 }, (_, index) =>
    new Date(start.getTime() + index * DAY),
  );

  const monthLabel = cursor.toLocaleDateString('tr-TR', {
    month: 'long',
    year: 'numeric',
  });

  const shift = (delta: number) =>
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1));

  const upcoming = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today.getTime() + index * DAY);
    return { date, items: placed.map.get(keyOf(date)) ?? [] };
  });

  const weekdays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  return (
    <div className="animate-rise">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2 className="font-display text-[19px] font-semibold capitalize text-ink">
          {monthLabel}
        </h2>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="mr-1 hidden items-center gap-1.5 rounded-lg border border-line/80 bg-surface/70 px-2.5 py-1.5 text-[11px] font-semibold text-muted sm:inline-flex">
            <CalendarDays size={13} />
            {placed.undated} tarihsiz kart
          </span>
          <button
            type="button"
            aria-label="Önceki ay"
            onClick={() => shift(-1)}
            className="grid h-9 w-9 place-items-center rounded-lg border border-line-2 bg-surface text-ink-2 transition hover:border-ink/25"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => setCursor(new Date())}
            className="rounded-lg border border-line-2 bg-surface px-3 py-2 text-[12px] font-bold text-ink-2 transition hover:border-ink/25"
          >
            Bugün
          </button>
          <button
            type="button"
            aria-label="Sonraki ay"
            onClick={() => shift(1)}
            className="grid h-9 w-9 place-items-center rounded-lg border border-line-2 bg-surface text-ink-2 transition hover:border-ink/25"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line/80 bg-surface/60 p-2 shadow-lift">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-7 gap-1">
            {weekdays.map((day) => (
              <div
                key={day}
                className="px-2 py-1.5 text-[10.5px] font-extrabold text-faint"
              >
                {day}
              </div>
            ))}
            {cells.map((date) => {
              const key = keyOf(date);
              const items = placed.map.get(key) ?? [];
              const inMonth = date.getMonth() === cursor.getMonth();
              const isToday = keyOf(date) === keyOf(today);
              return (
                <div
                  key={key}
                  className={`min-h-[104px] rounded-xl border p-1.5 transition ${
                    isToday
                      ? 'border-coral/50 bg-coral-soft/40'
                      : 'border-line/70 bg-surface/70'
                  } ${inMonth ? '' : 'opacity-45'}`}
                >
                  <div className="mb-1 flex items-center justify-between px-0.5">
                    <span
                      className={`text-[11px] font-bold ${
                        isToday ? 'text-coral' : 'text-muted'
                      }`}
                    >
                      {date.getDate()}
                    </span>
                    {items.length > 0 && (
                      <span className="font-mono text-[9.5px] font-bold text-faint">
                        {items.length}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {items.slice(0, 3).map(({ card, columnId }) => {
                      const swatch = labelSwatch(card.label ?? '');
                      return (
                        <button
                          key={card.id}
                          type="button"
                          onClick={() => onOpenCard(card, columnId)}
                          className="block w-full truncate rounded-md px-1.5 py-1 text-left text-[10.5px] font-semibold transition hover:brightness-95"
                          style={{ background: swatch.bg, color: swatch.fg }}
                          title={card.title}
                        >
                          {card.title}
                        </button>
                      );
                    })}
                    {items.length > 3 && (
                      <span className="block px-1 text-[9.5px] font-bold text-faint">
                        +{items.length - 3} kart
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-line/80 bg-surface/60 p-3">
        <p className="flex items-center gap-1.5 text-[12px] font-extrabold text-ink-2">
          <Clock3 size={13} /> Önümüzdeki 7 gün
        </p>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {upcoming.map(({ date, items }) => (
            <div
              key={keyOf(date)}
              className="flex items-start gap-2 rounded-xl border border-line/70 bg-surface/70 px-2.5 py-2"
            >
              <span className="w-20 shrink-0 text-[11px] font-bold text-muted">
                {date.toLocaleDateString('tr-TR', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
              <div className="min-w-0 flex-1 space-y-1">
                {items.length === 0 && (
                  <span className="text-[11px] text-faint">Boş</span>
                )}
                {items.map(({ card, columnId }) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => onOpenCard(card, columnId)}
                    className="block w-full truncate rounded-md px-1.5 py-1 text-left text-[11px] font-semibold text-ink transition hover:bg-paper-2"
                  >
                    {card.title}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
