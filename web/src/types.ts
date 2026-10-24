export type Card = {
  id: string;
  title: string;
  description: string | null;
  label: string | null;
  dueDate: string | null;
  order: number;
};

export type CardWithColumn = Card & { columnId?: string };

export type Column = {
  id: string;
  title: string;
  order: number;
  cards: Card[];
};

export type Board = { columns: Column[] };

export type ToastTone = 'success' | 'error' | 'info';

export type Toast = {
  id: number;
  message: string;
  tone: ToastTone;
  action?: { label: string; run: () => void };
};

export type CardDraft = {
  title: string;
  description: string;
  label: string;
  dueDate: string;
};

export type ChecklistItem = { id: string; text: string; done: boolean };

export type CardExtra = {
  color: string | null;
  emoji: string | null;
  checklist: ChecklistItem[];
};

export type Extras = Record<string, CardExtra>;

export type SavedFilter = {
  id: string;
  name: string;
  q: string;
  label: string | null;
  overdue: boolean;
};

export type ViewMode = 'board' | 'calendar';
