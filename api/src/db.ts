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

  CREATE TABLE IF NOT EXISTS card_meta (
    card_id TEXT PRIMARY KEY REFERENCES board_cards(id) ON DELETE CASCADE,
    color   TEXT,
    emoji   TEXT
  );

  CREATE TABLE IF NOT EXISTS checklist_items (
    id      TEXT PRIMARY KEY,
    card_id TEXT NOT NULL REFERENCES board_cards(id) ON DELETE CASCADE,
    text    TEXT NOT NULL,
    done    INTEGER NOT NULL DEFAULT 0,
    ord     INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_checklist_card ON checklist_items(card_id, ord);
`);
