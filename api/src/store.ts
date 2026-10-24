import { randomUUID } from 'node:crypto';
import { db } from './db.js';
import { notFound, badRequest } from './http.js';

export type Card = {
  id: string;
  title: string;
  description: string | null;
  label: string | null;
  dueDate: string | null;
  order: number;
};

export type CardWithColumn = Card & { columnId: string };

export type Column = {
  id: string;
  title: string;
  order: number;
  cards: Card[];
};

export type Board = { columns: Column[] };

type ColumnRow = { id: string; title: string; order: number };
type CardRow = Card & { columnId: string };

/* ----------------------------- okuma ----------------------------- */

const columnsStmt = db.prepare(
  'SELECT id, title, ord AS "order" FROM board_columns ORDER BY ord ASC, rowid ASC',
);
const cardsStmt = db.prepare(
  `SELECT id, column_id AS columnId, title, description, label,
          due_date AS dueDate, ord AS "order"
   FROM board_cards ORDER BY ord ASC, rowid ASC`,
);
const columnStmt = db.prepare(
  'SELECT id, title, ord AS "order" FROM board_columns WHERE id = ?',
);
const cardStmt = db.prepare(
  `SELECT id, column_id AS columnId, title, description, label,
          due_date AS dueDate, ord AS "order"
   FROM board_cards WHERE id = ?`,
);

function toCard(row: CardRow): Card {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? null,
    label: row.label ?? null,
    dueDate: row.dueDate ?? null,
    order: row.order,
  };
}

export function getBoard(): Board {
  const columns = columnsStmt.all() as ColumnRow[];
  const cards = cardsStmt.all() as CardRow[];
  return {
    columns: columns.map((col) => ({
      id: col.id,
      title: col.title,
      order: col.order,
      cards: cards.filter((c) => c.columnId === col.id).map(toCard),
    })),
  };
}

export function getColumn(id: string): Column | null {
  const col = columnStmt.get(id) as ColumnRow | undefined;
  if (!col) return null;
  const cards = (cardsStmt.all() as CardRow[]).filter((c) => c.columnId === id);
  return { id: col.id, title: col.title, order: col.order, cards: cards.map(toCard) };
}

export function getCard(id: string): CardWithColumn | null {
  const row = cardStmt.get(id) as CardRow | undefined;
  return row ? { ...toCard(row), columnId: row.columnId } : null;
}

/* ----------------------------- yardımcı ----------------------------- */

function nextColumnOrder(): number {
  const row = db.prepare('SELECT COALESCE(MAX(ord), -1) AS m FROM board_columns').get() as {
    m: number;
  };
  return row.m + 1;
}

function nextCardOrder(columnId: string): number {
  const row = db
    .prepare('SELECT COALESCE(MAX(ord), -1) AS m FROM board_cards WHERE column_id = ?')
    .get(columnId) as { m: number };
  return row.m + 1;
}

function renumberColumns(): void {
  const ids = (columnsStmt.all() as ColumnRow[]).map((c) => c.id);
  const update = db.prepare('UPDATE board_columns SET ord = ? WHERE id = ?');
  ids.forEach((id, index) => update.run(index, id));
}

function renumberColumnCards(columnId: string, orderedIds: string[]): void {
  const update = db.prepare('UPDATE board_cards SET ord = ? WHERE id = ?');
  orderedIds.forEach((id, index) => update.run(index, id));
}

/* ----------------------------- mutasyonlar ----------------------------- */

export function createColumn(title: string): Column {
  const id = randomUUID();
  db.prepare('INSERT INTO board_columns (id, title, ord) VALUES (?, ?, ?)').run(
    id,
    title,
    nextColumnOrder(),
  );
  return getColumn(id)!;
}

export function updateColumn(
  id: string,
  patch: { title?: string; order?: number },
): Column | null {
  if (!columnStmt.get(id)) return null;

  if (patch.title !== undefined) {
    db.prepare('UPDATE board_columns SET title = ? WHERE id = ?').run(patch.title, id);
  }
  if (patch.order !== undefined) {
    const rest = (columnsStmt.all() as ColumnRow[])
      .map((c) => c.id)
      .filter((cid) => cid !== id);
    const index = Math.max(0, Math.min(patch.order, rest.length));
    rest.splice(index, 0, id);
    rest.forEach((cid, i) =>
      db.prepare('UPDATE board_columns SET ord = ? WHERE id = ?').run(i, cid),
    );
  }
  return getColumn(id);
}

export function deleteColumn(id: string): boolean {
  const result = db.prepare('DELETE FROM board_columns WHERE id = ?').run(id);
  if (result.changes === 0) return false;
  renumberColumns();
  return true;
}

export type NewCardInput = {
  columnId: string;
  title: string;
  description?: string | null;
  label?: string | null;
  dueDate?: string | null;
};

