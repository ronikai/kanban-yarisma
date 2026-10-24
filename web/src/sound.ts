let context: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    context ??= new AudioContext();
    if (context.state === 'suspended') void context.resume();
    return context;
  } catch {
    return null;
  }
}

export function soundEnabled(): boolean {
  try {
    return localStorage.getItem('pano-ses') === '1';
  } catch {
    return false;
  }
}

export function setSoundEnabled(value: boolean): void {
  try {
    localStorage.setItem('pano-ses', value ? '1' : '0');
  } catch {
    /* yoksay */
  }
}

function tone(
  frequency: number,
  duration = 0.08,
  type: OscillatorType = 'sine',
  volume = 0.05,
  delay = 0,
): void {
  if (!soundEnabled()) return;
  const ctx = audio();
  if (!ctx) return;

  const start = ctx.currentTime + delay;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

export const sounds = {
  pick: () => tone(520, 0.06, 'triangle', 0.035),
  drop: () => {
    tone(360, 0.07, 'sine', 0.045);
    tone(480, 0.09, 'sine', 0.035, 0.05);
  },
  check: () => tone(720, 0.07, 'triangle', 0.04),
  success: () => {
    tone(523, 0.1, 'triangle', 0.045);
    tone(659, 0.1, 'triangle', 0.04, 0.08);
    tone(784, 0.16, 'triangle', 0.035, 0.16);
  },
  error: () => {
    tone(220, 0.12, 'sawtooth', 0.025);
    tone(180, 0.16, 'sawtooth', 0.02, 0.1);
  },
};
