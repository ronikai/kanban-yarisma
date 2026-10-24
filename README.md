# Pano — Kanban Klonu

Ajan Haftası · Yarışma 01 teslimi. `api/` ve `web/` ayrı iki proje; kökten tek komutla birlikte kalkar.

## Hızlı başlangıç

```bash
npm run install:all   # kök + api + web bağımlılıkları
npm run dev           # api :3001 + web :5173
```

Tarayıcı: **http://localhost:5173**

> Gereksinim: **Node.js ≥ 22.5** (API, gömülü `node:sqlite` kullanır). Geliştirme Node 26 ile yapıldı.

Ayrı ayrı çalıştırmak istersen:

```bash
npm --prefix api install && npm --prefix api run dev   # :3001
npm --prefix web install && npm --prefix web run dev   # :5173
```

## Ne var?

- Kolon ve kart oluşturma, düzenleme, silme (hepsi API üzerinden)
- Kolon adını çift tıklayıp yeniden adlandırma
- Kartları kolonlar arasında ve kolon içinde sürükle-bırak (`@dnd-kit`)
- Kart detayı: açıklama, etiket, son tarih; geciken kartlar işaretli
- Metin araması + etiket filtresi (birlikte, Türkçe duyarsız: `İSTANBUL` ↔ `istanbul`)
- Yükleniyor / boş / hata durumları, iyimser güncelleme ve hata olunca geri alma
- Klavye: `N` yeni kart, `/` aramaya odak, `Esc` kapat, `?` kısayollar
- Kart silmede "Geri al"
- JSON yedek indir / yedekten yükle (`GET /api/export`, `POST /api/import`)
- **Görünüm ayarları:** Şeker / Orman / Okyanus paletleri, anında uygulanır ve tarayıcıda saklanır
- SQLite ile kalıcı veri: sunucu kapanıp açılsa da pano yerinde

## Klasör yapısı

```
kanban-yarisma/
├── api/                  Express + zod + node:sqlite (:3001)
│   ├── src/              index.ts · store.ts · schemas.ts · db.ts · http.ts
│   ├── scripts/smoke.mjs uçtan uca kabul testi
│   └── data/kanban.db    ilk çalıştırmada oluşur (git'e girmez)
├── web/                  Vite + React + TS + Tailwind (:5173)
│   └── src/              App.tsx · useKanban.ts · components/
├── data/board.json       başlangıç panosu (3 kolon / 9 kart)
├── docs/                 PLAN.md · API.md · KABUL.md
└── package.json          dev / smoke / build
```

## Komutlar

| Komut | Ne yapar |
|---|---|
| `npm run dev` | API + web birlikte (`concurrently`) |
| `npm run smoke` | 21 maddelik API kabul testi (önce `npm run dev`) |
| `npm run build` | Frontend üretim derlemesi (`web/dist`) |
| `npm --prefix api run typecheck` | API tip kontrolü |

## Veritabanı

- Dosya: `api/data/kanban.db` (SQLite, WAL)
- İlk açılışta boşsa `data/board.json` otomatik yüklenir (seed)
- Sıfırlamak için: API'yi durdur, `api/data/kanban.db*` dosyalarını sil, tekrar başlat
- Yedek/taşıma: `GET /api/export` ile JSON al, `POST /api/import` ile geri yükle

## API

Tam sözleşme: [docs/API.md](docs/API.md). Özet:

`GET /api/health` · `GET /api/board` · `POST/PATCH/DELETE /api/columns` ·
`POST/PATCH/DELETE /api/cards` · `POST /api/cards/:id/move` ·
`GET /api/cards?q=&label=` · `POST /api/import` · `GET /api/export`

Hata biçimi tek: `{ "error": { "code": "VALIDATION_ERROR", "message": "..." } }`

## Notlar

- Arayüzde sabit/sahte veri yoktur; tek veri kaynağı API'dir.
- Portlar sabittir: **3001** ve **5173**.
- `VITE_API_URL` verilirse frontend API'yi başka bir adresten çağırır (varsayılan: aynı origin + Vite proxy).
- Çalışan sürüm `prototype-v1` etiketiyle işaretlidir; geri dönmek için `git checkout prototype-v1`.

## Yayın (Surge)

Surge yalnızca statik dosya barındırır; API orada çalışmaz. Bu yüzden yayınlanan build bir **tasarım önizlemesidir**: API'ye ulaşamadığında uygulama bunu açıkça söyler ve tekrar dene düğmesi gösterir. Jüri değerlendirmesi lokalde, `npm run dev` ile yapılır.

```bash
npm run deploy            # build + surge web/dist (etkileşimli alan adı seçimi)
```

İlk kullanımda bir kez `surge login` gerekir.

## 5 dakikalık sunum akışı

1. `npm run dev` — iki sunucu ayağa kalkar, pano 3 kolon / 9 kart gelir.
2. Kart sürükle: kolonlar arası, sonra kolon içi; sayfayı yenile, yerinde duruyor.
3. Kart detayını aç: açıklama + etiket + tarih kaydet; gecikmiş kartın rozetini göster.
4. Arama: `İSTANBUL` yaz, etiket filtresiyle birleştir; boş sonucu göster.
5. Kolon adını çift tıkla, değiştir; yeni kolon ekle.
6. `N` / `/` / `?` kısayollarını göster; bir kart sil ve "Geri al".
7. Üstteki indirme simgesiyle yedek al; API'yi kapatıp hata ekranını göster, tekrar dene.

