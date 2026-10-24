# API SÖZLEŞMESİ

Değiştirilemez. Yol adları, durum kodları ve alan adları birebir uygulanır.
Sunucu: `http://localhost:3001`

## Uç noktalar

| Metot | Yol | Gövde / Sorgu | Yanıt |
|---|---|---|---|
| GET | `/api/health` | — | 200 · `{"status":"ok"}` |
| GET | `/api/board` | — | 200 · iç içe pano |
| POST | `/api/columns` | `{ title }` | 201 · oluşan kolon |
| PATCH | `/api/columns/:id` | `{ title?, order? }` | 200 · güncel kolon |
| DELETE | `/api/columns/:id` | — | 204 · kartları da silinir |
| POST | `/api/cards` | `{ columnId, title, description?, label?, dueDate? }` | 201 · oluşan kart |
| PATCH | `/api/cards/:id` | `{ title?, description?, label?, dueDate? }` | 200 · güncel kart |
| DELETE | `/api/cards/:id` | — | 204 |
| POST | `/api/cards/:id/move` | `{ toColumnId, toIndex }` | 200 · sıralar yeniden hesaplanır |
| GET | `/api/cards?q=&label=` | `q` metin, `label` etiket | 200 · `{"cards":[…]}` |
| POST | `/api/import` | `{ board }` | 200 · mevcut veri silinir, yenisi yüklenir |
| GET | `/api/export` | — | 200 · `{"board":{…}}` |

## Pano şeması (`GET /api/board`)

```json
{
  "columns": [
    {
      "id": "string",
      "title": "string",
      "order": 0,
      "cards": [
        {
          "id": "string",
          "title": "string",
          "description": "string | null",
          "label": "string | null",
          "dueDate": "ISO tarih | null",
          "order": 0
        }
      ]
    }
  ]
}
```

Not: `/api/board` kartlarında `columnId` **yoktur** (iç içe yapı kolon kimliğini taşır).
`/api/cards` arama yanıtında her kart `columnId` ile birlikte döner.

## Hata zarfı

Her hata aynı biçimde döner:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "title zorunlu" } }
```

| Durum | Kod | Örnek |
|---|---|---|
| 400 | `VALIDATION_ERROR` | `POST /api/columns {}` · boş başlık · `columnId` yok · `toIndex` aralık dışı |
| 404 | `NOT_FOUND` | olmayan kart/kolon id'si |
| 500 | `INTERNAL_ERROR` | beklenmeyen sunucu hatası |

## Taşıma kuralı

`POST /api/cards/:id/move` sonrası **hem kaynak hem hedef kolonda** `order` değerleri
`0,1,2,…` olacak şekilde boşluksuz ve tekrarsız yeniden hesaplanır.

- `toIndex`, hedef kolonun taşıma sonrası uzunluğundan büyükse → `400`
- Aynı kolonda taşıma da desteklidir.

## Arama

`GET /api/cards?q=&label=` — ikisi aynı istekte birlikte çalışır.

- Büyük/küçük harf duyarsızdır.
- Türkçe duyarsızdır: `İSTANBUL`, `istanbul`, `IŞIK` ↔ `isik`.
- `q`, başlık + açıklama + etiket içinde aranır.

## Ek uçlar (sözleşme dışı, opsiyonel)

Yarışma sözleşmesindeki uçlar değişmez; bunlar üstüne eklenen ekstralardır.

| Metot | Yol | Gövde | Yanıt |
|---|---|---|---|
| GET | `/api/extras` | — | `{ "kartId": { color, emoji, checklist:[…] } }` |
| PATCH | `/api/cards/:id/meta` | `{ color?, emoji? }` | 200 · güncel ekstra |
| POST | `/api/cards/:id/checklist` | `{ text }` | 201 · alt görev |
| PATCH | `/api/checklist/:itemId` | `{ text?, done? }` | 200 · güncel alt görev |
| DELETE | `/api/checklist/:itemId` | — | 204 |

`card_meta` ve `checklist_items` ayrı tablolardadır; kart silinince cascade ile temizlenir.
`/api/board` kart şeması **değişmez** (B2 korunur).

## Kalıcılık

Veri `api/data/kanban.db` (SQLite) dosyasındadır. Sunucu yeniden başlatıldığında veri korunur.
İlk açılışta boş veritabanı `data/board.json` ile seed edilir.

## curl örnekleri

```bash
curl http://localhost:3001/api/health
curl http://localhost:3001/api/board

curl -X POST http://localhost:3001/api/columns \
  -H "content-type: application/json" -d "{\"title\":\"Yeni kolon\"}"

curl -X POST http://localhost:3001/api/cards \
  -H "content-type: application/json" \
  -d "{\"columnId\":\"col-yapilacak\",\"title\":\"Deneme\"}"

curl -X POST http://localhost:3001/api/cards/<id>/move \
  -H "content-type: application/json" \
  -d "{\"toColumnId\":\"col-bitti\",\"toIndex\":0}"

curl "http://localhost:3001/api/cards?q=%C4%B0STANBUL&label=gezi"
```
