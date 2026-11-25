// Warung Rush — audio.js
// Every sound is synthesised with WebAudio oscillators: no audio files,
// no network, and nothing to load. The engine starts lazily on the first
// user gesture, because browsers block audio before any interaction.

export class SoundEngine {
  constructor() {
    this.context = null;
    this.muted = false;
    this.sizzleNodes = null;
  }

  ensureContext() {
    if (this.context) {
      if (this.context.state === 'suspended') void this.context.resume();
      return this.context;
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    this.context = new AudioContext();
    return this.context;
  }

  // Warm the audio context up on the first click, so the first real sound
  // is never swallowed by the browser's autoplay policy.
  prime() {
    this.ensureContext();
  }

  // Silence everything (used when the tab hides or the game is muted).
  stopAll() {
    this.sizzleStop();
  }

  // One short tone: frequency slides from `from` to `to` over `seconds`.
  tone(from, to, seconds, type, volume) {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(from, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), now + seconds);
    gain.gain.setValueAtTime(volume || 0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + seconds);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + seconds + 0.02);
  }

  click() {
    this.tone(700, 500, 0.06, 'triangle', 0.08);
  }

  chop() {
    this.tone(300, 90, 0.09, 'square', 0.1);
  }

  // A burst of high crackle while the wok is cooking.
  sizzleStart() {
    if (this.muted || this.sizzleNodes) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 4000;
    const gain = ctx.createGain();
    gain.gain.value = 0.03;
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
    this.sizzleNodes = { noise, gain };
  }

  sizzleStop() {
    if (!this.sizzleNodes) return;
    try { this.sizzleNodes.noise.stop(); } catch (e) { /* already stopped */ }
    this.sizzleNodes = null;
  }

  ding() {
    this.tone(880, 880, 0.18, 'sine', 0.14);
    setTimeout(() => this.tone(1318, 1318, 0.25, 'sine', 0.12), 90);
  }

  buzz() {
    this.tone(160, 110, 0.25, 'sawtooth', 0.1);
  }

  burn() {
    this.tone(220, 60, 0.5, 'sawtooth', 0.1);
  }

  // A tiny pentatonic jingle for the title screen and the shift's end.
  jingle() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((note, i) => {
      setTimeout(() => this.tone(note, note, 0.22, 'triangle', 0.1), i * 110);
    });
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) this.sizzleStop();
    return this.muted;
  }
}
