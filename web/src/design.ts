export type Swatch = { bg: string; fg: string; dot: string; line: string };

const LABEL_SWATCHES: Swatch[] = [
  { bg: '#ffe3ea', fg: '#a30d33', dot: '#e8365d', line: '#ffc3d3' },
  { bg: '#fff1cc', fg: '#7a4b00', dot: '#e8930c', line: '#ffe1a0' },
  { bg: '#d6f5e9', fg: '#06614a', dot: '#0b9b72', line: '#b2eeda' },
  { bg: '#e3e9ff', fg: '#1e3a9e', dot: '#3b5bdb', line: '#c7d4ff' },
  { bg: '#ede6ff', fg: '#4322a8', dot: '#7048e8', line: '#d8c9ff' },
  { bg: '#ffe0ec', fg: '#8c0f42', dot: '#c2255c', line: '#ffc2d8' },
];

const COLUMN_SWATCHES = [
  { wash: '#fff0f4', accent: '#e8365d', line: '#ffc9d7' },
  { wash: '#fff8e1', accent: '#b87300', line: '#ffe3a3' },
  { wash: '#e7faf2', accent: '#0b9b72', line: '#b9eedd' },
  { wash: '#edf1ff', accent: '#3b5bdb', line: '#c7d4ff' },
  { wash: '#f5efff', accent: '#7048e8', line: '#dccfff' },
  { wash: '#ffede1', accent: '#e8590c', line: '#ffd2b8' },
];

export function labelSwatch(label: string): Swatch {
  let hash = 0;
  for (const char of label) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return LABEL_SWATCHES[hash % LABEL_SWATCHES.length];
}

export function columnSwatch(index: number) {
  return COLUMN_SWATCHES[index % COLUMN_SWATCHES.length];
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
