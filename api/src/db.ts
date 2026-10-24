import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const apiDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const rootDir = resolve(apiDir, '..');
const dataDir = resolve(apiDir, 'data');
mkdirSync(dataDir, { recursive: true });

export const db = new DatabaseSync(resolve(dataDir, 'kanban.db'));

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS board_columns (
    id    TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    ord   INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS board_cards (
    id          TEXT PRIMARY KEY,
    column_id   TEXT NOT NULL REFERENCES board_columns(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    description TEXT,
    label       TEXT,
    due_date    TEXT,
    ord         INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_cards_column ON board_cards(column_id, ord);
`);
