import { AlertTriangle, CalendarClock, CheckSquare2, LayoutGrid } from 'lucide-react';

type Props = {
  total: number;
  overdue: number;
  dueSoon: number;
  checklistDone: number;
  checklistTotal: number;
};

function Tile({
  icon,
  label,
  value,
  tone,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-line/80 bg-surface/70 px-3 py-2.5">
      <span
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
        style={{ background: tone, color: 'var(--color-on-accent)' }}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10.5px] font-semibold text-muted">{label}</p>
        <p className="font-display text-[15px] font-semibold leading-tight text-ink">
          {value}
        </p>
        {children}
      </div>
    </div>
  );
}

export function StatsBar({
  total,
  overdue,
  dueSoon,
  checklistDone,
  checklistTotal,
}: Props) {
  const progress = checklistTotal
    ? Math.round((checklistDone / checklistTotal) * 100)
    : 0;

  return (
    <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Tile
        icon={<LayoutGrid size={15} />}
        label="Toplam kart"
        value={`${total}`}
        tone="var(--color-sky)"
      />
      <Tile
        icon={<AlertTriangle size={15} />}
        label="Geciken"
        value={`${overdue}`}
        tone="var(--color-coral)"
      />
      <Tile
        icon={<CalendarClock size={15} />}
        label="Bu hafta"
        value={`${dueSoon}`}
        tone="var(--color-amber)"
      />
      <Tile
        icon={<CheckSquare2 size={15} />}
        label="Alt görev"
        value={`${checklistDone}/${checklistTotal}`}
        tone="var(--color-mint)"
      >
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-paper-2">
          <div
            className="h-full rounded-full bg-mint transition-[width] duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </Tile>
    </div>
  );
}
