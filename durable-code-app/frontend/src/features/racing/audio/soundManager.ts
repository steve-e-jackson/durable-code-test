/**
 * Purpose: Sound effects manager for racing game
 * Scope: Engine sounds, collision sounds, and audio management
 * Overview: Generates synthetic audio effects using Web Audio API for racing game
 * Dependencies: Web Audio API
 * Exports: SoundManager class
 * Implementation: Procedural audio synthesis without external sound files
 */

/**
 * Sound manager for racing game audio effects
 */
export class SoundManager {
  private audioContext: AudioContext | null = null;
  private engineOscillator: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private isEngineRunning = false;
  private masterGain: GainNode | null = null;

  /**
   * Initialize the audio context and engine sound
   */
  public initialize(): void {
    if (this.audioContext) return;

    try {
      this.audioContext = new (window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext)();

      // Master gain for overall volume control
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.3; // 30% volume
      this.masterGain.connect(this.audioContext.destination);

      // Create engine sound nodes (but don't start yet)
      this.setupEngineSound();
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  /**
   * Setup engine sound oscillator
   */
  private setupEngineSound(): void {
    if (!this.audioContext || !this.masterGain) return;

    // Create oscillator for engine sound
    this.engineOscillator = this.audioContext.createOscillator();
    this.engineOscillator.type = 'sawtooth'; // Rich, engine-like sound
    this.engineOscillator.frequency.value = 80; // Base engine frequency

    // Create gain node for engine volume
    this.engineGain = this.audioContext.createGain();
    this.engineGain.gain.value = 0; // Start silent

    // Connect: oscillator -> gain -> master -> destination
    this.engineOscillator.connect(this.engineGain);
    this.engineGain.connect(this.masterGain);
  }

  /**
   * Start engine sound
   */
  public startEngine(): void {
    if (!this.audioContext || this.isEngineRunning || !this.engineOscillator) {
      return;
    }

    try {
      this.engineOscillator.start();
      this.isEngineRunning = true;
    } catch (error) {
      console.warn('Failed to start engine sound:', error);
    }
  }

  /**
   * Stop engine sound
   */
  public stopEngine(): void {
    if (!this.isEngineRunning || !this.engineGain) return;

    // Fade out
    if (this.audioContext && this.engineGain) {
      this.engineGain.gain.setTargetAtTime(0, this.audioContext.currentTime, 0.1);
    }
  }

  /**
   * Update engine sound based on speed
   *
   * @param speed Current car speed
   */
  public updateEngineSound(speed: number): void {
    if (
      !this.audioContext ||
      !this.engineOscillator ||
      !this.engineGain ||
      !this.isEngineRunning
    ) {
      return;
    }

    const now = this.audioContext.currentTime;

    // Map speed to frequency (80Hz idle to 300Hz max)
    const minFreq = 80;
    const maxFreq = 300;
    const frequency = minFreq + (speed / 10) * (maxFreq - minFreq);
    this.engineOscillator.frequency.setTargetAtTime(
      Math.min(maxFreq, Math.max(minFreq, frequency)),
      now,
      0.1,
    );

    // Map speed to volume (0.1 idle to 0.5 max)
    const minVolume = 0.1;
    const maxVolume = 0.5;
    const volume = minVolume + (speed / 10) * (maxVolume - minVolume);
    this.engineGain.gain.setTargetAtTime(
      Math.min(maxVolume, Math.max(minVolume, volume)),
      now,
      0.05,
    );
  }

  /**
   * Play collision sound effect
   *
   * @param intensity Collision intensity (0-1)
   */
  public playCollisionSound(intensity: number = 0.5): void {
    if (!this.audioContext || !this.masterGain) return;

    try {
      const now = this.audioContext.currentTime;

      // Create noise buffer for crash sound
      const duration = 0.2;
      const sampleRate = this.audioContext.sampleRate;
      const bufferSize = sampleRate * duration;
      const buffer = this.audioContext.createBuffer(1, bufferSize, sampleRate);
      const data = buffer.getChannelData(0);

      // Generate white noise with decay
      for (let i = 0; i < bufferSize; i++) {
        const decay = 1 - i / bufferSize;
        data[i] = (Math.random() * 2 - 1) * decay;
      }

      // Create buffer source
      const noise = this.audioContext.createBufferSource();
      noise.buffer = buffer;

      // Create filter for metallic crash sound
      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 800; // Metallic frequency
      filter.Q.value = 2;

      // Create gain for collision volume
      const collisionGain = this.audioContext.createGain();
      collisionGain.gain.value = Math.min(1, intensity) * 0.8;

      // Connect: noise -> filter -> gain -> master -> destination
      noise.connect(filter);
      filter.connect(collisionGain);
      collisionGain.connect(this.masterGain);

      // Play and cleanup
      noise.start(now);
      noise.stop(now + duration);
    } catch (error) {
      console.warn('Failed to play collision sound:', error);
    }
  }

  /**
   * Cleanup and dispose audio resources
   */
  public dispose(): void {
    this.stopEngine();

    if (this.engineOscillator && this.isEngineRunning) {
      try {
        this.engineOscillator.stop();
      } catch {
        // Already stopped
      }
    }

    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch {
        // Already closed
      }
    }

    this.audioContext = null;
    this.engineOscillator = null;
    this.engineGain = null;
    this.masterGain = null;
    this.isEngineRunning = false;
  }

  /**
   * Set master volume
   *
   * @param volume Volume level (0-1)
   */
  public setVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }
}
