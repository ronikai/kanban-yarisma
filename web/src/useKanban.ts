import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import type { Board, Card, CardExtra, Extras, Toast } from './types';

const KEY = ['board'] as const;
const EXTRAS_KEY = ['extras'] as const;
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const uid = () => crypto.randomUUID();

export function fold(value: string): string {
  return value
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function findCard(board: Board, cardId: string) {
  for (const column of board.columns) {
    const card = column.cards.find((item) => item.id === cardId);
    if (card) return { card, column };
  }
  return null;
}

type Notify = (toast: Omit<Toast, 'id'>) => void;

type CardInput = {
  columnId: string;
  title: string;
  description?: string | null;
  label?: string | null;
  dueDate?: string | null;
};

type CardPatch = {
  title?: string;
  description?: string | null;
  label?: string | null;
  dueDate?: string | null;
};

function moveInBoard(
  board: Board,
  vars: { cardId: string; toColumnId: string; toIndex: number },
): Board {
  let moving: Card | undefined;
  let sourceId: string | undefined;

  for (const column of board.columns) {
    const index = column.cards.findIndex((card) => card.id === vars.cardId);
    if (index >= 0) {
      moving = column.cards.splice(index, 1)[0];
      sourceId = column.id;
      break;
    }
  }
  const target = board.columns.find((column) => column.id === vars.toColumnId);
  if (!moving || !target) return board;

  target.cards.splice(Math.max(0, Math.min(vars.toIndex, target.cards.length)), 0, moving);
  for (const column of board.columns) {
    if (column.id === target.id || column.id === sourceId) {
      column.cards.forEach((card, index) => {
        card.order = index;
      });
    }
  }
  return board;
}

export function useKanban(notify: Notify) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: KEY,
    queryFn: api.getBoard,
    retry: 1,
    staleTime: 2000,
  });

  const board = query.data;

  const extrasQuery = useQuery({
    queryKey: EXTRAS_KEY,
    queryFn: api.getExtras,
    retry: 1,
    staleTime: 5000,
  });
  const extras: Extras = extrasQuery.data ?? {};

  const [search, setSearch] = useState('');
  const [labelFilter, setLabelFilter] = useState<string | null>(null);
  const [overdueOnly, setOverdueOnly] = useState(false);

  const setBoard = useCallback(
    (updater: (current: Board) => Board) => {
      queryClient.setQueryData<Board>(KEY, (current) =>
        current ? updater(clone(current)) : current,
      );
    },
    [queryClient],
  );

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: KEY });
  }, [queryClient]);

  const invalidateExtras = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: EXTRAS_KEY });
  }, [queryClient]);

  const setExtraLocal = useCallback(
    (cardId: string, updater: (extra: CardExtra) => CardExtra) => {
      queryClient.setQueryData<Extras>(EXTRAS_KEY, (current) => {
        const base = current ?? {};
        const extra = base[cardId] ?? { color: null, emoji: null, checklist: [] };
        return { ...base, [cardId]: updater(extra) };
      });
    },
    [queryClient],
  );

  const fail = useCallback(
    (error: unknown) => {
      notify({
        tone: 'error',
        message:
          error instanceof Error ? error.message : 'Beklenmeyen bir hata oldu',
      });
    },
    [notify],
  );

  const createCard = useMutation({
    mutationFn: (input: CardInput) => api.createCard(input),
    onMutate: (input) => {
      const temp: Card = {
        id: `tmp-${uid()}`,
        title: input.title,
        description: input.description ?? null,
        label: input.label ?? null,
        dueDate: input.dueDate ?? null,
        order: 0,
      };
      setBoard((current) => {
        const column = current.columns.find((item) => item.id === input.columnId);
        if (column) {
          temp.order = column.cards.length;
          column.cards.push(temp);
        }
        return current;
      });
      return { tempId: temp.id };
    },
    onError: (error, _input, context) => {
      setBoard((current) => {
        current.columns.forEach((column) => {
          column.cards = column.cards.filter((card) => card.id !== context?.tempId);
        });
        return current;
      });
      fail(error);
    },
    onSuccess: () => notify({ tone: 'success', message: 'Kart eklendi' }),
    onSettled: invalidate,
  });

  const updateCard = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: CardPatch }) =>
      api.updateCard(id, patch),
    onMutate: ({ id, patch }) => {
      setBoard((current) => {
        for (const column of current.columns) {
          const card = column.cards.find((item) => item.id === id);
          if (!card) continue;
          if (patch.title !== undefined) card.title = patch.title;
          if (patch.description !== undefined) card.description = patch.description;
          if (patch.label !== undefined) card.label = patch.label;
          if (patch.dueDate !== undefined) card.dueDate = patch.dueDate;
          break;
        }
        return current;
      });
    },
    onError: (error) => fail(error),
    onSettled: invalidate,
  });

  const deleteCard = useMutation({
    mutationFn: (input: { card: Card; columnId: string; index: number }) =>
      api.deleteCard(input.card.id),
    onMutate: ({ card }) => {
      setBoard((current) => {
        current.columns.forEach((column) => {
          column.cards = column.cards.filter((item) => item.id !== card.id);
          column.cards.forEach((item, index) => {
            item.order = index;
          });
        });
        return current;
      });
    },
    onSuccess: (_data, input) => {
      notify({
        tone: 'info',
        message: `"${input.card.title}" silindi`,
        action: {
          label: 'Geri al',
          run: () => {
            void (async () => {
              try {
                const created = await api.createCard({
                  columnId: input.columnId,
                  title: input.card.title,
                  description: input.card.description,
                  label: input.card.label,
                  dueDate: input.card.dueDate,
                });
                await api.moveCard(created.id, input.columnId, input.index);
                notify({ tone: 'success', message: 'Kart geri getirildi' });
              } catch (error) {
                fail(error);
              } finally {
                invalidate();
              }
            })();
          },
        },
      });
    },
    onError: (error) => fail(error),
    onSettled: invalidate,
  });

  const moveCard = useMutation({
    mutationFn: (input: { cardId: string; toColumnId: string; toIndex: number }) =>
      api.moveCard(input.cardId, input.toColumnId, input.toIndex),
    onMutate: (input) => {
      setBoard((current) => moveInBoard(current, input));
    },
    onError: (error) => fail(error),
    onSettled: invalidate,
  });

  const createColumn = useMutation({
    mutationFn: (title: string) => api.createColumn(title),    onMutate: (title) => {
      const tempId = `tmp-${uid()}`;
      setBoard((current) => {
        current.columns.push({
          id: tempId,
          title,
          order: current.columns.length,
          cards: [],
        });
        return current;
      });
      return { tempId };
    },
    onError: (error, _title, context) => {
      setBoard((current) => {
        current.columns = current.columns.filter(
          (column) => column.id !== context?.tempId,
        );
        return current;
      });
      fail(error);
    },
    onSuccess: () => notify({ tone: 'success', message: 'Kolon eklendi' }),
    onSettled: invalidate,
  });

  const deleteColumn = useMutation({
    mutationFn: (columnId: string) => api.deleteColumn(columnId),
    onMutate: (columnId) => {
      setBoard((current) => {
        current.columns = current.columns
          .filter((column) => column.id !== columnId)
          .map((column, index) => ({ ...column, order: index }));
        return current;
      });
    },
    onSuccess: () => notify({ tone: 'info', message: 'Kolon ve kartları silindi' }),
    onError: (error) => fail(error),
    onSettled: invalidate,
  });

  const updateColumn = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      api.updateColumn(id, { title }),
    onMutate: ({ id, title }) => {
      setBoard((current) => {
        const column = current.columns.find((item) => item.id === id);
        if (column) column.title = title;
        return current;
      });
    },
    onSuccess: () => notify({ tone: 'success', message: 'Kolon adı güncellendi' }),
    onError: (error) => fail(error),
    onSettled: invalidate,
  });

  const importBoard = useMutation({
    mutationFn: (next: Board) => api.importBoard(next),
    onSuccess: (data) => {
      queryClient.setQueryData(KEY, data.board);
      void queryClient.invalidateQueries({ queryKey: EXTRAS_KEY });
      notify({ tone: 'success', message: 'Pano içe aktarıldı' });
    },
    onError: (error) => fail(error),
  });

  const setCardMeta = useMutation({
    mutationFn: ({
      id,
      ...patch
    }: {
      id: string;
      color?: string | null;
      emoji?: string | null;
    }) => api.setCardMeta(id, patch),
    onSuccess: (extra, vars) => setExtraLocal(vars.id, () => extra),
    onError: (error) => fail(error),
  });

  const addChecklist = useMutation({
    mutationFn: ({ cardId, text }: { cardId: string; text: string }) =>
      api.addChecklistItem(cardId, text),
    onSuccess: (item, vars) =>
      setExtraLocal(vars.cardId, (extra) => ({
        ...extra,
        checklist: [...extra.checklist, item],
      })),
    onError: (error) => fail(error),
  });

  const toggleChecklist = useMutation({
    mutationFn: ({ itemId, done }: { itemId: string; done: boolean }) =>
      api.updateChecklistItem(itemId, { done }),
    onMutate: ({ itemId, done }) => {
      queryClient.setQueryData<Extras>(EXTRAS_KEY, (current) => {
        if (!current) return current;
        const next: Extras = {};
        for (const [cardId, extra] of Object.entries(current)) {
          next[cardId] = {
            ...extra,
            checklist: extra.checklist.map((item) =>
              item.id === itemId ? { ...item, done } : item,
            ),
          };
        }
        return next;
      });
    },
    onError: (error) => {
      fail(error);
      invalidateExtras();
    },
  });

  const deleteChecklist = useMutation({
    mutationFn: ({ itemId }: { cardId: string; itemId: string }) =>
      api.deleteChecklistItem(itemId),
    onSuccess: (_data, vars) =>
      setExtraLocal(vars.cardId, (extra) => ({
        ...extra,
        checklist: extra.checklist.filter((item) => item.id !== vars.itemId),
      })),
    onError: (error) => fail(error),
  });

  const labels = useMemo(() => {
    if (!board) return [] as string[];
    const set = new Set<string>();
    board.columns.forEach((column) =>
      column.cards.forEach((card) => {
        if (card.label) set.add(card.label);
      }),
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [board]);

  const visible = useMemo(() => {
    if (!board) return undefined;
    const needle = fold(search.trim());
    const wanted = labelFilter ? fold(labelFilter) : '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!needle && !wanted && !overdueOnly) return board;

    return {
      columns: board.columns.map((column) => ({
        ...column,
        cards: column.cards.filter((card) => {
          if (wanted && fold(card.label ?? '') !== wanted) return false;
          if (overdueOnly) {
            if (!card.dueDate) return false;
            const due = new Date(card.dueDate);
            if (Number.isNaN(due.getTime()) || due >= today) return false;
          }
          if (!needle) return true;
          return fold(
            `${card.title} ${card.description ?? ''} ${card.label ?? ''}`,
          ).includes(needle);
        }),
      })),
    };
  }, [board, search, labelFilter, overdueOnly]);

  const matchCount =
    visible?.columns.reduce((total, column) => total + column.cards.length, 0) ?? 0;

  const isFiltering = Boolean(search.trim() || labelFilter || overdueOnly);
  const activeCount = board?.columns.length ?? 0;

  return {
    board,
    visible,
    labels,
    extras,
    matchCount,
    isFiltering,
    activeCount,
    search,
    setSearch,
    labelFilter,
    setLabelFilter,
    overdueOnly,
    setOverdueOnly,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    createCard,
    updateCard,
    deleteCard,
    moveCard,
    createColumn,
    updateColumn,
    deleteColumn,
    importBoard,
    setCardMeta,
    addChecklist,
    toggleChecklist,
    deleteChecklist,
  };
}

export type Kanban = ReturnType<typeof useKanban>;
