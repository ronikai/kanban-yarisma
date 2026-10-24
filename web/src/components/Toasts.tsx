import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import type { Toast } from '../types';

type Props = {
  toasts: Toast[];
  onDismiss: (id: number) => void;
};

const TONE = {
  success: {
    icon: CheckCircle2,
    ring: 'border-mint/40',
    iconColor: 'text-mint',
    action: 'bg-mint-soft text-mint hover:bg-mint hover:text-white',
  },
  error: {
    icon: AlertCircle,
    ring: 'border-coral/40',
    iconColor: 'text-coral',
    action: 'bg-coral-soft text-coral hover:bg-coral hover:text-white',
  },
  info: {
    icon: Info,
    ring: 'border-sky/40',
    iconColor: 'text-sky',
    action: 'bg-sky-soft text-sky hover:bg-sky hover:text-white',
  },
} as const;

export function Toasts({ toasts, onDismiss }: Props) {
  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-3 z-[60] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-5 sm:bottom-5">
      {toasts.map((toast) => {
        const tone = TONE[toast.tone];
        const Icon = tone.icon;
        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex w-full max-w-sm animate-slide items-center gap-2.5 rounded-xl border ${tone.ring} bg-[#fffdf8] py-2.5 pl-3 pr-2 shadow-float`}
          >
            <Icon size={17} className={`shrink-0 ${tone.iconColor}`} />
            <p className="min-w-0 flex-1 text-[13px] font-medium leading-snug text-ink-2">
              {toast.message}
            </p>
            {toast.action && (
              <button
                type="button"
                onClick={() => {
                  toast.action?.run();
                  onDismiss(toast.id);
                }}
                className={`rounded-lg px-2.5 py-1 text-[12px] font-bold transition ${tone.action}`}
              >
                {toast.action.label}
              </button>
            )}
            <button
              type="button"
              aria-label="Bildirimi kapat"
              onClick={() => onDismiss(toast.id)}
              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-faint transition hover:bg-paper-2 hover:text-ink"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
