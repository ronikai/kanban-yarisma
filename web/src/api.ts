import type {
  Board,
  Card,
  CardExtra,
  CardWithColumn,
  ChecklistItem,
  Column,
  Extras,
} from './types';

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(BASE + path, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data?.error?.message ?? `İstek başarısız (${response.status})`,
    );
  }
  return data as T;
}

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  body: body === undefined ? undefined : JSON.stringify(body),
});

export const api = {
  getBoard: () => request<Board>('/api/board'),

  createColumn: (title: string) =>
    request<Column>('/api/columns', json('POST', { title })),

  updateColumn: (id: string, patch: { title?: string; order?: number }) =>
    request<Column>(`/api/columns/${id}`, json('PATCH', patch)),

  deleteColumn: (id: string) => request<void>(`/api/columns/${id}`, json('DELETE')),

  createCard: (input: {
    columnId: string;
    title: string;
    description?: string | null;
    label?: string | null;
    dueDate?: string | null;
  }) => request<CardWithColumn>('/api/cards', json('POST', input)),

  updateCard: (
    id: string,
    patch: {
      title?: string;
      description?: string | null;
      label?: string | null;
      dueDate?: string | null;
    },
  ) => request<CardWithColumn>(`/api/cards/${id}`, json('PATCH', patch)),

  deleteCard: (id: string) => request<void>(`/api/cards/${id}`, json('DELETE')),

  moveCard: (id: string, toColumnId: string, toIndex: number) =>
    request<CardWithColumn>(
      `/api/cards/${id}/move`,
      json('POST', { toColumnId, toIndex }),
    ),

  searchCards: (q: string, label: string) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (label) params.set('label', label);
    return request<{ cards: CardWithColumn[] }>(`/api/cards?${params.toString()}`);
  },

  exportBoard: () => request<{ board: Board }>('/api/export'),

  importBoard: (board: Board) =>
    request<{ board: Board }>('/api/import', json('POST', { board })),

  getExtras: () => request<Extras>('/api/extras'),

  setCardMeta: (id: string, patch: { color?: string | null; emoji?: string | null }) =>
    request<CardExtra>(`/api/cards/${id}/meta`, json('PATCH', patch)),

  addChecklistItem: (cardId: string, text: string) =>
    request<ChecklistItem>(`/api/cards/${cardId}/checklist`, json('POST', { text })),

  updateChecklistItem: (id: string, patch: { text?: string; done?: boolean }) =>
    request<ChecklistItem>(`/api/checklist/${id}`, json('PATCH', patch)),

  deleteChecklistItem: (id: string) =>
    request<void>(`/api/checklist/${id}`, json('DELETE')),
};

export type { Board, Card, CardExtra, ChecklistItem, Column, Extras };
