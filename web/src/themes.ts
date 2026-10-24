export type ThemeId = 'seker' | 'orman' | 'okyanus' | 'gece';

export type ColumnSwatch = { wash: string; accent: string; line: string };

export type Theme = {
  id: ThemeId;
  name: string;
  note: string;
  dark?: boolean;
  tokens: Record<string, string>;
  columns: ColumnSwatch[];
};

export const THEMES: Theme[] = [
  {
    id: 'seker',
    name: 'Şeker',
    note: 'Naneli zemin, canlı bantlar',
    tokens: {
      paper: '#f7fbf4',
      'paper-2': '#ecf5eb',
      'paper-3': '#e0eee1',
      surface: '#fffef9',
      'surface-2': '#ffffff',
      ink: '#1f2a44',
      'ink-2': '#3a4763',
      muted: '#6b7a90',
      faint: '#9aa8ba',
      line: '#dce7da',
      'line-2': '#c9d8c7',
      coral: '#e8365d',
      'coral-soft': '#ffe3ea',
      'on-accent': '#fffaf1',
      'on-strong': '#fffdf6',
      'wash-1': '#ffe0ea',
      'wash-2': '#d6f7ea',
      'wash-3': '#e6e2ff',
      'wash-4': '#fff0c8',
    },
    columns: [
      { wash: '#fff0f4', accent: '#e8365d', line: '#ffc9d7' },
      { wash: '#fff8e1', accent: '#b87300', line: '#ffe3a3' },
      { wash: '#e7faf2', accent: '#0b9b72', line: '#b9eedd' },
      { wash: '#edf1ff', accent: '#3b5bdb', line: '#c7d4ff' },
      { wash: '#f5efff', accent: '#7048e8', line: '#dccfff' },
      { wash: '#ffede1', accent: '#e8590c', line: '#ffd2b8' },
    ],
  },
  {
    id: 'orman',
    name: 'Orman',
    note: 'Kum zemin, toprak tonları',
    tokens: {
      paper: '#faf7ec',
      'paper-2': '#f2edda',
      'paper-3': '#e8e1c8',
      surface: '#fffdf6',
      'surface-2': '#fffef9',
      ink: '#21382b',
      'ink-2': '#3d5546',
      muted: '#6f7f6a',
      faint: '#9caa95',
      line: '#e0dcc4',
      'line-2': '#d0c9a8',
      coral: '#c2410c',
      'coral-soft': '#ffe8d9',
      'on-accent': '#fffaf1',
      'on-strong': '#fffdf6',
      'wash-1': '#f3e7c8',
      'wash-2': '#dfeeda',
      'wash-3': '#efe6cf',
      'wash-4': '#e9efd6',
    },
    columns: [
      { wash: '#e8f5ec', accent: '#2f7d4f', line: '#c4e5cf' },
      { wash: '#fdf3e0', accent: '#b45309', line: '#f2dfb6' },
      { wash: '#e6f6f3', accent: '#0f766e', line: '#bde6df' },
      { wash: '#f1f7e3', accent: '#4d7c0f', line: '#d9eab5' },
      { wash: '#fbf4dd', accent: '#a16207', line: '#eed9a0' },
      { wash: '#fbece5', accent: '#9a3412', line: '#f0cdba' },
    ],
  },
  {
    id: 'okyanus',
    name: 'Okyanus',
    note: 'Serin mavi zemin, net çizgiler',
    tokens: {
      paper: '#f4f9ff',
      'paper-2': '#e8f1fb',
      'paper-3': '#dbe8f7',
      surface: '#ffffff',
      'surface-2': '#fbfdff',
      ink: '#14324f',
      'ink-2': '#2f4d6b',
      muted: '#647c94',
      faint: '#94a9bd',
      line: '#d6e4f2',
      'line-2': '#bfd4e8',
      coral: '#d6336c',
      'coral-soft': '#ffe3ed',
      'on-accent': '#fffaf1',
      'on-strong': '#fffdf6',
      'wash-1': '#dbeafe',
      'wash-2': '#d7f3f7',
      'wash-3': '#e4e3fb',
      'wash-4': '#fdf0cf',
    },
    columns: [
      { wash: '#e9f3fc', accent: '#1d6fb8', line: '#c4dff5' },
      { wash: '#e4f6f9', accent: '#0e7490', line: '#b7e5ee' },
      { wash: '#e5f5f1', accent: '#0f766e', line: '#bbe5db' },
      { wash: '#efedfd', accent: '#5b4bdb', line: '#d3cdf7' },
      { wash: '#fdf3e0', accent: '#b45309', line: '#f2dfb6' },
      { wash: '#fde8ee', accent: '#be123c', line: '#f7c9d6' },
    ],
  },
  {
    id: 'gece',
    name: 'Gece',
    note: 'Koyu zemin, neon vurgular',
    dark: true,
    tokens: {
      paper: '#0f141d',
      'paper-2': '#161d28',
      'paper-3': '#1e2734',
      surface: '#18202c',
      'surface-2': '#1f2937',
      ink: '#eef3f9',
      'ink-2': '#c7d2e0',
      muted: '#93a1b3',
      faint: '#6f7f92',
      line: '#263041',
      'line-2': '#354256',
      coral: '#ff6b8a',
      'coral-soft': '#3a2030',
      'on-accent': '#0f172a',
      'on-strong': '#0f141d',
      'wash-1': '#2a1520',
      'wash-2': '#122a26',
      'wash-3': '#1d1a33',
      'wash-4': '#2a2414',
    },
    columns: [
      { wash: '#2a1a23', accent: '#ff5c7c', line: '#462430' },
      { wash: '#2a2418', accent: '#f0a52a', line: '#463a1d' },
      { wash: '#122a25', accent: '#2dd4a7', line: '#1d4a41' },
      { wash: '#172236', accent: '#6b9bf5', line: '#283c5e' },
      { wash: '#211b33', accent: '#a78bfa', line: '#372c52' },
      { wash: '#2a1e18', accent: '#ff8a4c', line: '#46301f' },
    ],
  },
];

export const THEME_KEY = 'pano-tema';

let active: Theme = THEMES[0];

export function activeTheme(): Theme {
  return active;
}

export function resolveTheme(id: string | null | undefined): Theme {
  return THEMES.find((theme) => theme.id === id) ?? THEMES[0];
}

export function storedTheme(): Theme {
  try {
    return resolveTheme(localStorage.getItem(THEME_KEY));
  } catch {
    return THEMES[0];
  }
}

export function applyTheme(theme: Theme): void {
  active = theme;
  const root = document.documentElement;
  for (const [token, value] of Object.entries(theme.tokens)) {
    root.style.setProperty(`--color-${token}`, value);
  }
  root.style.colorScheme = theme.dark ? 'dark' : 'light';
  try {
    localStorage.setItem(THEME_KEY, theme.id);
  } catch {
    /* gizli mod: tema yine uygulanır */
  }
}