export function createCard(input: NewCardInput): CardWithColumn {
  if (!columnStmt.get(input.columnId)) {
    throw notFound('Kolon bulunamadı');
  }
  const id = randomUUID();
  db.prepare(
    `INSERT INTO board_cards (id, column_id, title, description, label, due_date, ord)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    input.columnId,
    input.title,
    input.description ?? null,
    input.label ?? null,
    input.dueDate ?? null,
    nextCardOrder(input.columnId),
  );
  return getCard(id)!;
}

export type CardPatch = {
  title?: string;
  description?: string | null;
  label?: string | null;
  dueDate?: string | null;
};

export function updateCard(id: string, patch: CardPatch): CardWithColumn | null {
  if (!getCard(id)) return null;
  const sets: string[] = [];
  const values: (string | null)[] = [];
  const map: Record<keyof CardPatch, string> = {
    title: 'title',
    description: 'description',
    label: 'label',
    dueDate: 'due_date',
  };
  (Object.keys(map) as (keyof CardPatch)[]).forEach((key) => {
    if (patch[key] !== undefined) {
      sets.push(`${map[key]} = ?`);
      values.push(patch[key] as string | null);
    }
  });
  if (sets.length > 0) {
    db.prepare(`UPDATE board_cards SET ${sets.join(', ')} WHERE id = ?`).run(
      ...values,
      id,
    );
  }
  return getCard(id);
}

export function deleteCard(id: string): boolean {
  const card = getCard(id);
  if (!card) return false;
  db.prepare('DELETE FROM board_cards WHERE id = ?').run(id);
  /* kalan kartların sırası boşluksuz kalsın */
  const remaining = (cardsStmt.all() as CardRow[])
    .filter((row) => row.columnId === card.columnId)
    .map((row) => row.id);
  renumberColumnCards(card.columnId, remaining);
  return true;
}

export function moveCard(id: string, toColumnId: string, toIndex: number): CardWithColumn {
  const card = getCard(id);
  if (!card) throw notFound('Kart bulunamadı');
  if (!columnStmt.get(toColumnId)) throw notFound('Kolon bulunamadı');

  const sameColumn = card.columnId === toColumnId;
  const sourceIds = (cardsStmt.all() as CardRow[])
    .filter((c) => c.columnId === card.columnId && c.id !== id)
    .map((c) => c.id);
  const targetIds = sameColumn
    ? sourceIds
    : (cardsStmt.all() as CardRow[])
        .filter((c) => c.columnId === toColumnId)
        .map((c) => c.id);

  if (toIndex > targetIds.length) {
    throw badRequest('toIndex aralık dışında');
  }

  db.exec('BEGIN');
  try {
    db.prepare('UPDATE board_cards SET column_id = ? WHERE id = ?').run(toColumnId, id);
    targetIds.splice(toIndex, 0, id);
    renumberColumnCards(toColumnId, targetIds);
    if (!sameColumn) renumberColumnCards(card.columnId, sourceIds);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
  return getCard(id)!;
}

/* ----------------------------- arama ----------------------------- */

/** Türkçe duyarsız katlama: İstanbul ↔ istanbul, IŞIK ↔ isik */
export function fold(value: string): string {
  return value
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function searchCards(q?: string, label?: string): CardWithColumn[] {
  const needle = q ? fold(q.trim()) : '';
  const wantedLabel = label ? fold(label.trim()) : '';

  return (cardsStmt.all() as CardRow[])
    .filter((card) => {
      if (needle) {
        const haystack = fold(
          [card.title, card.description ?? '', card.label ?? ''].join(' '),
        );
        if (!haystack.includes(needle)) return false;
      }
      if (wantedLabel && fold(card.label ?? '') !== wantedLabel) return false;
      return true;
    })
    .map((card) => ({ ...toCard(card), columnId: card.columnId }));
}

/* ----------------------------- import / export ----------------------------- */

export type ImportBoard = {
  columns: Array<{
    id: string;
    title: string;
    order?: number;
    cards: Array<{
      id: string;
      title: string;
      description?: string | null;
      label?: string | null;
      dueDate?: string | null;
      order?: number;
    }>;
  }>;
};

export function importBoard(board: ImportBoard): Board {
  const columnIds = new Set<string>();
  const cardIds = new Set<string>();

  for (const column of board.columns) {
    if (columnIds.has(column.id) || cardIds.has(column.id)) {
      throw badRequest(`Tekrarlanan id: ${column.id}`);
    }
    columnIds.add(column.id);
    for (const card of column.cards) {
      if (cardIds.has(card.id) || columnIds.has(card.id)) {
        throw badRequest(`Tekrarlanan id: ${card.id}`);
      }
      cardIds.add(card.id);
    }
  }

  db.exec('BEGIN');
  try {
    db.exec('DELETE FROM board_columns');
    const insertColumn = db.prepare(
      'INSERT INTO board_columns (id, title, ord) VALUES (?, ?, ?)',
    );
    const insertCard = db.prepare(
      `INSERT INTO board_cards (id, column_id, title, description, label, due_date, ord)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    );

    [...board.columns]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .forEach((column, columnIndex) => {
        insertColumn.run(column.id, column.title, columnIndex);
        [...column.cards]
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .forEach((card, cardIndex) => {
            insertCard.run(
              card.id,
              column.id,
              card.title,
              card.description ?? null,
              card.label ?? null,
              card.dueDate ?? null,
              cardIndex,
            );
          });
      });
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
  return getBoard();
}

export function exportBoard(): { board: Board } {
  return { board: getBoard() };
}

export function countAll(): { columns: number; cards: number } {
  const c = db.prepare('SELECT COUNT(*) AS n FROM board_columns').get() as { n: number };
  const k = db.prepare('SELECT COUNT(*) AS n FROM board_cards').get() as { n: number };
  return { columns: c.n, cards: k.n };
}
