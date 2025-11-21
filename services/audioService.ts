let audioCtx: AudioContext | null = null;
let isMuted = false;

export const setMuted = (muted: boolean) => {
  isMuted = muted;
};

export const playSound = (type: 'click' | 'pop' | 'success' | 'error' | 'scribble') => {
  if (isMuted) return;

  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const now = audioCtx.currentTime;

  switch (type) {
    case 'click': // High pitch "pop" for buttons
      {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        osc.start(now);
        osc.stop(now + 0.1);
      }
      break;

    case 'pop': // Lower "thud" for tabs - SHORTENED to 0.05s
      {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.05);

        osc.start(now);
        osc.stop(now + 0.05);
      }
      break;

    case 'scribble': // Scratchy noise for writing numbers
      {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.type = 'square';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(600, now + 0.05);

        gain.gain.setValueAtTime(0.03, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.05);

        osc.start(now);
        osc.stop(now + 0.05);
      }
      break;

    case 'success': // Happy major chord
      {
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C Major Arpeggio
        notes.forEach((freq, i) => {
          const osc = audioCtx!.createOscillator();
          const gain = audioCtx!.createGain();
          osc.connect(gain);
          gain.connect(audioCtx!.destination);

          osc.type = 'sine';
          osc.frequency.value = freq;

          const startTime = now + i * 0.08;
          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(0.05, startTime + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);

          osc.start(startTime);
          osc.stop(startTime + 0.5);
        });
      }
      break;

    case 'error': // Low buzzer
      {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.4);

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.4);

        osc.start(now);
        osc.stop(now + 0.4);
      }
      break;
  }
};