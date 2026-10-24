# KABUL KRİTERLERİ (30 madde / 100 puan)

Otomatik test: `npm run smoke` — 21 kontrol.

## A · Backend (40 puan) — smoke ile doğrulandı

- [x] **B1** `:3001` + `GET /api/health` → `{"status":"ok"}` (3 p)
- [x] **B2** `/api/board` iç içe yapı, alan adları birebir (5 p)
- [x] **B3** Kolon uçları 201/200/204 + cascade silme (5 p)
- [x] **B4** Kart uçları 201/200/204, PATCH yalnız gönderilen alan (5 p)
- [x] **B5** `move` + iki kolonda boşluksuz `order` (7 p)
- [x] **B6** `q` + `label` birlikte, TR-duyarsız arama (4 p)
- [x] **B7** 400/404 + `{error:{code,message}}` zarfı (5 p)
- [x] **B8** SQLite kalıcılığı, restart sonrası veri yerinde (4 p)
- [x] **B9** import/export aynı biçim, import temizler (2 p)

## B · Frontend (30 puan)

- [x] **F1** Kolon/kart CRUD arayüzden, hepsi API'ye (5 p)
- [x] **F2** Kolonlar arası sürükle-bırak + yenilemede kalıcı (5 p)
- [x] **F3** Kolon içi sıralama + kalıcı (4 p)
- [x] **F4** Detay: açıklama / etiket / son tarih düzenleme (4 p)
- [x] **F5** Metin arama + etiket filtresi birlikte, boş sonuç mesajı (3 p)
- [x] **F6** Yükleniyor / boş / hata durumları (3 p)
- [x] **F7** İyimser güncelleme + hata olunca geri alma + uyarı (3 p)
- [x] **F8** `N` yeni kart, `/` arama, `Esc` kapat (2 p)
- [x] **F9** 1024px altı yatay kaydırma, taşma yok (1 p)

## C · Kenar durumlar (15 puan)

- [x] **E1** 120 kartlık pano import edilince donmuyor, sürükleme akıcı (5 p)
- [x] **E2** Uzun başlık/açıklama düzeni bozmuyor (sarma/kırpma) (3 p)
- [x] **E3** Türkçe karakterler + TR-duyarsız arama (3 p)
- [x] **E4** Geçmiş `dueDate` görsel işaret (2 p)
- [x] **E5** Import sonrası yenileme: aynı sayı ve sıra (2 p)

## D · Süreç kalitesi (10 puan)

- [x] **P1** `docs/PLAN.md`: yapı, şema, uçlar, sıra (3 p)
- [x] **P2** `AGENTS.md`: yığın, portlar, komutlar, kurallar (2 p)
- [x] **P3** ≥5 anlamlı commit (2 p)
- [x] **P4** `README.md` + çalışan kurulum komutu (3 p)

## E · Cila (5 puan)

- [x] **C1** Tipografi/boşluk/renk sistemi, jenerik görünüm yok (2 p)
- [x] **C2** Akıcı sürükleme, bırakma hedefi belli (2 p)
- [x] **C3** İnsan dili boş durum metinleri (1 p)

## Doğrulama notları

- `npm run smoke` → 21/21 geçti
- 120 kart + 6 kolon import provası → donma yok, sıralar tutarlı
- Sunucu kapat-aç → veri korunuyor
- Temiz klasörde `npm run install:all && npm run dev` → iki sunucu kalkıyor
