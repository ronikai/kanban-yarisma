# AGENTS.md

Bu proje 60 dakikalık bir yarışma teslimidir. Ajan bu dosyayı her oturumda okur.

## Yığın

- **API:** Node.js + TypeScript + Express 4 + zod + `node:sqlite` → **:3001** (sabit)
- **Web:** Vite + React + TypeScript + Tailwind CSS v4 + TanStack Query + `@dnd-kit` → **:5173** (sabit)
- **Kök:** `concurrently`
- Veritabanı: `api/data/kanban.db` (SQLite, dosya tabanlı)

## Komutlar

```bash
npm run dev            # ikisi birlikte
npm run smoke          # API kabul testi (dev çalışırken)
npm run build          # web üretim derlemesi
npm --prefix api run typecheck
```

## Değişmez kurallar

1. **Portları değiştirme.** 3001 ve 5173 sabittir; otomatik test bu portlara koşar.
2. **API sözleşmesi** `docs/API.md` tek doğruluk kaynağıdır. Yol, alan adı (`columnId`, `dueDate`, `order`) ve HTTP kodu değişmez.
3. Her hata `{ error: { code, message } }` zarfıyla döner.
4. `/api/board` iç içe yapı döner; kartlarda `columnId` **bulunmaz**.
5. `POST /api/cards/:id/move` sonrası hem kaynak hem hedef kolonda `order` değerleri `0,1,2…` boşluksuz olur.
6. Arayüz veriyi **yalnızca API'den** alır. Frontend'e sabit/sahte dizi ekleme.
7. Değişiklikten sonra `npm run smoke` çalıştır; yeşil değilse "bitti" deme.
8. Bana sormadan kütüphane, port veya mimari değiştirme.
9. Çalışan her adımdan sonra commit at (`feat:`, `fix:`, `docs:`).
10. Son 10 dakikada refactor yapılmaz; README ve testlere odaklanılır.

## Bilinen tuzaklar

- `node:sqlite` Node ≥ 22.5 ister; `better-sqlite3` gibi native derleme yoktur.
- `PRAGMA foreign_keys = ON` açık olmalı, aksi halde kolon silince kartlar silinmez.
- Türkçe arama için `toLocaleLowerCase('tr-TR')` + `ı→i` + diyakritik temizliği kullanılır.
- Vite proxy `/api` → `http://localhost:3001`; frontend'de mutlak adres kullanılmaz.
