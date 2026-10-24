import type { Board, Card, Column } from './types';

const due = (days: number): string => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

const card = (
  id: string,
  title: string,
  description: string,
  label: string,
  dueDate: string | null = null,
): Card => ({
  id,
  title,
  description,
  label,
  dueDate,
  order: 0,
});

const column = (
  id: string,
  title: string,
  cards: Card[],
): Column => ({
  id,
  title,
  order: 0,
  cards: cards.map((item, index) => ({ ...item, order: index })),
});

export type BoardTemplate = {
  id: string;
  name: string;
  note: string;
  emoji: string;
  columns: string;
  build: () => Board;
};

export const TEMPLATES: BoardTemplate[] = [
  {
    id: 'sprint',
    name: 'Sprint',
    note: 'İki haftalık geliştirme akışı',
    emoji: '🏃',
    columns: '4 kolon · 8 kart',
    build: () => ({
      columns: [
        column('tpl-sprint-backlog', 'Yapılacak', [
          card('tpl-sprint-1', 'Kullanıcı girişi', 'E-posta + şifre, hata durumları ve yönlendirme.', 'backend', due(2)),
          card('tpl-sprint-2', 'Pano boş durumu', 'İlk açılışta örnek kart ve yönlendirme metni.', 'tasarım', due(3)),
          card('tpl-sprint-3', 'Kart kapak renkleri', 'Etiketten bağımsız, kullanıcı seçimli renk.', 'frontend'),
        ]),
        column('tpl-sprint-doing', 'Yapılıyor', [
          card('tpl-sprint-4', 'Sürükle-bırak sıralama', 'Kolon içi ve kolonlar arası, iyimser güncelleme.', 'frontend', due(1)),
          card('tpl-sprint-5', 'Arama API performansı', 'Büyük panoda 100 ms altı yanıt.', 'backend', due(4)),
        ]),
        column('tpl-sprint-review', 'İncelemede', [
          card('tpl-sprint-6', 'Erişilebilirlik turu', 'Klavye odağı, kontrast ve ekran okuyucu etiketleri.', 'test', due(5)),
          card('tpl-sprint-7', 'Mobil yerleşim', '1024px altında yatay kaydırma ve dokunma hedefleri.', 'tasarım', due(6)),
        ]),
        column('tpl-sprint-done', 'Bitti', [
          card('tpl-sprint-8', 'Proje iskeleti', 'İki proje, tek komut, portlar sabit.', 'altyapı'),
        ]),
      ],
    }),
  },
  {
    id: 'icerik',
    name: 'İçerik Takvimi',
    note: 'Fikirden yayına içerik akışı',
    emoji: '📝',
    columns: '4 kolon · 6 kart',
    build: () => ({
      columns: [
        column('tpl-icerik-fikir', 'Fikir', [
          card('tpl-icerik-1', '“Ajanla 60 dakika” yazısı', 'Süreç günlüğü + ekran görüntüleri.', 'blog', due(4)),
          card('tpl-icerik-2', 'Kısa video: pano turu', '60 saniyelik dikey video.', 'video', due(7)),
        ]),
        column('tpl-icerik-yaziliyor', 'Yazılıyor', [
          card('tpl-icerik-3', 'E-posta bülteni #12', 'Yeni özellikler ve bir kullanıcı hikâyesi.', 'bülten', due(2)),
        ]),
        column('tpl-icerik-onay', 'Onay', [
          card('tpl-icerik-4', 'Sosyal medya görselleri', 'Üç kare gönderi, tek renk paleti.', 'tasarım', due(1)),
          card('tpl-icerik-5', 'Basın bülteni', 'Kısa künye ve iletişim bilgileri.', 'pr', due(6)),
        ]),
        column('tpl-icerik-yayinda', 'Yayında', [
          card('tpl-icerik-6', 'Lansman sayfası', 'Canlı yayında, geri bildirim toplanıyor.', 'web'),
        ]),
      ],
    }),
  },
  {
    id: 'kisisel',
    name: 'Kişisel Plan',
    note: 'Günlük ve haftalık işler',
    emoji: '🌱',
    columns: '4 kolon · 6 kart',
    build: () => ({
      columns: [
        column('tpl-kisisel-bugun', 'Bugün', [
          card('tpl-kisisel-1', 'Sabah rutini', 'Su, yürüyüş, 10 dakika planlama.', 'sağlık', due(0)),
          card('tpl-kisisel-2', 'Faturaları öde', 'Elektrik ve internet.', 'ev', due(1)),
        ]),
        column('tpl-kisisel-hafta', 'Bu Hafta', [
          card('tpl-kisisel-3', 'Kitap: 50 sayfa', 'Akşam 21.00, telefonu bırak.', 'öğrenme', due(5)),
          card('tpl-kisisel-4', 'Proje sunumu', 'Slaytları sadeleştir, iki prova yap.', 'iş', due(3)),
        ]),
        column('tpl-kisisel-beklemede', 'Beklemede', [
          card('tpl-kisisel-5', 'Kargo takibi', 'Salı günü teslim edilecek.', 'alışveriş'),
        ]),
        column('tpl-kisisel-tamam', 'Tamam', [
          card('tpl-kisisel-6', 'Haftalık gözden geçirme', 'Neyi iyi yaptım, neyi bırakıyorum?', 'plan'),
        ]),
      ],
    }),
  },
];
