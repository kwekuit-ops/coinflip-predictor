const playSound = (frequency, duration, type = 'sine') => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  } catch (e) {
    console.warn("Audio Context not supported");
  }
};

export const playFlipSound = () => {
  playSound(440, 0.1, 'square');
  setTimeout(() => playSound(880, 0.1, 'square'), 50);
};

export const playWinSound = () => {
  [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
    setTimeout(() => playSound(freq, 0.3, 'sine'), i * 100);
  });
};

export const playLossSound = () => {
  playSound(110, 0.5, 'sawtooth');
};

export const playScanSound = () => {
  playSound(1200, 0.05, 'sine');
};
