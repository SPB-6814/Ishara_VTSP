/**
 * Web Audio API synthesized chimes for hospital clinician station.
 * Zero external audio files required, zero latency, guaranteed browser support.
 */

class ClinicalAudioAlerts {
  private ctx: AudioContext | null = null

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
    return this.ctx
  }

  /**
   * Pleasant ascending hospital chime when paging starts
   */
  playPagingStart(): void {
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(440, now) // A4
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.15) // E5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.3) // A5

      gain.gain.setValueAtTime(0.001, now)
      gain.gain.linearRampToValueAtTime(0.15, now + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.55)
    } catch {
      // Audio playback fails gracefully if muted by browser
    }
  }

  /**
   * 2-tone clinical alert when 60s interpreter page times out
   */
  playInterpreterTimeoutAlert(): void {
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const now = ctx.currentTime

      // Tone 1: 784 Hz (G5)
      const osc1 = ctx.createOscillator()
      const gain1 = ctx.createGain()
      osc1.type = 'triangle'
      osc1.frequency.setValueAtTime(784, now)

      gain1.gain.setValueAtTime(0.2, now)
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.25)
      osc1.connect(gain1)
      gain1.connect(ctx.destination)
      osc1.start(now)
      osc1.stop(now + 0.28)

      // Tone 2: 523 Hz (C5)
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.type = 'triangle'
      osc2.frequency.setValueAtTime(523, now + 0.25)

      gain2.gain.setValueAtTime(0.25, now + 0.25)
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65)
      osc2.connect(gain2)
      gain2.connect(ctx.destination)
      osc2.start(now + 0.25)
      osc2.stop(now + 0.7)
    } catch {
      // Audio failure ignored gracefully
    }
  }
}

export const clinicalAudio = new ClinicalAudioAlerts()
