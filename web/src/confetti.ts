const COLORS = [
  '#e8365d',
  '#f0a52a',
  '#2dd4a7',
  '#6b9bf5',
  '#a78bfa',
  '#ff8a4c',
  '#ffd166',
  '#22d3ee',
];

export function confettiEnabled(): boolean {
  try {
    return localStorage.getItem('pano-konfeti') !== '0';
  } catch {
    return true;
  }
}

export function burstConfetti(x?: number, y?: number): void {
  if (!confettiEnabled() || typeof document === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const originX = x ?? window.innerWidth / 2;
  const originY = y ?? window.innerHeight * 0.34;
  const layer = document.createElement('div');
  layer.setAttribute('aria-hidden', 'true');
  layer.style.cssText =
    'position:fixed;inset:0;pointer-events:none;z-index:90;overflow:hidden';

  for (let index = 0; index < 42; index += 1) {
    const piece = document.createElement('span');
    const size = 5 + Math.random() * 6;
    piece.className = 'confetti-piece';
    piece.style.left = `${originX}px`;
    piece.style.top = `${originY}px`;
    piece.style.width = `${size}px`;
    piece.style.height = `${size * (0.6 + Math.random() * 0.9)}px`;
    piece.style.background = COLORS[index % COLORS.length];
    piece.style.setProperty('--dx', `${(Math.random() - 0.5) * 520}px`);
    piece.style.setProperty('--dy', `${120 + Math.random() * 420}px`);
    piece.style.setProperty('--rot', `${(Math.random() - 0.5) * 1080}deg`);
    piece.style.animationDelay = `${Math.random() * 110}ms`;
    layer.appendChild(piece);
  }

  document.body.appendChild(layer);
  window.setTimeout(() => layer.remove(), 1500);
}
