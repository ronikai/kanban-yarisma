# PLAN

## Amaç

Trello'nun çekirdeği: kolonlar + kartlar, sürükle-bırak, kalıcı veri, değiştirilemez API sözleşmesi.
Backend ve frontend ayrı projeler; kökten tek komut.

## Mimari

```
web (React) ──/api (Vite proxy)──▶ api (Express) ──▶ SQLite dosyası
```

- Frontend durum yönetimi: TanStack Query (`['board']` tek kaynak)
- Mutasyonlarda iyimser güncelleme + `onError` geri alma + `onSettled` invalidate
- Sürükle-bırak: `@dnd-kit/core` + `@dnd-kit/sortable`; bırakınca `POST /cards/:id/move`
- API katmanı: `routes (index.ts)` → `schemas.ts (zod)` → `store.ts (SQL)` → `db.ts`

## Veri şeması

```sql
board_columns (id TEXT PK, title TEXT NOT NULL, ord INTEGER NOT NULL)
board_cards   (id TEXT PK, column_id TEXT NOT NULL REFERENCES board_columns(id) ON DELETE CASCADE,
               title TEXT NOT NULL, description TEXT, label TEXT, due_date TEXT, ord INTEGER NOT NULL)
```

- `order` alanı DB'de `ord`; API'de `order` olarak döner (SQLite anahtar kelimesi çakışmasın diye).
- Tüm sıralamalar API sınırında normalize edilir: `0,1,2…` boşluksuz, tekrarsız.

## Uç noktalar

| Metot | Yol | Not |
|---|---|---|
| GET | `/api/health` | `{"status":"ok"}` |
| GET | `/api/board` | iç içe pano |
| POST | `/api/columns` | 201 |
| PATCH | `/api/columns/:id` | 200, `order` ile yeniden sıralama |
| DELETE | `/api/columns/:id` | 204, kartlar cascade |
| POST | `/api/cards` | 201 |
| PATCH | `/api/cards/:id` | 200, yalnız gönderilen alan |
| DELETE | `/api/cards/:id` | 204 |
| POST | `/api/cards/:id/move` | 200, iki kolonda renumber |
| GET | `/api/cards?q=&label=` | ikisi birlikte, TR-duyarsız |
| POST | `/api/import` | 200, önce temizler |
| GET | `/api/export` | `{board}` |

## Yapım sırası (uygulanan)

1. İskelet: kök `package.json`, `api/`, `web/` (Vite), docs, `data/board.json`
2. Şema + `store.ts` (CRUD, cascade, move, arama, import/export)
3. zod doğrulama + hata zarfı middleware'i + seed
4. `smoke.mjs` ile B1–B9 doğrulaması
5. Arayüz: board/kolon/kart bileşenleri, TanStack Query
6. Sürükle-bırak + iyimser güncelleme
7. Detay modalı, arama/filtre, durumlar, klavye, geri al
8. Tasarım pass'i + 120 kartlık kenar durum provası
9. README, commit'ler, temiz kurulum testi

## Tasarım sistemi

- Sıcak kağıt zemini (`#FBF7EE`), mürekkep metin (`#221C17`), 6 canlı aksan
- 4px ızgara, 12/14/15/22 tip ölçeği, iki katmanlı yumuşak gölgeler
- Kolon başına renk yıkaması, etiketlerde deterministik renk (aynı etiket = aynı renk)
- Hareket: sürüklemede hafif eğim, modalde `pop`, toast'ta `slide`
