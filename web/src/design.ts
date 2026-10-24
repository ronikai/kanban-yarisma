import { activeTheme, type ColumnSwatch } from './themes';

export type Swatch = { bg: string; fg: string; dot: string; line: string };

export function labelSwatch(label: string): Swatch {
  let hash = 0;
  for (const char of label) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  const column = columnSwatch(hash);
  return {
    bg: column.wash,
    fg: activeTheme().dark
      ? `color-mix(in srgb, ${column.accent} 72%, #ffffff)`
      : `color-mix(in srgb, ${column.accent} 76%, #101828)`,
    dot: column.accent,
    line: column.line,
  };
}

export function columnSwatch(index: number): ColumnSwatch {
  const columns = activeTheme().columns;
  return columns[index % columns.length];
}

export type DueInfo = {
  label: string;
  overdue: boolean;
  soon: boolean;
  title: string;
};

export function dueInfo(value: string | null): DueInfo | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  const diff = Math.round((day.getTime() - today.getTime()) / 86_400_000);

  const label = date.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'short',
  });
  const title = date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return {
    label: diff === 0 ? `Bugün · ${label}` : label,
    overdue: diff < 0,
    soon: diff >= 0 && diff <= 2,
    title,
  };
}

export function formatDueForInput(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

export function dueToIso(value: string): string | null {
  if (!value) return null;
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
