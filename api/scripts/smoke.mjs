/**
 * Uçtan uca API kabul testi.
 * Kullanım: önce `npm run dev` (veya `npm --prefix api run dev`), sonra `npm run smoke`.
 */
const BASE = 'http://localhost:3001/api';

let pass = 0;
const failures = [];

function check(name, condition, extra = '') {
  if (condition) {
    pass += 1;
    console.log(`\x1b[32mPASS\x1b[0m ${name}`);
  } else {
    failures.push(name);
    console.log(`\x1b[31mFAIL\x1b[0m ${name} ${extra}`);
  }
}

async function call(method, path, body) {
  const response = await fetch(BASE + path, {
    method,
    headers: body === undefined ? {} : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: response.status, json };
}

const isEnvelope = (json) =>
  Boolean(json && json.error && typeof json.error.code === 'string' && typeof json.error.message === 'string');

const initial = await call('GET', '/export');
if (initial.status !== 200 || !initial.json?.board) {
  console.error('API çalışmıyor gibi görünüyor. Önce `npm run dev` çalıştır.');
  process.exit(1);
}
const snapshot = initial.json;

try {
  /* B1 */
  const health = await call('GET', '/health');
  check(
    'B1 health :3001 → {status:"ok"}',
    health.status === 200 && health.json?.status === 'ok',
    JSON.stringify(health),
  );

  /* B2 */
  const board = await call('GET', '/board');
  const shapeOk =
    board.status === 200 &&
    Array.isArray(board.json?.columns) &&
    board.json.columns.every(
      (column) =>
        typeof column.id === 'string' &&
        typeof column.title === 'string' &&
        typeof column.order === 'number' &&
        Array.isArray(column.cards) &&
        column.cards.every(
          (card) =>
            typeof card.id === 'string' &&
            typeof card.title === 'string' &&
            'description' in card &&
            'label' in card &&
            'dueDate' in card &&
            typeof card.order === 'number' &&
            !('columnId' in card) &&
            !('column_id' in card),
        ),
    );
  check('B2 /board iç içe şema, alan adları birebir', shapeOk);

  /* B3 · kolon uçları + cascade */
  const column = await call('POST', '/columns', { title: 'Smoke Kolon' });
  check('B3a POST /columns → 201', column.status === 201 && column.json?.title === 'Smoke Kolon');
  const columnId = column.json?.id;

  const patchedColumn = await call('PATCH', `/columns/${columnId}`, { title: 'Smoke Kolon 2' });
  check('B3b PATCH /columns/:id → 200', patchedColumn.status === 200 && patchedColumn.json?.title === 'Smoke Kolon 2');

  const doomedCard = await call('POST', '/cards', { columnId, title: 'Cascade kurbanı' });
  check('B3c POST /cards → 201', doomedCard.status === 201 && doomedCard.json?.id);

  const deletedColumn = await call('DELETE', `/columns/${columnId}`);
  check('B3d DELETE /columns/:id → 204', deletedColumn.status === 204);

  const afterCascade = await call('GET', '/board');
  const cascadeOk = !afterCascade.json.columns.some((item) => item.id === columnId);
  const ghostCard = await call('PATCH', `/cards/${doomedCard.json?.id}`, { title: 'yok' });
  check('B3e kolon silinince kartları da silinir', cascadeOk && ghostCard.status === 404);

  /* B4 · kart uçları */
  const card = await call('POST', '/cards', {
    columnId: snapshot.board.columns[0].id,
    title: 'Smoke kart',
    description: 'ilk',
  });
  check(
    'B4a POST /cards → 201 (columnId,title)',
    card.status === 201 && card.json?.columnId === snapshot.board.columns[0].id,
  );

  const updatedCard = await call('PATCH', `/cards/${card.json?.id}`, { title: 'Smoke kart 2' });
  check(
    'B4b PATCH /cards yalnız gönderilen alanı değiştirir',
    updatedCard.status === 200 &&
      updatedCard.json?.title === 'Smoke kart 2' &&
      updatedCard.json?.description === 'ilk',
  );

  const deletedCard = await call('DELETE', `/cards/${card.json?.id}`);
  check('B4c DELETE /cards/:id → 204', deletedCard.status === 204);

  /* B5 · move + boşluksuz order */
  const colA = (await call('POST', '/columns', { title: 'A' })).json;
  const colB = (await call('POST', '/columns', { title: 'B' })).json;
  const cards = [];
  for (const title of ['a1', 'a2', 'a3']) {
    cards.push((await call('POST', '/cards', { columnId: colA.id, title })).json);
  }
  const b1 = (await call('POST', '/cards', { columnId: colB.id, title: 'b1' })).json;

  const moved = await call('POST', `/cards/${cards[0].id}/move`, {
    toColumnId: colB.id,
    toIndex: 0,
  });
  const verifyBoard = await call('GET', '/board');
  const colAVerify = verifyBoard.json.columns.find((column) => column.id === colA.id);
  const colBVerify = verifyBoard.json.columns.find((column) => column.id === colB.id);
  const contiguous = (list) => list.every((card, index) => card.order === index);
  check(
    'B5a kolonlar arası taşıma + iki tarafta 0,1,2',
    moved.status === 200 &&
      contiguous(colAVerify.cards) &&
      contiguous(colBVerify.cards) &&
      colBVerify.cards[0].id === cards[0].id &&
      colBVerify.cards.length === 2,
  );

  const sameColumn = await call('POST', `/cards/${b1.id}/move`, {
    toColumnId: colB.id,
    toIndex: 0,
  });
  const verifyBoard2 = await call('GET', '/board');
  const colBVerify2 = verifyBoard2.json.columns.find((column) => column.id === colB.id);
  check(
    'B5b kolon içi taşıma + boşluksuz order',
    sameColumn.status === 200 &&
      contiguous(colBVerify2.cards) &&
      colBVerify2.cards[0].id === b1.id,
  );

  /* B7 · doğrulama */
  const emptyColumn = await call('POST', '/columns', {});
  const blankTitle = await call('POST', '/columns', { title: '   ' });
  const noColumnId = await call('POST', '/cards', { title: 'x' });
  const missingCard = await call('PATCH', '/cards/yok-boyle-id', { title: 'x' });
  const missingColumn = await call('DELETE', '/columns/yok-boyle-id');
  const badMove = await call('POST', `/cards/${b1.id}/move`, { toIndex: 99 });
  const badIndex = await call('POST', `/cards/${b1.id}/move`, {
    toColumnId: colA.id,
    toIndex: 99,
  });
  check(
    'B7a eksik/boş başlık → 400 VALIDATION_ERROR',
    emptyColumn.status === 400 && isEnvelope(emptyColumn.json) && blankTitle.status === 400,
  );
  check(
    'B7b columnId yok → 400',
    noColumnId.status === 400 && isEnvelope(noColumnId.json),
  );
  check('B7c olmayan kart/kolon → 404', missingCard.status === 404 && missingColumn.status === 404);
  check('B7d toColumnId yok → 400', badMove.status === 400 && isEnvelope(badMove.json));
  check('B7e toIndex aralık dışı → 400', badIndex.status === 400);

  /* B6 · arama + etiket */
  const searchCard = await call('POST', '/cards', {
    columnId: colA.id,
    title: 'İstanbul Gezisi',
    description: 'Türkçe karakter testi',
    label: 'gezi',
  });
  const searchBoth = await call('GET', `/cards?q=${encodeURIComponent('İSTANBUL')}&label=gezi`);
  const searchLabelMiss = await call('GET', `/cards?q=${encodeURIComponent('istanbul')}&label=yok`);
  const searchAscii = await call('GET', `/cards?q=${encodeURIComponent('ISTANBUL')}`);
  check(
    'B6a q + label birlikte, Türkçe duyarsız',
    searchBoth.status === 200 &&
      searchBoth.json.cards.length === 1 &&
      searchBoth.json.cards[0].id === searchCard.json.id &&
      searchLabelMiss.json.cards.length === 0 &&
      searchAscii.json.cards.length >= 1,
  );

  /* B9 · export / import */
  const exported = await call('GET', '/export');
  const exportCount = exported.json.board.columns.reduce((n, c) => n + c.cards.length, 0);
  const reimported = await call('POST', '/import', exported.json);
  const afterImport = await call('GET', '/board');
  const afterCount = afterImport.json.columns.reduce((n, c) => n + c.cards.length, 0);
  check(
    'B9a export → import aynı biçim',
    exported.status === 200 && reimported.status === 200 && exportCount === afterCount,
  );

  const wiped = await call('POST', '/import', { board: { columns: [{ id: 'only', title: 'Tek', cards: [] }] } });
  const wipedBoard = await call('GET', '/board');
  check(
    'B9b import mevcut veriyi temizler',
    wiped.status === 200 && wipedBoard.json.columns.length === 1 && wipedBoard.json.columns[0].id === 'only',
  );
} catch (error) {
  failures.push('beklenmeyen hata');
  console.error(error);
} finally {
  /* test verisini temizle, ilk panoyu geri yükle */
  await call('POST', '/import', snapshot);
  const restored = await call('GET', '/board');
  const restoredCards = restored.json.columns.reduce((n, c) => n + c.cards.length, 0);
  check(
    'Temizlik: ilk pano geri yüklendi (3 kolon / 9 kart)',
    restored.json.columns.length === 3 && restoredCards === 9,
  );
}

console.log(`\n${pass} geçti, ${failures.length} kaldı`);
if (failures.length > 0) {
  console.log('Kalanlar:', failures.join(' · '));
  process.exit(1);
}
