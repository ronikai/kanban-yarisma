import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ZodTypeAny, z } from 'zod';
import { rootDir } from './db.js';
import { HttpError, badRequest, notFound } from './http.js';
import * as store from './store.js';
import {
  cardMetaSchema,
  checklistCreateSchema,
  checklistUpdateSchema,
  createCardSchema,
  createColumnSchema,
  importSchema,
  moveCardSchema,
  updateCardSchema,
  updateColumnSchema,
} from './schemas.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

function parse<T extends ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw badRequest(result.error.issues[0]?.message ?? 'Geçersiz veri');
  }
  return result.data;
}

/* ------------------------------- sağlık ------------------------------- */

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

/* ------------------------------- pano ------------------------------- */

app.get('/api/board', (_req, res) => {
  res.json(store.getBoard());
});

app.get('/api/export', (_req, res) => {
  res.json(store.exportBoard());
});

app.post('/api/import', (req, res) => {
  const { board } = parse(importSchema, req.body);
  res.json({ board: store.importBoard(board) });
});

/* ------------------------------- kolonlar ------------------------------- */

app.post('/api/columns', (req, res) => {
  const { title } = parse(createColumnSchema, req.body);
  res.status(201).json(store.createColumn(title));
});

app.patch('/api/columns/:id', (req, res) => {
  const patch = parse(updateColumnSchema, req.body);
  const column = store.updateColumn(req.params.id, patch);
  if (!column) throw notFoundColumn();
  res.json(column);
});

app.delete('/api/columns/:id', (req, res) => {
  if (!store.deleteColumn(req.params.id)) throw notFoundColumn();
  res.status(204).end();
});

/* ------------------------------- kartlar ------------------------------- */

app.get('/api/cards', (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q : undefined;
  const label = typeof req.query.label === 'string' ? req.query.label : undefined;
  res.json({ cards: store.searchCards(q, label) });
});

app.post('/api/cards', (req, res) => {
  const input = parse(createCardSchema, req.body);
  res.status(201).json(store.createCard(input));
});

app.patch('/api/cards/:id', (req, res) => {
  const patch = parse(updateCardSchema, req.body);
  const card = store.updateCard(req.params.id, patch);
  if (!card) throw notFoundCard();
  res.json(card);
});

app.delete('/api/cards/:id', (req, res) => {
  if (!store.deleteCard(req.params.id)) throw notFoundCard();
  res.status(204).end();
});

app.post('/api/cards/:id/move', (req, res) => {
  const { toColumnId, toIndex } = parse(moveCardSchema, req.body);
  res.json(store.moveCard(req.params.id, toColumnId, toIndex));
});

/* ------------------------------- kart ekstraları ------------------------------- */

app.get('/api/extras', (_req, res) => {
  res.json(store.getExtras());
});

app.patch('/api/cards/:id/meta', (req, res) => {
  const meta = parse(cardMetaSchema, req.body);
  const extra = store.setCardMeta(req.params.id, meta);
  if (!extra) throw notFoundCard();
  res.json(extra);
});

app.post('/api/cards/:id/checklist', (req, res) => {
  const { text } = parse(checklistCreateSchema, req.body);
  const item = store.addChecklistItem(req.params.id, text);
  if (!item) throw notFoundCard();
  res.status(201).json(item);
});

app.patch('/api/checklist/:itemId', (req, res) => {
  const patch = parse(checklistUpdateSchema, req.body);
  const item = store.updateChecklistItem(req.params.itemId, patch);
  if (!item) throw notFoundItem();
  res.json(item);
});

app.delete('/api/checklist/:itemId', (req, res) => {
  if (!store.deleteChecklistItem(req.params.itemId)) throw notFoundItem();
  res.status(204).end();
});

/* ------------------------------- hata yönetimi ------------------------------- */

const notFoundColumn = () => notFound('Kolon bulunamadı');
const notFoundCard = () => notFound('Kart bulunamadı');
const notFoundItem = () => notFound('Alt görev bulunamadı');

app.use((_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Uç nokta bulunamadı' } });
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: { code: error.code, message: error.message } });
    return;
  }
  if (
    typeof error === 'object' &&
    error !== null &&
    (error as { type?: string }).type === 'entity.parse.failed'
  ) {
    res
      .status(400)
      .json({ error: { code: 'VALIDATION_ERROR', message: 'Geçersiz JSON gövdesi' } });
    return;
  }
  console.error('[api] beklenmeyen hata:', error);
  res
    .status(500)
    .json({ error: { code: 'INTERNAL_ERROR', message: 'Sunucu hatası' } });
});

/* ------------------------------- seed & başlat ------------------------------- */

function seedIfEmpty(): void {
  if (store.getBoard().columns.length > 0) return;
  const seedFile = resolve(rootDir, 'data', 'board.json');
  if (!existsSync(seedFile)) {
    console.warn('[api] data/board.json yok, boş pano ile başlanıyor');
    return;
  }
  const payload = importSchema.safeParse(JSON.parse(readFileSync(seedFile, 'utf8')));
  if (!payload.success) {
    console.warn('[api] data/board.json geçersiz, seed atlandı');
    return;
  }
  const board = store.importBoard(payload.data.board);
  const cards = board.columns.reduce((total, column) => total + column.cards.length, 0);
  console.log(`[api] seed yüklendi: ${board.columns.length} kolon / ${cards} kart`);
}

const PORT = 3001;

seedIfEmpty();

app.listen(PORT, () => {
  const { columns, cards } = store.countAll();
  console.log(`[api] http://localhost:${PORT} · ${columns} kolon / ${cards} kart`);
});
