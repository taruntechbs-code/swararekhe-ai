/**
 * SWARAREKHE (Model SR-05) Tactile Mechanical Audio Engine
 * Pure Web Audio API micro-sound synthesizer delivering Teenage Engineering / Braun
 * style mechanical switch clicks, rotary detents, relay latches, and acoustic carriers.
 */

class HardwareSoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private noiseBuffer: AudioBuffer | null = null;
  private lastDetentTime: number = 0;
  
  // Real-time acoustic carrier state
  private carrierOsc: OscillatorNode | null = null;
  private carrierGain: GainNode | null = null;
  private carrierActive: boolean = false;

  constructor() {
    // Check localStorage preference if available
    try {
      const stored = localStorage.getItem('swararekhe_sound_muted');
      if (stored !== null) {
        this.muted = stored === 'true';
      }
    } catch {
      this.muted = false;
    }
  }

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.createNoiseBuffer();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private createNoiseBuffer() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 0.05; // 50ms of noise
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    try {
      localStorage.setItem('swararekhe_sound_muted', String(muted));
    } catch {
      // ignore storage error
    }
    if (muted && this.carrierActive) {
      this.stopCarrierTone();
    }
  }

  public toggleMuted(): boolean {
    const next = !this.muted;
    this.setMuted(next);
    if (!next) {
      this.playKeyClick();
    }
    return next;
  }

  /**
   * Ultra-short, crisp 8ms mechanical switch click (filtered noise burst + 1200Hz transient).
   * Evokes physical keycap bottoming out on a precision mechanical leaf-spring switch.
   */
  public playKeyClick() {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const t = ctx.currentTime;

    // 1. Transient click oscillator (1200Hz pitch drop)
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1250, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.009);

    oscGain.gain.setValueAtTime(0.22, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.009);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.012);

    // 2. High-pass noise snap
    if (this.noiseBuffer) {
      const noise = ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(2400, t);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.18, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.008);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noise.start(t);
      noise.stop(t + 0.01);
    }
  }

  /**
   * Subtle low-frequency 400Hz rotary encoder detent tick.
   * Triggered when sliding faders, scrubbing the map probe, or rotating dials.
   */
  public playRotaryDetent() {
    if (this.muted) return;
    const now = performance.now();
    // Throttle detents to avoid acoustic buzzing on rapid pointermove
    if (now - this.lastDetentTime < 24) return;
    this.lastDetentTime = now;

    const ctx = this.initContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.012);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.012);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.015);
  }

  /**
   * Warm 2-tone mechanical relay latch confirmation chime (520Hz -> 659Hz).
   * Triggered when a morphological transduction or graph injection executes.
   */
  public playRelayLatch() {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const t = ctx.currentTime;

    // Relay mechanical contact click
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    clickOsc.type = 'square';
    clickOsc.frequency.setValueAtTime(800, t);
    clickOsc.frequency.exponentialRampToValueAtTime(100, t + 0.01);
    clickGain.gain.setValueAtTime(0.15, t);
    clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.01);
    clickOsc.connect(clickGain);
    clickGain.connect(ctx.destination);
    clickOsc.start(t);
    clickOsc.stop(t + 0.012);

    // Tone 1: 520Hz
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, t + 0.01); // C5
    gain1.gain.setValueAtTime(0.001, t);
    gain1.gain.linearRampToValueAtTime(0.14, t + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(t + 0.01);
    osc1.stop(t + 0.1);

    // Tone 2: 659Hz (E5 harmonic)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25, t + 0.06); // E5
    gain2.gain.setValueAtTime(0.001, t + 0.06);
    gain2.gain.linearRampToValueAtTime(0.16, t + 0.075);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(t + 0.06);
    osc2.stop(t + 0.24);
  }

  /**
   * Start a continuous carrier tone whose frequency tracks interpolated regional F0 (135Hz - 210Hz)
   * while dragging the isogloss transceiver probe.
   */
  public startCarrierTone(initialHz: number = 160) {
    if (this.muted) return;
    if (this.carrierActive) {
      this.updateCarrierPitch(initialHz);
      return;
    }

    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Soft harmonic timbre (triangle + lowpass)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(initialHz, ctx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1100, ctx.currentTime);

      // Subtle, non-fatiguing volume
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.065, ctx.currentTime + 0.05);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start();

      this.carrierOsc = osc;
      this.carrierGain = gain;
      this.carrierActive = true;
    } catch {
      // Audio driver fallback
    }
  }

  /**
   * Smoothly glides the acoustic carrier pitch in real time as user drags across isogloss borders.
   */
  public updateCarrierPitch(targetHz: number) {
    if (!this.carrierActive || !this.carrierOsc || !this.ctx || this.muted) return;
    try {
      const clampedHz = Math.max(90, Math.min(320, targetHz));
      this.carrierOsc.frequency.cancelScheduledValues(this.ctx.currentTime);
      this.carrierOsc.frequency.linearRampToValueAtTime(clampedHz, this.ctx.currentTime + 0.035);
    } catch {
      // ignore schedule conflict
    }
  }

  /**
   * Stops the acoustic carrier tone with a soft 60ms fade out.
   */
  public stopCarrierTone() {
    if (!this.carrierActive || !this.carrierGain || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      this.carrierGain.gain.cancelScheduledValues(t);
      this.carrierGain.gain.setValueAtTime(this.carrierGain.gain.value, t);
      this.carrierGain.gain.linearRampToValueAtTime(0.0001, t + 0.06);

      const osc = this.carrierOsc;
      setTimeout(() => {
        try {
          osc?.stop();
          osc?.disconnect();
        } catch {
          // ignore
        }
      }, 70);
    } catch {
      // ignore
    } finally {
      this.carrierOsc = null;
      this.carrierGain = null;
      this.carrierActive = false;
    }
  }

  public isCarrierRunning(): boolean {
    return this.carrierActive;
  }
}

export const hardwareSoundEngine = new HardwareSoundEngine();
export default hardwareSoundEngine;
