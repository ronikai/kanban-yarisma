import { X } from 'lucide-react';

type Props = { open: boolean; onClose: () => void };

const SHORTCUTS = [
  { keys: ['N'], text: 'Yeni kart aç' },
  { keys: ['/'], text: 'Aramaya odaklan' },
  { keys: ['Esc'], text: 'Açık pencereyi kapat' },
  { keys: ['?'], text: 'Bu yardım penceresi' },
];

const FLOW = [
  'Kartı tut ve başka kolona bırak',
  'Kolon içinde yukarı/aşağı sürükle',
  'Karta tıkla: açıklama, etiket, tarih',
];

export function HelpDialog({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/35 p-4 backdrop-blur-[3px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Klavye kısayolları"
        className="w-full max-w-md animate-pop rounded-2xl bg-[#fffdf8] p-5 shadow-pop"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-extrabold text-coral">Kısayollar</p>
            <h2 className="font-display text-[22px] font-extrabold tracking-tight">
              Elle de hızlı
            </h2>
          </div>
          <button
            type="button"
            aria-label="Kapat"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-paper-2 hover:text-ink"
          >
            <X size={17} />
          </button>
        </div>

        <ul className="mt-4 space-y-2">
          {SHORTCUTS.map((shortcut) => (
            <li
              key={shortcut.text}
              className="flex items-center justify-between rounded-xl border border-line/80 bg-paper/60 px-3 py-2.5"
            >
              <span className="text-[13px] font-medium text-ink-2">{shortcut.text}</span>
              <span className="flex gap-1">
                {shortcut.keys.map((key) => (
                  <kbd key={key} className="kbd">
                    {key}
                  </kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-4 rounded-xl border border-mint/30 bg-mint-soft/60 p-3">
          <p className="text-[12px] font-extrabold text-mint">Akış</p>
          <ul className="mt-2 space-y-1.5">
            {FLOW.map((item) => (
              <li key={item} className="flex gap-2 text-[12.5px] leading-snug text-ink-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-mint" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
